from __future__ import annotations

from decimal import Decimal

from sqlalchemy import case, desc, func, select
from sqlalchemy.orm import Session

from app.models.company import Company
from app.models.enums import StageOutcome
from app.models.event import Event
from app.models.pipeline import PipelineEntry, PipelineStage
from app.schemas.reports import (
    ReportEventRow,
    ReportNewSponsor,
    ReportsResponse,
    ReportTopCompany,
    ReportTotals,
)


def build_reports(db: Session) -> ReportsResponse:
    totals_row = db.execute(
        select(
            func.count(PipelineEntry.id).label("pipeline_count"),
            func.sum(
                case((PipelineStage.outcome == StageOutcome.WON, 1), else_=0)
            ).label("won"),
            func.sum(
                case((PipelineStage.outcome == StageOutcome.LOST, 1), else_=0)
            ).label("lost"),
            func.sum(
                case(
                    (
                        PipelineStage.outcome == StageOutcome.WON,
                        func.coalesce(PipelineEntry.agreed_amount, 0),
                    ),
                    else_=0,
                )
            ).label("total_value"),
        ).join(PipelineStage, PipelineEntry.stage_id == PipelineStage.id)
    ).one()

    won = int(totals_row.won or 0)
    lost = int(totals_row.lost or 0)
    closed_total = won + lost
    conversion = round(won / closed_total, 4) if closed_total > 0 else None

    totals = ReportTotals(
        pipeline_count=int(totals_row.pipeline_count or 0),
        partners_count=won,
        total_value=Decimal(totals_row.total_value or 0),
        conversion_rate=conversion,
    )

    new_sponsor_rows = db.execute(
        select(
            Company.id.label("company_id"),
            Company.name.label("company_name"),
            Event.id.label("event_id"),
            Event.name.label("event_name"),
            PipelineEntry.agreed_amount,
            PipelineEntry.closed_at,
        )
        .join(PipelineEntry, PipelineEntry.company_id == Company.id)
        .join(Event, PipelineEntry.event_id == Event.id)
        .join(PipelineStage, PipelineEntry.stage_id == PipelineStage.id)
        .where(PipelineStage.outcome == StageOutcome.WON)
        .order_by(desc(PipelineEntry.closed_at))
        .limit(10)
    ).all()
    new_sponsors = [
        ReportNewSponsor(
            company_id=r.company_id,
            company_name=r.company_name,
            event_id=r.event_id,
            event_name=r.event_name,
            agreed_amount=r.agreed_amount,
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
            func.count(PipelineEntry.id).label("pipeline_count"),
            func.sum(
                case((PipelineStage.outcome == StageOutcome.WON, 1), else_=0)
            ).label("partners_count"),
            func.sum(
                case(
                    (
                        PipelineStage.outcome == StageOutcome.WON,
                        func.coalesce(PipelineEntry.agreed_amount, 0),
                    ),
                    else_=0,
                )
            ).label("total_value"),
        )
        .outerjoin(PipelineEntry, PipelineEntry.event_id == Event.id)
        .outerjoin(PipelineStage, PipelineEntry.stage_id == PipelineStage.id)
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
                        PipelineStage.outcome == StageOutcome.WON,
                        func.coalesce(PipelineEntry.agreed_amount, 0),
                    ),
                    else_=0,
                )
            ).label("total_value"),
            func.sum(
                case((PipelineStage.outcome == StageOutcome.WON, 1), else_=0)
            ).label("partnerships_count"),
        )
        .join(PipelineEntry, PipelineEntry.company_id == Company.id)
        .join(PipelineStage, PipelineEntry.stage_id == PipelineStage.id)
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

    return ReportsResponse(
        totals=totals,
        new_sponsors=new_sponsors,
        events=events,
        top_companies=top_companies,
    )
