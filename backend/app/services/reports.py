from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import case, desc, distinct, extract, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.activity import Activity
from app.models.company import Company
from app.models.enums import StageOutcome
from app.models.event import Event
from app.models.pipeline import PipelineEntry, PipelineStage
from app.schemas.reports import (
    AnnualCompanyReport,
    ReportCompanyHistoryRow,
    ReportEventRow,
    ReportFilters,
    ReportNewSponsor,
    ReportPipelineStageRow,
    ReportsResponse,
    ReportTopCompany,
    ReportTotals,
    ReportYearTrendRow,
)


def _year_bounds(year: int | None) -> tuple[date, date] | None:
    if year is None:
        return None
    return date(year, 1, 1), date(year, 12, 31)


def _apply_filters(stmt, filters: ReportFilters):
    stmt = stmt.join(Event, PipelineEntry.event_id == Event.id).join(
        Company, PipelineEntry.company_id == Company.id
    )
    if filters.year is not None:
        start, end = _year_bounds(filters.year) or (None, None)
        stmt = stmt.where(
            or_(
                Event.start_date.between(start, end),
                PipelineEntry.closed_at.between(start, end),
            )
        )
    if filters.industry_id is not None:
        stmt = stmt.where(Company.industry_id == filters.industry_id)
    if filters.owner_user_id is not None:
        stmt = stmt.where(Company.owner_user_id == filters.owner_user_id)
    if filters.event_id is not None:
        stmt = stmt.where(PipelineEntry.event_id == filters.event_id)
    if filters.company_id is not None:
        stmt = stmt.where(PipelineEntry.company_id == filters.company_id)
    return stmt


def _won_value():
    return case(
        (
            PipelineStage.outcome == StageOutcome.WON,
            func.coalesce(PipelineEntry.agreed_amount, PipelineEntry.expected_amount, 0),
        ),
        else_=0,
    )


