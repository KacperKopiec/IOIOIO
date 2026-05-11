from datetime import date, datetime
from decimal import Decimal

from pydantic import Field

from app.models.enums import EventStatus
from app.schemas.common import OrmBase
from app.schemas.tag import TagOut
from app.schemas.user import UserOut


class EventBase(OrmBase):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    owner_user_id: int | None = None
    target_budget: Decimal | None = Field(default=None, ge=0)
    target_partners_count: int | None = Field(default=None, ge=0)
    status: EventStatus = EventStatus.DRAFT


class EventCreate(EventBase):
    tag_ids: list[int] = Field(default_factory=list)


class EventUpdate(OrmBase):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    owner_user_id: int | None = None
    target_budget: Decimal | None = Field(default=None, ge=0)
    target_partners_count: int | None = Field(default=None, ge=0)
    status: EventStatus | None = None
    tag_ids: list[int] | None = None


class EventOut(EventBase):
    id: int
    created_at: datetime
    updated_at: datetime
    owner: UserOut | None = None
    tags: list[TagOut] = Field(default_factory=list)


class EventKpi(OrmBase):
    event_id: int
    partners_count: int
    total_value: Decimal
    pipeline_count: int
    target_partners_count: int | None
    target_budget: Decimal | None
    conversion_rate: float | None = None
    avg_partner_value: Decimal | None = None
    avg_close_days: float | None = None
    progress_partners_pct: float | None = None
    progress_budget_pct: float | None = None
