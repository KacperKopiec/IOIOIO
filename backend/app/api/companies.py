import csv
import io
import uuid
from pathlib import Path
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.api.deps import DbDep
from app.models.activity import Activity
from app.models.company import Company
from app.models.contact import Contact
from app.models.document import Document
from app.models.enums import CompanySize, RelationshipStatus, StageOutcome
from app.models.event import Event
from app.models.pipeline import PipelineEntry, PipelineStage
from app.models.relationship import CompanyRelationship
from app.models.tag import Tag
from app.schemas.common import Page, PageParams
from app.schemas.company import CompanyCreate, CompanyOut, CompanyUpdate
from app.schemas.contact import ContactOut
from app.schemas.document import DocumentCreate, DocumentOut

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
        .options(
            selectinload(Company.industry),
            selectinload(Company.tags),
            selectinload(Company.owner_user),
        )
        .where(Company.id == company_id)
    )
    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Firma nie istnieje"
        )
    return company


def _companies_base_query(
    q: str | None = None,
    industry_id: int | None = None,
    company_size: CompanySize | None = None,
    tag_ids: str | None = None,
    relation_status: Literal["active", "inactive"] | None = None,
    relationship_type_id: int | None = None,
    cooperation_year: int | None = None,
    owner_user_id: int | None = None,
    event_id: int | None = None,
    pipeline_stage_id: int | None = None,
    pipeline_outcome: StageOutcome | None = None,
    company_ids: str | None = None,
):
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
    if owner_user_id is not None:
        base = base.where(Company.owner_user_id == owner_user_id)

    parsed_tags = _parse_csv_int(tag_ids)
    if parsed_tags:
        for tag_id in parsed_tags:
            base = base.where(Company.tags.any(Tag.id == tag_id))

    parsed_company_ids = _parse_csv_int(company_ids)
    if parsed_company_ids:
        base = base.where(Company.id.in_(parsed_company_ids))

    if relation_status is not None:
        has_active = (
            select(CompanyRelationship.id)
            .where(
                CompanyRelationship.company_id == Company.id,
                CompanyRelationship.status == RelationshipStatus.ACTIVE,
            )
            .exists()
        )
        base = base.where(has_active if relation_status == "active" else ~has_active)

    if relationship_type_id is not None:
        relationship_match = (
            select(CompanyRelationship.id)
            .where(
                CompanyRelationship.company_id == Company.id,
                CompanyRelationship.relationship_type_id == relationship_type_id,
            )
            .exists()
        )
        base = base.where(relationship_match)

    if event_id is not None:
        event_relationship_match = (
            select(CompanyRelationship.id)
            .where(
                CompanyRelationship.company_id == Company.id,
                CompanyRelationship.event_id == event_id,
            )
            .exists()
        )
        event_pipeline_match = (
            select(PipelineEntry.id)
            .where(
                PipelineEntry.company_id == Company.id,
                PipelineEntry.event_id == event_id,
            )
            .exists()
        )
        base = base.where(or_(event_relationship_match, event_pipeline_match))

    if cooperation_year is not None:
        year = cooperation_year
        relationship_year_match = (
            select(CompanyRelationship.id)
            .join(Event, CompanyRelationship.event_id == Event.id, isouter=True)
            .where(
                CompanyRelationship.company_id == Company.id,
                or_(
                    func.extract("year", CompanyRelationship.contract_signed_at)
                    == year,
                    func.extract("year", CompanyRelationship.start_date) == year,
                    func.extract("year", CompanyRelationship.end_date) == year,
                    func.extract("year", Event.start_date) == year,
                    func.extract("year", Event.end_date) == year,
                ),
            )
            .exists()
        )
        pipeline_year_match = (
            select(PipelineEntry.id)
            .join(Event, PipelineEntry.event_id == Event.id)
            .where(
                PipelineEntry.company_id == Company.id,
                or_(
                    func.extract("year", PipelineEntry.closed_at) == year,
                    func.extract("year", PipelineEntry.first_contact_at) == year,
                    func.extract("year", PipelineEntry.offer_sent_at) == year,
                    func.extract("year", Event.start_date) == year,
                    func.extract("year", Event.end_date) == year,
                ),
            )
            .exists()
        )
        base = base.where(or_(relationship_year_match, pipeline_year_match))

    if pipeline_stage_id is not None or pipeline_outcome is not None:
        pipeline_match = (
            select(PipelineEntry.id)
            .join(PipelineStage, PipelineEntry.stage_id == PipelineStage.id)
            .where(PipelineEntry.company_id == Company.id)
        )
        if event_id is not None:
            pipeline_match = pipeline_match.where(PipelineEntry.event_id == event_id)
        if pipeline_stage_id is not None:
            pipeline_match = pipeline_match.where(
                PipelineEntry.stage_id == pipeline_stage_id
            )
        if pipeline_outcome is not None:
            pipeline_match = pipeline_match.where(
                PipelineStage.outcome == pipeline_outcome
            )
        base = base.where(pipeline_match.exists())

    return base


