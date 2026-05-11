from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import DbDep
from app.models.activity import Activity
from app.schemas.activity import ActivityCreate, ActivityOut, ActivityUpdate

router = APIRouter(prefix="/activities", tags=["activities"])


def _load_activity(db, activity_id: int) -> Activity:
    activity = db.get(Activity, activity_id)
    if activity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Aktywność nie istnieje"
        )
    return activity


@router.get("", response_model=list[ActivityOut])
def list_activities(
    db: DbDep,
    company_id: int | None = Query(default=None),
    event_id: int | None = Query(default=None),
    pipeline_entry_id: int | None = Query(default=None),
    assigned_user_id: int | None = Query(default=None),
    due_before: datetime | None = Query(default=None),
    overdue_only: bool = Query(default=False),
    limit: int = Query(default=100, ge=1, le=500),
) -> list[Activity]:
    stmt = select(Activity).order_by(
        Activity.activity_date.desc().nullslast(), Activity.created_at.desc()
    )
    if company_id is not None:
        stmt = stmt.where(Activity.company_id == company_id)
    if event_id is not None:
        stmt = stmt.where(Activity.event_id == event_id)
    if pipeline_entry_id is not None:
        stmt = stmt.where(Activity.pipeline_entry_id == pipeline_entry_id)
    if assigned_user_id is not None:
        stmt = stmt.where(Activity.assigned_user_id == assigned_user_id)
    if due_before is not None:
        stmt = stmt.where(Activity.due_date <= due_before)
    if overdue_only:
        stmt = stmt.where(
            Activity.due_date < datetime.now(timezone.utc).replace(tzinfo=None),
            Activity.completed_at.is_(None),
        )
    stmt = stmt.limit(limit)
    return list(db.scalars(stmt).all())


@router.get("/{activity_id}", response_model=ActivityOut)
def get_activity(activity_id: int, db: DbDep) -> Activity:
    return _load_activity(db, activity_id)


@router.post("", response_model=ActivityOut, status_code=status.HTTP_201_CREATED)
def create_activity(payload: ActivityCreate, db: DbDep) -> Activity:
    activity = Activity(**payload.model_dump())
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.patch("/{activity_id}", response_model=ActivityOut)
def update_activity(activity_id: int, payload: ActivityUpdate, db: DbDep) -> Activity:
    activity = _load_activity(db, activity_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(activity, key, value)
    db.commit()
    db.refresh(activity)
    return activity


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(activity_id: int, db: DbDep) -> None:
    activity = _load_activity(db, activity_id)
    db.delete(activity)
    db.commit()
