from __future__ import annotations

from decimal import Decimal

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.enums import StageOutcome
from app.models.event import Event
from app.models.pipeline import PipelineEntry, PipelineStage
from app.schemas.event import EventKpi


def compute_event_kpi(db: Session, event: Event) -> EventKpi:
    stage_outcome = PipelineStage.outcome

    row = db.execute(
        select(
            func.count(PipelineEntry.id).label("pipeline_count"),
            func.sum(
                case((stage_outcome == StageOutcome.WON, 1), else_=0)
            ).label("won_count"),
            func.sum(
                case((stage_outcome == StageOutcome.LOST, 1), else_=0)
            ).label("lost_count"),
            func.sum(
                case(
                    (
                        stage_outcome == StageOutcome.WON,
                        func.coalesce(PipelineEntry.agreed_amount, 0),
                    ),
                    else_=0,
                )
            ).label("total_value"),
            func.avg(
                case(
                    (
                        stage_outcome == StageOutcome.WON,
                        func.extract(
                            "epoch",
                            PipelineEntry.closed_at - PipelineEntry.first_contact_at,
                        )
                        / 86400.0,
                    ),
                    else_=None,
                )
            ).label("avg_close_days"),
        )
        .join(PipelineStage, PipelineEntry.stage_id == PipelineStage.id)
        .where(PipelineEntry.event_id == event.id)
    ).one()

    pipeline_count = int(row.pipeline_count or 0)
    partners_count = int(row.won_count or 0)
    lost_count = int(row.lost_count or 0)
    total_value: Decimal = Decimal(row.total_value or 0)

    closed_total = partners_count + lost_count
    conversion_rate = (
        round(partners_count / closed_total, 4) if closed_total > 0 else None
    )
    avg_partner_value = (
        (total_value / partners_count).quantize(Decimal("0.01"))
        if partners_count > 0
        else None
    )
    avg_close_days = float(row.avg_close_days) if row.avg_close_days is not None else None

    progress_partners_pct = None
    if event.target_partners_count and event.target_partners_count > 0:
        progress_partners_pct = round(
            min(partners_count / event.target_partners_count, 1.0), 4
        )

    progress_budget_pct = None
    if event.target_budget and event.target_budget > 0:
        progress_budget_pct = round(
            float(min(total_value / event.target_budget, Decimal("1"))), 4
        )

    return EventKpi(
        event_id=event.id,
        partners_count=partners_count,
        total_value=total_value,
        pipeline_count=pipeline_count,
        target_partners_count=event.target_partners_count,
        target_budget=event.target_budget,
        conversion_rate=conversion_rate,
        avg_partner_value=avg_partner_value,
        avg_close_days=avg_close_days,
        progress_partners_pct=progress_partners_pct,
        progress_budget_pct=progress_budget_pct,
    )