def build_reports(
    db: Session,
    *,
    year: int | None = None,
    industry_id: int | None = None,
    owner_user_id: int | None = None,
    event_id: int | None = None,
    company_id: int | None = None,
) -> ReportsResponse:
    filters = ReportFilters(
        year=year,
        industry_id=industry_id,
        owner_user_id=owner_user_id,
        event_id=event_id,
        company_id=company_id,
    )

    base = _apply_filters(
        select(
            PipelineEntry.id,
            PipelineEntry.company_id,
            PipelineEntry.event_id,
            PipelineEntry.agreed_amount,
            PipelineEntry.expected_amount,
            PipelineEntry.closed_at,
            PipelineStage.outcome,
        ).join(PipelineStage, PipelineEntry.stage_id == PipelineStage.id),
        filters,
    ).subquery()

    totals_row = db.execute(
        select(
            func.count(base.c.id).label("pipeline_count"),
            func.sum(case((base.c.outcome == StageOutcome.WON, 1), else_=0)).label("won"),
            func.sum(case((base.c.outcome == StageOutcome.LOST, 1), else_=0)).label("lost"),
            func.sum(
                case(
                    (
                        base.c.outcome == StageOutcome.WON,
                        func.coalesce(base.c.agreed_amount, base.c.expected_amount, 0),
                    ),
                    else_=0,
                )
            ).label("total_value"),
            func.count(
                distinct(
                    case((base.c.outcome == StageOutcome.WON, base.c.company_id), else_=None)
                )
            ).label("collaborating_companies"),
        )
    ).one()

    won = int(totals_row.won or 0)
    lost = int(totals_row.lost or 0)
    closed_total = won + lost
    totals = ReportTotals(
        pipeline_count=int(totals_row.pipeline_count or 0),
        partners_count=won,
        total_value=Decimal(totals_row.total_value or 0),
        conversion_rate=round(won / closed_total, 4) if closed_total > 0 else None,
    )
    annual = AnnualCompanyReport(
        year=year,
        collaborating_companies_count=int(totals_row.collaborating_companies or 0),
        partners_count=won,
        total_value=Decimal(totals_row.total_value or 0),
    )

    new_sponsor_rows = db.execute(
        _apply_filters(
            select(
                Company.id.label("company_id"),
                Company.name.label("company_name"),
                Event.id.label("event_id"),
                Event.name.label("event_name"),
                PipelineEntry.agreed_amount,
                PipelineEntry.expected_amount,
                PipelineEntry.closed_at,
            )
            .join(PipelineStage, PipelineEntry.stage_id == PipelineStage.id)
            .where(PipelineStage.outcome == StageOutcome.WON),
            filters,
        )
        .order_by(desc(PipelineEntry.closed_at))
        .limit(10)
    ).all()
    new_sponsors = [
        ReportNewSponsor(
            company_id=r.company_id,
            company_name=r.company_name,
            event_id=r.event_id,
            event_name=r.event_name,
            agreed_amount=r.agreed_amount or r.expected_amount,
            closed_at=r.closed_at.isoformat() if r.closed_at else None,
        )
        for r in new_sponsor_rows
    ]

    event_rows = db.execute(
        select(
            Event.id,
            Event.name,
            Event.status,
            Event.start_date,
            Event.end_date,
            Event.target_partners_count,
            Event.target_budget,
            func.count(base.c.id).label("pipeline_count"),
            func.sum(case((base.c.outcome == StageOutcome.WON, 1), else_=0)).label("partners_count"),
            func.sum(
                case(
                    (
                        base.c.outcome == StageOutcome.WON,
                        func.coalesce(base.c.agreed_amount, base.c.expected_amount, 0),
                    ),
                    else_=0,
                )
            ).label("total_value"),
        )
        .join(base, base.c.event_id == Event.id)
        .group_by(
            Event.id,
            Event.name,
            Event.status,
            Event.start_date,
            Event.end_date,
            Event.target_partners_count,
            Event.target_budget,
        )
        .order_by(Event.start_date.desc().nullslast())
    ).all()
    events = [
        ReportEventRow(
            event_id=r.id,
            event_name=r.name,
            status=r.status,
            start_date=r.start_date,
            end_date=r.end_date,
            partners_count=int(r.partners_count or 0),
            pipeline_count=int(r.pipeline_count or 0),
            total_value=Decimal(r.total_value or 0),
            target_partners_count=r.target_partners_count,
            target_budget=r.target_budget,
        )
        for r in event_rows
    ]

    top_rows = db.execute(
        select(
            Company.id,
            Company.name,
            func.sum(
                case(
                    (
                        base.c.outcome == StageOutcome.WON,
                        func.coalesce(base.c.agreed_amount, base.c.expected_amount, 0),
                    ),
                    else_=0,
                )
            ).label("total_value"),
            func.sum(case((base.c.outcome == StageOutcome.WON, 1), else_=0)).label("partnerships_count"),
        )
        .join(base, base.c.company_id == Company.id)
        .group_by(Company.id, Company.name)
        .order_by(desc("total_value"))
        .limit(10)
    ).all()
    top_companies = [
        ReportTopCompany(
            company_id=r.id,
            company_name=r.name,
            total_value=Decimal(r.total_value or 0),
            partnerships_count=int(r.partnerships_count or 0),
        )
        for r in top_rows
        if int(r.partnerships_count or 0) > 0
    ]

    pipeline_rows = db.execute(
        select(
            PipelineStage.id,
            PipelineStage.name,
            PipelineStage.outcome,
            func.count(base.c.id).label("count"),
            func.sum(
                func.coalesce(base.c.agreed_amount, base.c.expected_amount, 0)
            ).label("total_value"),
        )
        .join(base, base.c.outcome == PipelineStage.outcome)
        .join(PipelineEntry, PipelineEntry.id == base.c.id)
        .where(PipelineEntry.stage_id == PipelineStage.id)
        .group_by(PipelineStage.id, PipelineStage.name, PipelineStage.outcome, PipelineStage.order_number)
        .order_by(PipelineStage.order_number)
    ).all()
    pipeline_stages = [
        ReportPipelineStageRow(
            stage_id=r.id,
            stage_name=r.name,
            stage_outcome=r.outcome.value,
            count=int(r.count or 0),
            total_value=Decimal(r.total_value or 0),
        )
        for r in pipeline_rows
    ]

    history_rows = db.execute(
        _apply_filters(
            select(PipelineEntry)
            .options(
                selectinload(PipelineEntry.company),
                selectinload(PipelineEntry.event),
                selectinload(PipelineEntry.stage),
            )
            .join(PipelineStage, PipelineEntry.stage_id == PipelineStage.id)
            .where(PipelineStage.outcome == StageOutcome.WON),
            filters,
        )
        .order_by(PipelineEntry.closed_at.desc().nullslast(), PipelineEntry.created_at.desc())
        .limit(30)
    ).scalars().all()
    company_history = [
        ReportCompanyHistoryRow(
            company_id=e.company_id,
            company_name=e.company.name if e.company else "",
            event_id=e.event_id,
            event_name=e.event.name if e.event else "",
            stage_name=e.stage.name if e.stage else "",
            stage_outcome=e.stage.outcome.value if e.stage else "",
            expected_amount=e.expected_amount,
            agreed_amount=e.agreed_amount,
            first_contact_at=e.first_contact_at.isoformat() if e.first_contact_at else None,
            closed_at=e.closed_at.isoformat() if e.closed_at else None,
        )
        for e in history_rows
    ]

    trend_filters = ReportFilters(
        year=None,
        industry_id=industry_id,
        owner_user_id=owner_user_id,
        event_id=event_id,
        company_id=company_id,
    )
    trend_base = _apply_filters(
        select(
            PipelineEntry.id,
            PipelineEntry.company_id,
            PipelineEntry.agreed_amount,
            PipelineEntry.expected_amount,
            PipelineStage.outcome,
            extract("year", Event.start_date).label("year"),
        ).join(PipelineStage, PipelineEntry.stage_id == PipelineStage.id),
        trend_filters,
    ).where(Event.start_date.is_not(None)).subquery()
    trend_rows = db.execute(
        select(
            trend_base.c.year,
            func.count(trend_base.c.id).label("pipeline_count"),
            func.sum(case((trend_base.c.outcome == StageOutcome.WON, 1), else_=0)).label("partners_count"),
            func.count(
                distinct(
                    case((trend_base.c.outcome == StageOutcome.WON, trend_base.c.company_id), else_=None)
                )
            ).label("collaborating_companies"),
            func.sum(
                case(
                    (
                        trend_base.c.outcome == StageOutcome.WON,
                        func.coalesce(trend_base.c.agreed_amount, trend_base.c.expected_amount, 0),
                    ),
                    else_=0,
                )
            ).label("total_value"),
        )
        .group_by(trend_base.c.year)
        .order_by(trend_base.c.year)
    ).all()
    yearly_trends = [
        ReportYearTrendRow(
            year=int(r.year),
            collaborating_companies_count=int(r.collaborating_companies or 0),
            partners_count=int(r.partners_count or 0),
            total_value=Decimal(r.total_value or 0),
            pipeline_count=int(r.pipeline_count or 0),
        )
        for r in trend_rows
        if r.year is not None
    ]

    return ReportsResponse(
        filters=filters,
        totals=totals,
        annual=annual,
        pipeline_stages=pipeline_stages,
        company_history=company_history,
        yearly_trends=yearly_trends,
        new_sponsors=new_sponsors,
        events=events,
        top_companies=top_companies,
    )


