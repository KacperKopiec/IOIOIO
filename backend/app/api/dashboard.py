from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbDep
from app.models.event import Event
from app.models.user import User
from app.schemas.dashboard import (
    CoordinatorDashboard,
    PromotionDashboard,
    RelationshipManagerDashboard,
)
from app.services.dashboard import (
    build_coordinator_dashboard,
    build_promotion_dashboard,
    build_relationship_manager_dashboard,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/coordinator", response_model=CoordinatorDashboard)
def coordinator_dashboard(event_id: int, db: DbDep) -> CoordinatorDashboard:
    event = db.scalar(
        select(Event).options(selectinload(Event.owner)).where(Event.id == event_id)
    )
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Wydarzenie nie istnieje"
        )
    return build_coordinator_dashboard(db, event)


@router.get("/promotion", response_model=PromotionDashboard)
def promotion_dashboard(db: DbDep) -> PromotionDashboard:
    return build_promotion_dashboard(db)


@router.get("/relationship-manager", response_model=RelationshipManagerDashboard)
def relationship_manager_dashboard(user_id: int, db: DbDep) -> RelationshipManagerDashboard:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Użytkownik nie istnieje"
        )
    return build_relationship_manager_dashboard(db, user)
