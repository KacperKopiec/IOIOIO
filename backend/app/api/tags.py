from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.api.deps import DbDep
from app.models.enums import TagCategory
from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagOut

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


@router.post("", response_model=TagOut, status_code=status.HTTP_201_CREATED)
def create_tag(payload: TagCreate, db: DbDep) -> Tag:
    name = payload.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Nazwa tagu nie może być pusta",
        )

    existing = db.scalar(select(Tag).where(Tag.name == name))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tag o tej nazwie już istnieje",
        )

    tag = Tag(name=name, category=payload.category)
    db.add(tag)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tag o tej nazwie już istnieje",
        )
    db.refresh(tag)
    return tag
