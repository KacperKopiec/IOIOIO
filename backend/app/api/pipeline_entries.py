from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.api.deps import DbDep
from app.models.company import Company
from app.models.event import Event
from app.models.pipeline import PipelineEntry, PipelineStage
from app.schemas.pipeline_entry import (
    PipelineEntryCreate,
    PipelineEntryOut,
    PipelineEntryUpdate,
    PipelineMoveRequest,
)
from app.services.pipeline import move_pipeline_entry

router = APIRouter(prefix="/pipeline-entries", tags=["pipeline"])

_DUPLICATE_DETAIL = "Firma jest już przypisana do tego wydarzenia"


def _load_entry(db, entry_id: int) -> PipelineEntry:
    entry = db.scalar(
        select(PipelineEntry)
        .options(
            selectinload(PipelineEntry.stage),
            selectinload(PipelineEntry.company).selectinload(Company.industry),
            selectinload(PipelineEntry.company).selectinload(Company.tags),
        )
        .where(PipelineEntry.id == entry_id)
    )
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Wpis w lejku nie istnieje"
        )
    return entry


@router.get("", response_model=list[PipelineEntryOut])
def list_pipeline_entries(
    db: DbDep,
    event_id: int | None = Query(default=None),
    stage_id: int | None = Query(default=None),
    company_id: int | None = Query(default=None),
    owner_user_id: int | None = Query(default=None),
) -> list[PipelineEntry]:
    stmt = (
        select(PipelineEntry)
        .options(
            selectinload(PipelineEntry.stage),
            selectinload(PipelineEntry.company).selectinload(Company.industry),
            selectinload(PipelineEntry.company).selectinload(Company.tags),
        )
        .join(PipelineStage, PipelineEntry.stage_id == PipelineStage.id)
        .order_by(PipelineStage.order_number, PipelineEntry.id)
    )
    if event_id is not None:
        stmt = stmt.where(PipelineEntry.event_id == event_id)
    if stage_id is not None:
        stmt = stmt.where(PipelineEntry.stage_id == stage_id)
    if company_id is not None:
        stmt = stmt.where(PipelineEntry.company_id == company_id)
    if owner_user_id is not None:
        stmt = stmt.where(PipelineEntry.owner_user_id == owner_user_id)
    return list(db.scalars(stmt).all())


@router.get("/{entry_id}", response_model=PipelineEntryOut)
def get_pipeline_entry(entry_id: int, db: DbDep) -> PipelineEntry:
    return _load_entry(db, entry_id)


@router.post("", response_model=PipelineEntryOut, status_code=status.HTTP_201_CREATED)
def create_pipeline_entry(payload: PipelineEntryCreate, db: DbDep) -> PipelineEntry:
    if db.get(Event, payload.event_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Wydarzenie nie istnieje"
        )
    if db.get(Company, payload.company_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Firma nie istnieje"
        )

    stage_id = payload.stage_id
    if stage_id is None:
        first_stage = db.scalar(
            select(PipelineStage).order_by(PipelineStage.order_number).limit(1)
        )
        if first_stage is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Brak etapów lejka w bazie danych",
            )
        stage_id = first_stage.id
    elif db.get(PipelineStage, stage_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Etap lejka nie istnieje"
        )

    entry = PipelineEntry(
        event_id=payload.event_id,
        company_id=payload.company_id,
        stage_id=stage_id,
        owner_user_id=payload.owner_user_id,
        contact_person_id=payload.contact_person_id,
        expected_amount=payload.expected_amount,
        notes=payload.notes,
    )
    db.add(entry)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=_DUPLICATE_DETAIL)
    db.refresh(entry)
    return _load_entry(db, entry.id)


@router.patch("/{entry_id}", response_model=PipelineEntryOut)
def update_pipeline_entry(
    entry_id: int, payload: PipelineEntryUpdate, db: DbDep
) -> PipelineEntry:
    entry = _load_entry(db, entry_id)
    data = payload.model_dump(exclude_unset=True)
    if "stage_id" in data and data["stage_id"] is not None:
        if db.get(PipelineStage, data["stage_id"]) is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Etap lejka nie istnieje"
            )
    for key, value in data.items():
        setattr(entry, key, value)
    db.commit()
    db.expire(entry)
    return _load_entry(db, entry.id)


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pipeline_entry(entry_id: int, db: DbDep) -> None:
    entry = _load_entry(db, entry_id)
    db.delete(entry)
    db.commit()


@router.post("/{entry_id}/move", response_model=PipelineEntryOut)
def move_entry(entry_id: int, payload: PipelineMoveRequest, db: DbDep) -> PipelineEntry:
    entry = _load_entry(db, entry_id)
    move_pipeline_entry(
        db,
        entry,
        new_stage_id=payload.stage_id,
        agreed_amount=payload.agreed_amount,
        rejection_reason=payload.rejection_reason,
    )
    db.commit()
    db.expire(entry)
    return _load_entry(db, entry.id)
