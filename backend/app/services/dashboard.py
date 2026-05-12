from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.models.company import Company
from app.models.enums import EventStatus, StageOutcome
from app.models.event import Event
from app.models.pipeline import PipelineEntry, PipelineStage
from app.models.user import User
from app.schemas.dashboard import (
    ActiveEventBrief,
    CoordinatorDashboard,
    EventOwnerBrief,
    PromotionDashboard,
    PromotionEventCard,
    RecentActivityBrief,
    RelationshipManagerDashboard,
)


def _initials(first: str, last: str) -> str:
    return (first[:1] + last[:1]).upper() if first and last else ""


def _activity_brief(row, *, company_name: str | None, event_name: str | None) -> RecentActivityBrief:
    return RecentActivityBrief(
        id=row.id,
        activity_type=row.activity_type,
        subject=row.subject,
        activity_date=row.activity_date,
        company_id=row.company_id,
        company_name=company_name,
        event_id=row.event_id,
        event_name=event_name,
    )


def _load_recent_activities(
    db: Session,
    *,
    limit: int,
    assigned_user_id: int | None = None,
    event_id: int | None = None,
    overdue_only: bool = False,
) -> list[RecentActivityBrief]:
    stmt = (
        select(Activity, Company.name.label("company_name"), Event.name.label("event_name"))
        .join(Company, Activity.company_id == Company.id, isouter=True)
        .join(Event, Activity.event_id == Event.id, isouter=True)
    )
    if assigned_user_id is not None:
        stmt = stmt.where(Activity.assigned_user_id == assigned_user_id)
    if event_id is not None:
        stmt = stmt.where(Activity.event_id == event_id)
    if overdue_only:
        stmt = stmt.where(
            Activity.due_date < datetime.now(timezone.utc).replace(tzinfo=None),
            Activity.completed_at.is_(None),
        )
    stmt = stmt.order_by(
        Activity.activity_date.desc().nullslast(), Activity.created_at.desc()
    ).limit(limit)
    return [
        _activity_brief(act, company_name=cname, event_name=ename)
        for act, cname, ename in db.execute(stmt).all()
    ]


def _event_brief(db: Session, event: Event) -> ActiveEventBrief:
    row = db.execute(
        select(
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
        .join(PipelineStage, PipelineEntry.stage_id == PipelineStage.id)
        .where(PipelineEntry.event_id == event.id)
    ).one()

    partners_count = int(row.partners_count or 0)
    total_value: Decimal = Decimal(row.total_value or 0)
    target_budget = event.target_budget
    if target_budget and target_budget > 0:
        progress_pct = round(float(min(total_value / target_budget, Decimal("1"))), 4)
    else:
        progress_pct = 0.0

    owner_brief: EventOwnerBrief | None = None
    if event.owner is not None:
        owner_brief = EventOwnerBrief(
            user_id=event.owner.id,
            first_name=event.owner.first_name,
            last_name=event.owner.last_name,
            initials=_initials(event.owner.first_name, event.owner.last_name),
        )

    return ActiveEventBrief(
        id=event.id,
        name=event.name,
        description=event.description,
        start_date=event.start_date,
        end_date=event.end_date,
        owner=owner_brief,
        current_value=total_value,
        target_budget=target_budget,
        progress_pct=progress_pct,
        partners_count=partners_count,
        target_partners_count=event.target_partners_count,
        status=event.status,
    )


def build_coordinator_dashboard(db: Session, event: Event) -> CoordinatorDashboard:
    brief = _event_brief(db, event)
    pipeline_row = db.execute(
        select(
            func.count(PipelineEntry.id).label("pipeline_count"),
            func.sum(
                case((PipelineStage.outcome == StageOutcome.WON, 1), else_=0)
            ).label("won"),
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
        .join(PipelineStage, PipelineEntry.stage_id == PipelineStage.id)
        .where(PipelineEntry.event_id == event.id)
    ).one()

    upcoming_tasks = _load_recent_activities(
        db,
        limit=10,
        event_id=event.id,
        overdue_only=False,
    )
    recent = _load_recent_activities(db, limit=8, event_id=event.id)

    return CoordinatorDashboard(
        event_id=event.id,
        event_name=event.name,
        kpi_partners_count=int(pipeline_row.won or 0),
        kpi_total_value=Decimal(pipeline_row.total_value or 0),
        kpi_pipeline_count=int(pipeline_row.pipeline_count or 0),
        kpi_progress_partners_pct=brief.partners_count
        / event.target_partners_count
        if event.target_partners_count
        else None,
        kpi_progress_budget_pct=brief.progress_pct,
        upcoming_tasks=upcoming_tasks,
        recent_activities=recent,
    )


def build_relationship_manager_dashboard(
    db: Session, user: User
) -> RelationshipManagerDashboard:
    overdue = _load_recent_activities(
        db, limit=20, assigned_user_id=user.id, overdue_only=True
    )
    recent = _load_recent_activities(db, limit=10, assigned_user_id=user.id)

    counts = db.execute(
        select(
            func.count(PipelineEntry.id).label("total"),
            func.sum(
                case((PipelineStage.outcome == StageOutcome.WON, 1), else_=0)
            ).label("won"),
        )
        .join(PipelineStage, PipelineEntry.stage_id == PipelineStage.id)
        .where(PipelineEntry.owner_user_id == user.id)
    ).one()

    return RelationshipManagerDashboard(
        user_id=user.id,
        overdue_activities=overdue,
        my_recent_activities=recent,
        my_pipeline_count=int(counts.total or 0),
        my_won_count=int(counts.won or 0),
    )


def build_promotion_dashboard(db: Session) -> PromotionDashboard:
    events = list(
        db.scalars(
            select(Event)
            .where(Event.status.in_([EventStatus.ACTIVE, EventStatus.DRAFT]))
            .order_by(Event.start_date.asc().nullslast())
        ).all()
    )
    cards: list[PromotionEventCard] = []
    for ev in events:
        brief = _event_brief(db, ev)
        cards.append(
            PromotionEventCard(
                id=ev.id,
                name=ev.name,
                start_date=ev.start_date,
                end_date=ev.end_date,
                status=ev.status,
                partners_count=brief.partners_count,
                target_partners_count=brief.target_partners_count,
                progress_pct=brief.progress_pct,
            )
        )
    return PromotionDashboard(active_events=cards)