def _serialize_companies(db, companies: list[Company]) -> list[CompanyOut]:
    if not companies:
        return []
    ids = [c.id for c in companies]
    partner_ids = set(
        db.scalars(
            select(PipelineEntry.company_id)
            .join(PipelineStage, PipelineEntry.stage_id == PipelineStage.id)
            .where(
                PipelineEntry.company_id.in_(ids),
                PipelineStage.outcome == StageOutcome.WON,
            )
        ).all()
    )
    last_contact_rows = db.execute(
        select(Activity.company_id, func.max(Activity.activity_date))
        .where(Activity.company_id.in_(ids))
        .group_by(Activity.company_id)
    ).all()
    last_contact_by_id = {cid: ts for cid, ts in last_contact_rows}

    out: list[CompanyOut] = []
    for c in companies:
        model = CompanyOut.model_validate(c)
        model.is_partner = c.id in partner_ids
        model.last_contact_at = last_contact_by_id.get(c.id)
        out.append(model)
    return out


def _format_dt(value) -> str:
    return value.isoformat() if value else ""


def _format_bool(value: bool) -> str:
    return "true" if value else "false"


def _owner_name(company: Company) -> str:
    if company.owner_user is None:
        return ""
    return f"{company.owner_user.first_name} {company.owner_user.last_name}"


def _contact_names(company: Company) -> str:
    return " | ".join(f"{c.first_name} {c.last_name}" for c in company.contacts)


def _contact_values(company: Company, field: str) -> str:
    return " | ".join(
        value for contact in company.contacts if (value := getattr(contact, field))
    )


@router.get("", response_model=Page[CompanyOut])
def list_companies(
    db: DbDep,
    page_params: Annotated[PageParams, Depends()],
    q: str | None = Query(default=None, description="szukaj po name/legal_name/nip/city"),
    industry_id: int | None = None,
    company_size: CompanySize | None = None,
    tag_ids: str | None = Query(default=None, description="lista CSV identyfikatorów tagów"),
    relation_status: Literal["active", "inactive"] | None = None,
    relationship_type_id: int | None = Query(
        default=None,
        description="firmy z relacją wybranego typu, np. sponsor/partner/rekrutacja",
    ),
    cooperation_year: int | None = Query(
        default=None,
        ge=2000,
        le=2100,
        description="firmy ze współpracą lub lejkiem w wybranym roku",
    ),
    owner_user_id: int | None = Query(
        default=None,
        description="firmy przypisane do wybranego opiekuna relacji",
    ),
    event_id: int | None = Query(
        default=None,
        description="firmy powiązane z wybraną inicjatywą/wydarzeniem",
    ),
    pipeline_stage_id: int | None = Query(
        default=None,
        description="firmy mające wpis w lejku na wybranym etapie",
    ),
    pipeline_outcome: StageOutcome | None = Query(
        default=None,
        description="firmy mające wpis w lejku o wyniku open/won/lost",
    ),
) -> Page[CompanyOut]:
    base = _companies_base_query(
        q=q,
        industry_id=industry_id,
        company_size=company_size,
        tag_ids=tag_ids,
        relation_status=relation_status,
        relationship_type_id=relationship_type_id,
        cooperation_year=cooperation_year,
        owner_user_id=owner_user_id,
        event_id=event_id,
        pipeline_stage_id=pipeline_stage_id,
        pipeline_outcome=pipeline_outcome,
    )
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    stmt = (
        base.options(
            selectinload(Company.industry),
            selectinload(Company.tags),
            selectinload(Company.owner_user),
        )
        .order_by(Company.name)
        .offset(page_params.offset)
        .limit(page_params.page_size)
    )
    items = list(db.scalars(stmt).all())
    return Page[CompanyOut].build(
        items=_serialize_companies(db, items),
        total=total,
        page=page_params.page,
        page_size=page_params.page_size,
    )


