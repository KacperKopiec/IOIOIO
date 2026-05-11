from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import DbDep
from app.models.industry import Industry
from app.schemas.industry import IndustryOut

router = APIRouter(prefix="/industries", tags=["reference"])


@router.get("", response_model=list[IndustryOut])
def list_industries(db: DbDep) -> list[Industry]:
    return list(db.scalars(select(Industry).order_by(Industry.name)).all())
