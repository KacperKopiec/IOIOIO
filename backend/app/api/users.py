from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbDep
from app.models.role import Role
from app.models.user import User
from app.schemas.user import UserOut

router = APIRouter(prefix="/users", tags=["reference"])


@router.get("", response_model=list[UserOut])
def list_users(
    db: DbDep,
    role: str | None = Query(default=None, description="filtruj po nazwie roli"),
    active_only: bool = Query(default=True),
) -> list[User]:
    stmt = select(User).options(selectinload(User.role)).order_by(User.last_name, User.first_name)
    if active_only:
        stmt = stmt.where(User.is_active.is_(True))
    if role is not None:
        stmt = stmt.join(Role, User.role_id == Role.id).where(Role.name == role)
    return list(db.scalars(stmt).all())


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: DbDep) -> User:
    user = db.scalar(
        select(User).options(selectinload(User.role)).where(User.id == user_id)
    )
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Użytkownik nie istnieje")
    return user
