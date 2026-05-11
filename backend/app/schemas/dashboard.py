from datetime import date, datetime
from decimal import Decimal

from app.models.enums import ActivityType, EventStatus
from app.schemas.common import OrmBase


class EventOwnerBrief(OrmBase):
    user_id: int
    first_name: str
    last_name: str
    initials: str


class ActiveEventBrief(OrmBase):
    id: int
    name: str
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    owner: EventOwnerBrief | None = None
    current_value: Decimal
    target_budget: Decimal | None
    progress_pct: float
    partners_count: int
    target_partners_count: int | None
    status: EventStatus


class RecentActivityBrief(OrmBase):
    id: int
    activity_type: ActivityType
    subject: str
    activity_date: datetime | None
    company_id: int | None
    company_name: str | None
    event_id: int | None
    event_name: str | None


class CoordinatorDashboard(OrmBase):
    event_id: int
    event_name: str
    kpi_partners_count: int
    kpi_total_value: Decimal
    kpi_pipeline_count: int
    kpi_progress_partners_pct: float | None
    kpi_progress_budget_pct: float | None
    upcoming_tasks: list[RecentActivityBrief]
    recent_activities: list[RecentActivityBrief]


class RelationshipManagerDashboard(OrmBase):
    user_id: int
    overdue_activities: list[RecentActivityBrief]
    my_recent_activities: list[RecentActivityBrief]
    my_pipeline_count: int
    my_won_count: int


class PromotionEventCard(OrmBase):
    id: int
    name: str
    start_date: date | None
    end_date: date | None
    status: EventStatus
    partners_count: int
    target_partners_count: int | None
    progress_pct: float


class PromotionDashboard(OrmBase):
    active_events: list[PromotionEventCard]
