from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbDep
from app.models.company import Company
from app.models.enums import RelationshipStatus
from app.models.relationship import CompanyRelationship, RelationshipType
from app.schemas.company_relationship import (
    CompanyRelationshipCreate,
    CompanyRelationshipOut,
    CompanyRelationshipUpdate,
)

router = APIRouter(prefix="/company-relationships", tags=["relationships"])


def _load(db, rel_id: int) -> CompanyRelationship:
    rel = db.scalar(
        select(CompanyRelationship)
        .options(selectinload(CompanyRelationship.relationship_type))
        .where(CompanyRelationship.id == rel_id)
    )
    if rel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Relacja nie istnieje"
        )
    return rel


@router.get("", response_model=list[CompanyRelationshipOut])
def list_relationships(
    db: DbDep,
    company_id: int | None = Query(default=None),
    event_id: int | None = Query(default=None),
    status_filter: RelationshipStatus | None = Query(default=None, alias="status"),
) -> list[CompanyRelationship]:
    stmt = (
        select(CompanyRelationship)
        .options(selectinload(CompanyRelationship.relationship_type))
        .order_by(CompanyRelationship.created_at.desc())
    )
    if company_id is not None:
        stmt = stmt.where(CompanyRelationship.company_id == company_id)
    if event_id is not None:
        stmt = stmt.where(CompanyRelationship.event_id == event_id)
    if status_filter is not None:
        stmt = stmt.where(CompanyRelationship.status == status_filter)
    return list(db.scalars(stmt).all())


@router.get("/{rel_id}", response_model=CompanyRelationshipOut)
def get_relationship(rel_id: int, db: DbDep) -> CompanyRelationship:
    return _load(db, rel_id)


@router.post("", response_model=CompanyRelationshipOut, status_code=status.HTTP_201_CREATED)
def create_relationship(payload: CompanyRelationshipCreate, db: DbDep) -> CompanyRelationship:
    if db.get(Company, payload.company_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Firma nie istnieje"
        )
    if db.get(RelationshipType, payload.relationship_type_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Typ relacji nie istnieje"
        )
    rel = CompanyRelationship(**payload.model_dump())
    db.add(rel)
    db.commit()
    return _load(db, rel.id)


@router.patch("/{rel_id}", response_model=CompanyRelationshipOut)
def update_relationship(
    rel_id: int, payload: CompanyRelationshipUpdate, db: DbDep
) -> CompanyRelationship:
    rel = _load(db, rel_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(rel, key, value)
    db.commit()
    db.expire(rel)
    return _load(db, rel.id)


@router.delete("/{rel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_relationship(rel_id: int, db: DbDep) -> None:
    rel = _load(db, rel_id)
    db.delete(rel)
    db.commit()