def build_event_report(db: Session, event: Event) -> dict:
    stages = list(
        db.execute(select(PipelineStage).order_by(PipelineStage.order_number)).scalars()
    )

    stage_stats = []
    for stage in stages:
        entries = db.execute(
            select(PipelineEntry)
            .where(PipelineEntry.event_id == event.id)
            .where(PipelineEntry.stage_id == stage.id)
        ).scalars().all()

        stage_value = sum(
            int(e.agreed_amount or e.expected_amount or 0)
            for e in entries
            if stage.outcome == StageOutcome.WON
        )

        stage_stats.append({
            "stage_id": stage.id,
            "stage_name": stage.name,
            "stage_outcome": stage.outcome.value,
            "count": len(entries),
            "value": stage_value,
        })

    won_entries = db.execute(
        select(PipelineEntry)
        .options(selectinload(PipelineEntry.company))
        .join(PipelineStage, PipelineEntry.stage_id == PipelineStage.id)
        .where(PipelineEntry.event_id == event.id)
        .where(PipelineStage.outcome == StageOutcome.WON)
    ).scalars().all()

    partners = [
        {
            "company_id": e.company_id,
            "company_name": e.company.name if e.company else None,
            "amount": int(e.agreed_amount or e.expected_amount or 0),
            "closed_at": e.closed_at.isoformat() if e.closed_at else None,
        }
        for e in won_entries
    ]

    return {
        "event_id": event.id,
        "event_name": event.name,
        "status": event.status.value,
        "start_date": event.start_date.isoformat() if event.start_date else None,
        "end_date": event.end_date.isoformat() if event.end_date else None,
        "target_budget": int(event.target_budget or 0) if event.target_budget else 0,
        "target_partners": event.target_partners_count or 0,
        "stages": stage_stats,
        "partners": partners,
        "total_partners": len(partners),
        "total_value": sum(p["amount"] for p in partners),
    }
