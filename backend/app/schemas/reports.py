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


class ReportFilters(OrmBase):
    year: int | None = None
    industry_id: int | None = None
    owner_user_id: int | None = None
    event_id: int | None = None
    company_id: int | None = None


class AnnualCompanyReport(OrmBase):
    year: int | None
    collaborating_companies_count: int
    partners_count: int
    total_value: Decimal


class ReportPipelineStageRow(OrmBase):
    stage_id: int
    stage_name: str
    stage_outcome: str
    count: int
    total_value: Decimal


class ReportCompanyHistoryRow(OrmBase):
    company_id: int
    company_name: str
    event_id: int
    event_name: str
    stage_name: str
    stage_outcome: str
    expected_amount: Decimal | None
    agreed_amount: Decimal | None
    first_contact_at: str | None
    closed_at: str | None


class ReportYearTrendRow(OrmBase):
    year: int
    collaborating_companies_count: int
    partners_count: int
    total_value: Decimal
    pipeline_count: int


class ReportsResponse(OrmBase):
    filters: ReportFilters
    totals: ReportTotals
    annual: AnnualCompanyReport
    pipeline_stages: list[ReportPipelineStageRow]
    company_history: list[ReportCompanyHistoryRow]
    yearly_trends: list[ReportYearTrendRow]
    new_sponsors: list[ReportNewSponsor]
    events: list[ReportEventRow]
    top_companies: list[ReportTopCompany]
