import os
import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.api.deps import DbDep
from app.models.company import Company
from app.models.document import Document
from app.models.enums import EventStatus
from app.models.event import Event
from app.models.pipeline import PipelineEntry, PipelineStage
from app.models.tag import Tag
from app.models.user import User
from app.schemas.common import Page, PageParams
from app.schemas.document import DocumentCreate, DocumentOut
from app.schemas.event import EventCreate, EventKpi, EventOut, EventUpdate
from app.schemas.pipeline_entry import PipelineEntryOut
from app.services.kpi import compute_event_kpi

router = APIRouter(prefix="/events", tags=["events"])


def _load_event(db, event_id: int) -> Event:
    event = db.scalar(
        select(Event)
        .options(selectinload(Event.owner), selectinload(Event.tags))
        .where(Event.id == event_id)
    )
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Wydarzenie nie istnieje"
        )
    return event


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


@router.get("", response_model=Page[EventOut])
def list_events(
    db: DbDep,
    page_params: Annotated[PageParams, Depends()],
    status_filter: EventStatus | None = Query(default=None, alias="status"),
    owner_user_id: int | None = None,
    q: str | None = None,
    tag_ids: str | None = Query(
        default=None, description="lista CSV identyfikatorów tagów (AND)"
    ),
) -> Page[EventOut]:
    base = select(Event)
    if status_filter is not None:
        base = base.where(Event.status == status_filter)
    if owner_user_id is not None:
        base = base.where(Event.owner_user_id == owner_user_id)
    if q:
        like = f"%{q.lower()}%"
        base = base.where(or_(func.lower(Event.name).like(like), func.lower(Event.description).like(like)))
    parsed_tags = _parse_csv_int(tag_ids)
    if parsed_tags:
        for tag_id in parsed_tags:
            base = base.where(Event.tags.any(Tag.id == tag_id))

    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    stmt = (
        base.options(selectinload(Event.owner), selectinload(Event.tags))
        .order_by(Event.start_date.desc().nullslast(), Event.id.desc())
        .offset(page_params.offset)
        .limit(page_params.page_size)
    )
    items = list(db.scalars(stmt).all())
    return Page[EventOut].build(
        items=[EventOut.model_validate(e) for e in items],
        total=total,
        page=page_params.page,
        page_size=page_params.page_size,
    )


@router.get("/{event_id}", response_model=EventOut)
def get_event(event_id: int, db: DbDep) -> Event:
    return _load_event(db, event_id)


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(payload: EventCreate, db: DbDep) -> Event:
    data = payload.model_dump(exclude={"tag_ids"})
    event = Event(**data)
    if payload.tag_ids:
        event.tags = list(db.scalars(select(Tag).where(Tag.id.in_(payload.tag_ids))).all())
    db.add(event)
    db.commit()
    db.refresh(event)
    return _load_event(db, event.id)


@router.patch("/{event_id}", response_model=EventOut)
def update_event(event_id: int, payload: EventUpdate, db: DbDep) -> Event:
    event = _load_event(db, event_id)
    data = payload.model_dump(exclude_unset=True)
    tag_ids = data.pop("tag_ids", None)
    for key, value in data.items():
        setattr(event, key, value)
    if tag_ids is not None:
        event.tags = list(db.scalars(select(Tag).where(Tag.id.in_(tag_ids))).all())
    db.commit()
    db.refresh(event)
    return _load_event(db, event.id)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int, db: DbDep) -> None:
    event = _load_event(db, event_id)
    db.delete(event)
    db.commit()


@router.get("/{event_id}/pipeline", response_model=list[PipelineEntryOut])
def list_event_pipeline(event_id: int, db: DbDep) -> list[PipelineEntry]:
    _load_event(db, event_id)
    stmt = (
        select(PipelineEntry)
        .options(
            selectinload(PipelineEntry.stage),
            selectinload(PipelineEntry.company).selectinload(Company.industry),
            selectinload(PipelineEntry.company).selectinload(Company.tags),
            selectinload(PipelineEntry.owner).selectinload(User.role),
        )
        .join(PipelineStage, PipelineEntry.stage_id == PipelineStage.id)
        .where(PipelineEntry.event_id == event_id)
        .order_by(PipelineStage.order_number, PipelineEntry.id)
    )
    return list(db.scalars(stmt).all())


