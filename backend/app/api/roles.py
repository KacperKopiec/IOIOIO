from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import DbDep
from app.models.role import Role
from app.schemas.role import RoleOut

router = APIRouter(prefix="/roles", tags=["reference"])


@router.get("", response_model=list[RoleOut])
def list_roles(db: DbDep) -> list[Role]:
    return list(db.scalars(select(Role).order_by(Role.name)).all())
