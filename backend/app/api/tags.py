from fastapi import APIRouter, Query
from sqlalchemy import select

from app.api.deps import DbDep
from app.models.enums import TagCategory
from app.models.tag import Tag
from app.schemas.tag import TagOut

router = APIRouter(prefix="/tags", tags=["reference"])


@router.get("", response_model=list[TagOut])
def list_tags(
    db: DbDep,
    category: TagCategory | None = Query(default=None),
) -> list[Tag]:
    stmt = select(Tag).order_by(Tag.category, Tag.name)
    if category is not None:
        stmt = stmt.where(Tag.category == category)
    return list(db.scalars(stmt).all())