@router.get("/{event_id}/kpi", response_model=EventKpi)
def get_event_kpi(event_id: int, db: DbDep) -> EventKpi:
    event = _load_event(db, event_id)
    return compute_event_kpi(db, event)


@router.get("/{event_id}/companies/{company_id}/documents", response_model=list[DocumentOut])
def list_event_company_documents(
    event_id: int,
    company_id: int,
    db: DbDep,
    include_archived: bool = Query(default=False),
) -> list[Document]:
    from sqlalchemy.orm import selectinload
    _load_event(db, event_id)
    from app.api.companies import _load_company
    _load_company(db, company_id)
    stmt = (
        select(Document)
        .options(selectinload(Document.uploaded_by))
        .where(
            Document.event_id == event_id,
            Document.company_id == company_id,
        )
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


@router.post("/{event_id}/companies/{company_id}/documents", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def create_event_company_document(
    event_id: int,
    company_id: int,
    payload: DocumentCreate,
    db: DbDep,
    user_id: int | None = Query(default=None),
) -> Document:
    _load_event(db, event_id)
    from app.api.companies import _load_company
    _load_company(db, company_id)
    doc = Document(
        event_id=event_id,
        company_id=company_id,
        uploaded_by_user_id=user_id,
        **payload.model_dump(),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.post("/{event_id}/companies/{company_id}/documents/upload", status_code=status.HTTP_201_CREATED)
async def upload_event_company_document(
    event_id: int,
    company_id: int,
    db: DbDep,
    user_id: int | None = Query(default=None),
    file: UploadFile = File(...),
    document_type: str | None = Query(default=None),
) -> dict:
    _load_event(db, event_id)
    from app.api.companies import _load_company
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
        event_id=event_id,
        company_id=company_id,
        uploaded_by_user_id=user_id,
        file_name=file.filename or "dokument.pdf",
        file_url=f"/storage/documents/{file_name}",
        document_type=document_type,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {
        "id": doc.id,
        "file_name": doc.file_name,
        "file_url": doc.file_url,
        "document_type": doc.document_type,
        "archived": doc.archived,
        "created_at": doc.created_at,
        "updated_at": doc.updated_at,
        "uploaded_by_user_id": doc.uploaded_by_user_id,
        "uploaded_by_name": None,
    }


@router.delete("/{event_id}/companies/{company_id}/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event_company_document(event_id: int, company_id: int, document_id: int, db: DbDep) -> None:
    _load_event(db, event_id)
    from app.api.companies import _load_company
    _load_company(db, company_id)
    stmt = select(Document).where(
        Document.id == document_id,
        Document.event_id == event_id,
        Document.company_id == company_id,
    )
    doc = db.execute(stmt).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokument nie znaleziony")
    db.delete(doc)
    db.commit()


@router.post("/{event_id}/companies/{company_id}/documents/{document_id}/archive", response_model=DocumentOut)
def archive_event_company_document(event_id: int, company_id: int, document_id: int, db: DbDep) -> Document:
    _load_event(db, event_id)
    from app.api.companies import _load_company
    _load_company(db, company_id)
    stmt = select(Document).where(
        Document.id == document_id,
        Document.event_id == event_id,
        Document.company_id == company_id,
    )
    doc = db.execute(stmt).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokument nie znaleziony")
    doc.archived = True
    db.commit()
    db.refresh(doc)
    return doc


@router.post("/{event_id}/companies/{company_id}/documents/{document_id}/unarchive", response_model=DocumentOut)
def unarchive_event_company_document(event_id: int, company_id: int, document_id: int, db: DbDep) -> Document:
    _load_event(db, event_id)
    from app.api.companies import _load_company
    _load_company(db, company_id)
    stmt = select(Document).where(
        Document.id == document_id,
        Document.event_id == event_id,
        Document.company_id == company_id,
    )
    doc = db.execute(stmt).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokument nie znaleziony")
    doc.archived = False
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{event_id}/report")
def get_event_report(event_id: int, db: DbDep) -> dict:
    from app.services.reports import build_event_report
    event = _load_event(db, event_id)
    return build_event_report(db, event)
