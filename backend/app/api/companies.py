from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.api.deps import DbDep
from app.models.activity import Activity
from app.models.company import Company
from app.models.contact import Contact
from app.models.enums import CompanySize, RelationshipStatus
from app.models.event import Event
from app.models.pipeline import PipelineEntry, PipelineStage
from app.models.relationship import CompanyRelationship
from app.models.tag import Tag
from app.schemas.common import Page, PageParams
from app.schemas.company import CompanyCreate, CompanyOut, CompanyUpdate
from app.schemas.contact import ContactOut

router = APIRouter(prefix="/companies", tags=["companies"])


def _parse_csv_int(value: str | None) -> list[int]:
    if not value:
        return []
    parts: list[int] = []
    for item in value.split(","):
        item = item.strip()
        if not item:
            continue
        try:
            parts.append(int(item))
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Nieprawidłowy identyfikator w liście: {item}",
            ) from exc
    return parts


def _load_company(db, company_id: int) -> Company:
    company = db.scalar(
        select(Company)
        .options(selectinload(Company.industry), selectinload(Company.tags))
        .where(Company.id == company_id)
    )
    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Firma nie istnieje"
        )
    return company


@router.get("", response_model=Page[CompanyOut])
def list_companies(
    db: DbDep,
    page_params: Annotated[PageParams, Depends()],
    q: str | None = Query(default=None, description="szukaj po name/legal_name/nip/city"),
    industry_id: int | None = None,
    company_size: CompanySize | None = None,
    tag_ids: str | None = Query(default=None, description="lista CSV identyfikatorów tagów"),
    relation_status: Literal["active", "inactive"] | None = None,
) -> Page[CompanyOut]:
    base = select(Company)
    if q:
        like = f"%{q.lower()}%"
        base = base.where(
            or_(
                func.lower(Company.name).like(like),
                func.lower(Company.legal_name).like(like),
                func.lower(Company.nip).like(like),
                func.lower(Company.city).like(like),
            )
        )
    if industry_id is not None:
        base = base.where(Company.industry_id == industry_id)
    if company_size is not None:
        base = base.where(Company.company_size == company_size)

    parsed_tags = _parse_csv_int(tag_ids)
    if parsed_tags:
        for tag_id in parsed_tags:
            base = base.where(Company.tags.any(Tag.id == tag_id))

    if relation_status is not None:
        has_active = (
            select(CompanyRelationship.id)
            .where(
                CompanyRelationship.company_id == Company.id,
                CompanyRelationship.status == RelationshipStatus.ACTIVE,
            )
            .exists()
        )
        if relation_status == "active":
            base = base.where(has_active)
        else:
            base = base.where(~has_active)

    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    stmt = (
        base.options(selectinload(Company.industry), selectinload(Company.tags))
        .order_by(Company.name)
        .offset(page_params.offset)
        .limit(page_params.page_size)
    )
    items = list(db.scalars(stmt).all())
    return Page[CompanyOut].build(
        items=[CompanyOut.model_validate(c) for c in items],
        total=total,
        page=page_params.page,
        page_size=page_params.page_size,
    )


@router.get("/{company_id}", response_model=CompanyOut)
def get_company(company_id: int, db: DbDep) -> Company:
    return _load_company(db, company_id)


@router.post("", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
def create_company(payload: CompanyCreate, db: DbDep) -> Company:
    data = payload.model_dump(exclude={"tag_ids"})
    company = Company(**data)
    if payload.tag_ids:
        company.tags = list(
            db.scalars(select(Tag).where(Tag.id.in_(payload.tag_ids))).all()
        )
    db.add(company)
    db.commit()
    db.refresh(company)
    return _load_company(db, company.id)


@router.patch("/{company_id}", response_model=CompanyOut)
def update_company(company_id: int, payload: CompanyUpdate, db: DbDep) -> Company:
    company = _load_company(db, company_id)
    data = payload.model_dump(exclude_unset=True)
    tag_ids = data.pop("tag_ids", None)
    for key, value in data.items():
        setattr(company, key, value)
    if tag_ids is not None:
        company.tags = list(db.scalars(select(Tag).where(Tag.id.in_(tag_ids))).all())
    db.commit()
    db.refresh(company)
    return _load_company(db, company.id)


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(company_id: int, db: DbDep) -> None:
    company = _load_company(db, company_id)
    db.delete(company)
    db.commit()


@router.get("/{company_id}/contacts", response_model=list[ContactOut])
def list_company_contacts(company_id: int, db: DbDep) -> list[Contact]:
    _load_company(db, company_id)
    return list(
        db.scalars(
            select(Contact)
            .where(Contact.company_id == company_id)
            .order_by(Contact.last_name, Contact.first_name)
        ).all()
    )


@router.get("/{company_id}/events")
def list_company_events(company_id: int, db: DbDep) -> list[dict]:
    _load_company(db, company_id)
    stmt = (
        select(PipelineEntry, Event, PipelineStage)
        .join(Event, PipelineEntry.event_id == Event.id)
        .join(PipelineStage, PipelineEntry.stage_id == PipelineStage.id)
        .where(PipelineEntry.company_id == company_id)
        .order_by(Event.start_date.desc().nullslast())
    )
    rows = db.execute(stmt).all()
    return [
        {
            "pipeline_entry_id": entry.id,
            "event_id": event.id,
            "event_name": event.name,
            "event_start_date": event.start_date,
            "event_end_date": event.end_date,
            "event_status": event.status.value,
            "stage_id": stage.id,
            "stage_name": stage.name,
            "stage_outcome": stage.outcome.value,
            "expected_amount": entry.expected_amount,
            "agreed_amount": entry.agreed_amount,
        }
        for entry, event, stage in rows
    ]


@router.get("/{company_id}/activities")
def list_company_activities(company_id: int, db: DbDep) -> list[dict]:
    _load_company(db, company_id)
    stmt = (
        select(Activity)
        .where(Activity.company_id == company_id)
        .order_by(Activity.activity_date.desc().nullslast(), Activity.created_at.desc())
    )
    return [
        {
            "id": a.id,
            "activity_type": a.activity_type.value,
            "subject": a.subject,
            "description": a.description,
            "activity_date": a.activity_date,
            "due_date": a.due_date,
            "completed_at": a.completed_at,
            "event_id": a.event_id,
            "pipeline_entry_id": a.pipeline_entry_id,
            "contact_id": a.contact_id,
            "assigned_user_id": a.assigned_user_id,
        }
        for a in db.scalars(stmt).all()
    ]
