from datetime import datetime

from pydantic import Field

from app.models.enums import ActivityType
from app.schemas.common import OrmBase


class ActivityBase(OrmBase):
    activity_type: ActivityType
    subject: str = Field(min_length=1, max_length=200)
    description: str | None = None
    activity_date: datetime | None = None
    due_date: datetime | None = None
    completed_at: datetime | None = None
    company_id: int | None = None
    contact_id: int | None = None
    event_id: int | None = None
    pipeline_entry_id: int | None = None
    assigned_user_id: int | None = None


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(OrmBase):
    activity_type: ActivityType | None = None
    subject: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    activity_date: datetime | None = None
    due_date: datetime | None = None
    completed_at: datetime | None = None
    assigned_user_id: int | None = None


class ActivityOut(ActivityBase):
    id: int
    created_at: datetime