@router.get("/export")
def export_companies(
    db: DbDep,
    q: str | None = Query(default=None, description="szukaj po name/legal_name/nip/city"),
    industry_id: int | None = None,
    company_size: CompanySize | None = None,
    tag_ids: str | None = Query(default=None, description="lista CSV identyfikatorów tagów"),
    relation_status: Literal["active", "inactive"] | None = None,
    relationship_type_id: int | None = Query(
        default=None,
        description="firmy z relacją wybranego typu, np. sponsor/partner/rekrutacja",
    ),
    cooperation_year: int | None = Query(
        default=None,
        ge=2000,
        le=2100,
        description="firmy ze współpracą lub lejkiem w wybranym roku",
    ),
    owner_user_id: int | None = Query(
        default=None,
        description="firmy przypisane do wybranego opiekuna relacji",
    ),
    event_id: int | None = Query(
        default=None,
        description="firmy powiązane z wybraną inicjatywą/wydarzeniem",
    ),
    pipeline_stage_id: int | None = Query(
        default=None,
        description="firmy mające wpis w lejku na wybranym etapie",
    ),
    pipeline_outcome: StageOutcome | None = Query(
        default=None,
        description="firmy mające wpis w lejku o wyniku open/won/lost",
    ),
    company_ids: str | None = Query(default=None, description="lista CSV identyfikatorów firm"),
) -> Response:
    stmt = (
        _companies_base_query(
            q=q,
            industry_id=industry_id,
            company_size=company_size,
            tag_ids=tag_ids,
            relation_status=relation_status,
            relationship_type_id=relationship_type_id,
            cooperation_year=cooperation_year,
            owner_user_id=owner_user_id,
            event_id=event_id,
            pipeline_stage_id=pipeline_stage_id,
            pipeline_outcome=pipeline_outcome,
            company_ids=company_ids,
        )
        .options(
            selectinload(Company.industry),
            selectinload(Company.tags),
            selectinload(Company.contacts),
            selectinload(Company.owner_user),
        )
        .order_by(Company.name)
    )
    companies = list(db.scalars(stmt).all())
    serialized_by_id = {
        company.id: model
        for company, model in zip(
            companies, _serialize_companies(db, companies), strict=True
        )
    }

    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\n")
    writer.writerow(
        [
            "id",
            "name",
            "legal_name",
            "nip",
            "website",
            "industry",
            "company_size",
            "country",
            "city",
            "owner",
            "owner_email",
            "is_partner",
            "last_contact_at",
            "tags",
            "contact_names",
            "contact_emails",
            "contact_phones",
            "description",
            "notes",
            "created_at",
            "updated_at",
        ]
    )
    for company in companies:
        serialized = serialized_by_id[company.id]
        writer.writerow(
            [
                company.id,
                company.name,
                company.legal_name or "",
                company.nip or "",
                company.website or "",
                company.industry.name if company.industry else "",
                company.company_size.value if company.company_size else "",
                company.country or "",
                company.city or "",
                _owner_name(company),
                company.owner_user.email if company.owner_user else "",
                _format_bool(serialized.is_partner),
                _format_dt(serialized.last_contact_at),
                ", ".join(
                    tag.name for tag in sorted(company.tags, key=lambda tag: tag.name)
                ),
                _contact_names(company),
                _contact_values(company, "email"),
                _contact_values(company, "phone"),
                company.description or "",
                company.notes or "",
                _format_dt(company.created_at),
                _format_dt(company.updated_at),
            ]
        )

    return Response(
        content=("\ufeff" + output.getvalue()).encode("utf-8"),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="companies-export.csv"'},
    )


