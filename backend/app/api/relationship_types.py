from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import DbDep
from app.models.relationship import RelationshipType
from app.schemas.relationship_type import RelationshipTypeOut

router = APIRouter(prefix="/relationship-types", tags=["reference"])


@router.get("", response_model=list[RelationshipTypeOut])
def list_relationship_types(db: DbDep) -> list[RelationshipType]:
    return list(db.scalars(select(RelationshipType).order_by(RelationshipType.name)).all())
