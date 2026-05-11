from datetime import date
from decimal import Decimal

from app.models.enums import EventStatus
from app.schemas.common import OrmBase


class ReportTotals(OrmBase):
    pipeline_count: int
    partners_count: int
    total_value: Decimal
    conversion_rate: float | None


class ReportNewSponsor(OrmBase):
    company_id: int
    company_name: str
    event_id: int
    event_name: str
    agreed_amount: Decimal | None
    closed_at: str | None


class ReportEventRow(OrmBase):
    event_id: int
    event_name: str
    status: EventStatus
    start_date: date | None
    end_date: date | None
    partners_count: int
    pipeline_count: int
    total_value: Decimal
    target_partners_count: int | None
    target_budget: Decimal | None


class ReportTopCompany(OrmBase):
    company_id: int
    company_name: str
    total_value: Decimal
    partnerships_count: int


class ReportsResponse(OrmBase):
    totals: ReportTotals
    new_sponsors: list[ReportNewSponsor]
    events: list[ReportEventRow]
    top_companies: list[ReportTopCompany]