@router.get("/{company_id}", response_model=CompanyOut)
def get_company(company_id: int, db: DbDep) -> CompanyOut:
    company = _load_company(db, company_id)
    return _serialize_companies(db, [company])[0]


@router.post("", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
def create_company(payload: CompanyCreate, db: DbDep) -> CompanyOut:
    data = payload.model_dump(exclude={"tag_ids"})
    company = Company(**data)
    if payload.tag_ids:
        company.tags = list(
            db.scalars(select(Tag).where(Tag.id.in_(payload.tag_ids))).all()
        )
    db.add(company)
    db.commit()
    db.refresh(company)
    return _serialize_companies(db, [_load_company(db, company.id)])[0]


@router.patch("/{company_id}", response_model=CompanyOut)
def update_company(company_id: int, payload: CompanyUpdate, db: DbDep) -> CompanyOut:
    company = _load_company(db, company_id)
    data = payload.model_dump(exclude_unset=True)
    tag_ids = data.pop("tag_ids", None)
    for key, value in data.items():
        setattr(company, key, value)
    if tag_ids is not None:
        company.tags = list(db.scalars(select(Tag).where(Tag.id.in_(tag_ids))).all())
    db.commit()
    db.refresh(company)
    return _serialize_companies(db, [_load_company(db, company.id)])[0]


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
            "closed_at": entry.closed_at,
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


@router.get("/{company_id}/documents", response_model=list[DocumentOut])
def list_company_documents(company_id: int, db: DbDep, include_archived: bool = Query(default=False)) -> list[Document]:
    from sqlalchemy.orm import selectinload
    _load_company(db, company_id)
    stmt = (
        select(Document)
        .options(selectinload(Document.uploaded_by))
        .where(Document.company_id == company_id)
    )
    if not include_archived:
        stmt = stmt.where(Document.archived == False)
    stmt = stmt.order_by(Document.created_at.desc())
    docs = db.scalars(stmt).all()
    return [
        DocumentOut(
            id=doc.id,
            file_name=doc.file_name,
            file_url=doc.file_url,
            document_type=doc.document_type,
            archived=doc.archived,
            created_at=doc.created_at,
            updated_at=doc.updated_at,
            uploaded_by_user_id=doc.uploaded_by_user_id,
            uploaded_by_name=doc.uploaded_by.first_name + " " + doc.uploaded_by.last_name if doc.uploaded_by else None,
        )
        for doc in docs
    ]


@router.post("/{company_id}/documents", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def create_company_document(
    company_id: int,
    payload: DocumentCreate,
    db: DbDep,
    user_id: int | None = Query(default=None),
) -> Document:
    _load_company(db, company_id)
    doc = Document(
        company_id=company_id,
        uploaded_by_user_id=user_id,
        **payload.model_dump(),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.post("/{company_id}/documents/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_company_document(
    company_id: int,
    db: DbDep,
    file: UploadFile = File(...),
    document_type: str | None = Query(default=None),
    user_id: int | None = Query(default=None),
) -> Document:
    _load_company(db, company_id)

    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Dozwolone są tylko pliki PDF")

    storage_dir = Path(__file__).parent.parent / "storage" / "documents"
    storage_dir.mkdir(parents=True, exist_ok=True)

    file_ext = ".pdf"
    file_name = f"{uuid.uuid4()}{file_ext}"
    file_path = storage_dir / file_name

    content = await file.read()
    file_path.write_bytes(content)

    doc = Document(
        company_id=company_id,
        uploaded_by_user_id=user_id,
        file_name=file.filename or "dokument.pdf",
        file_url=f"/storage/documents/{file_name}",
        document_type=document_type,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/{company_id}/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company_document(company_id: int, document_id: int, db: DbDep) -> None:
    _load_company(db, company_id)
    stmt = select(Document).where(
        Document.id == document_id,
        Document.company_id == company_id,
    )
    doc = db.execute(stmt).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokument nie znaleziony")
    db.delete(doc)
    db.commit()


@router.post("/{company_id}/documents/{document_id}/archive", response_model=DocumentOut)
def archive_company_document(company_id: int, document_id: int, db: DbDep) -> Document:
    _load_company(db, company_id)
    stmt = select(Document).where(
        Document.id == document_id,
        Document.company_id == company_id,
    )
    doc = db.execute(stmt).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokument nie znaleziony")
    doc.archived = True
    db.commit()
    db.refresh(doc)
    return doc


@router.post("/{company_id}/documents/{document_id}/unarchive", response_model=DocumentOut)
def unarchive_company_document(company_id: int, document_id: int, db: DbDep) -> Document:
    _load_company(db, company_id)
    stmt = select(Document).where(
        Document.id == document_id,
        Document.company_id == company_id,
    )
    doc = db.execute(stmt).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokument nie znaleziony")
    doc.archived = False
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{company_id}/report")
def get_company_report(company_id: int, db: DbDep) -> dict:
    from sqlalchemy import func
    from app.models.pipeline import PipelineEntry, PipelineStage
    from app.models.activity import Activity
    from app.models.relationship import CompanyRelationship
    from app.models.enums import StageOutcome, RelationshipStatus

    company = _load_company(db, company_id)

    pipeline_rows = db.execute(
        select(
            PipelineStage.name,
            PipelineStage.outcome,
            func.count(PipelineEntry.id).label("count"),
            func.coalesce(func.sum(PipelineEntry.expected_amount), 0).label("value"),
        )
        .join(PipelineStage, PipelineEntry.stage_id == PipelineStage.id)
        .where(PipelineEntry.company_id == company_id)
        .group_by(PipelineStage.id, PipelineStage.name, PipelineStage.outcome)
        .order_by(PipelineStage.order_number)
    ).all()

    stages_data = [
        {
            "stage_name": r.name,
            "stage_outcome": r.outcome.value if r.outcome else None,
            "count": r.count,
            "value": int(r.value),
        }
        for r in pipeline_rows
    ]

    activities = db.execute(
        select(Activity)
        .where(Activity.company_id == company_id)
        .order_by(Activity.activity_date.desc().nullslast())
        .limit(20)
    ).scalars().all()

    activities_data = [
        {
            "activity_type": a.activity_type.value,
            "subject": a.subject,
            "activity_date": a.activity_date.isoformat() if a.activity_date else None,
            "due_date": a.due_date.isoformat() if a.due_date else None,
            "completed_at": a.completed_at.isoformat() if a.completed_at else None,
        }
        for a in activities
    ]

    relationships = db.execute(
        select(CompanyRelationship)
        .where(CompanyRelationship.company_id == company_id)
        .where(CompanyRelationship.status == RelationshipStatus.ACTIVE)
    ).scalars().all()

    partnerships_data = [
        {
            "event_id": r.event.id if r.event else None,
            "event_name": r.event.name if r.event else None,
            "package_name": r.package_name,
            "amount_net": int(r.amount_net) if r.amount_net else 0,
            "amount_gross": int(r.amount_gross) if r.amount_gross else 0,
            "contract_signed_at": r.contract_signed_at.isoformat() if r.contract_signed_at else None,
            "start_date": r.start_date.isoformat() if r.start_date else None,
            "end_date": r.end_date.isoformat() if r.end_date else None,
        }
        for r in relationships
    ]

    total_pipeline_value = sum(
        r.value for r in pipeline_rows if r.outcome == StageOutcome.WON
    )

    return {
        "company_id": company.id,
        "company_name": company.name,
        "legal_name": company.legal_name,
        "city": company.city,
        "industry": company.industry.name if company.industry else None,
        "stages": stages_data,
        "activities": activities_data,
        "partnerships": partnerships_data,
        "total_pipeline_won_value": total_pipeline_value,
        "total_partnerships": len(relationships),
    }
