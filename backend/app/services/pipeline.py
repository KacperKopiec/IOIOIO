"""Pipeline transition rules.

Stage names that trigger lifecycle timestamps:
  - moving INTO  "Oferta wysłana"  -> offer_sent_at  (if not set)
  - moving OUT OF "Kontakt"        -> first_contact_at (if not set)
  - moving INTO any non-open stage -> closed_at (if not set)
  - moving INTO a "won" stage      -> ensure draft CompanyRelationship exists
"""
from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import RelationshipStatus, StageOutcome
from app.models.pipeline import PipelineEntry, PipelineStage
from app.models.relationship import CompanyRelationship, RelationshipType

KONTAKT_STAGE_NAME = "Kontakt"
OFFER_SENT_STAGE_NAME = "Oferta wysłana"
DEFAULT_RELATIONSHIP_TYPE = "sponsor"


def _ensure_draft_relationship(
    db: Session, entry: PipelineEntry, default_type_name: str
) -> CompanyRelationship | None:
    existing = db.scalar(
        select(CompanyRelationship).where(
            CompanyRelationship.pipeline_entry_id == entry.id
        )
    )
    if existing is not None:
        return existing
    rel_type = db.scalar(
        select(RelationshipType).where(RelationshipType.name == default_type_name)
    )
    if rel_type is None:
        return None
    rel = CompanyRelationship(
        company_id=entry.company_id,
        event_id=entry.event_id,
        pipeline_entry_id=entry.id,
        relationship_type_id=rel_type.id,
        amount_net=entry.agreed_amount,
        owner_user_id=entry.owner_user_id,
        status=RelationshipStatus.DRAFT,
    )
    db.add(rel)
    return rel


def move_pipeline_entry(
    db: Session,
    entry: PipelineEntry,
    new_stage_id: int,
    *,
    agreed_amount: Decimal | None = None,
    rejection_reason: str | None = None,
) -> PipelineEntry:
    new_stage = db.get(PipelineStage, new_stage_id)
    if new_stage is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Etap lejka nie istnieje",
        )

    current_stage = entry.stage
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    if current_stage is not None and current_stage.name == KONTAKT_STAGE_NAME:
        if entry.first_contact_at is None:
            entry.first_contact_at = now

    if new_stage.name == OFFER_SENT_STAGE_NAME and entry.offer_sent_at is None:
        entry.offer_sent_at = now

    if new_stage.outcome != StageOutcome.OPEN and entry.closed_at is None:
        entry.closed_at = now

    if new_stage.outcome == StageOutcome.OPEN:
        entry.closed_at = None
        entry.rejection_reason = None

    if agreed_amount is not None:
        entry.agreed_amount = agreed_amount
    if rejection_reason is not None and new_stage.outcome == StageOutcome.LOST:
        entry.rejection_reason = rejection_reason

    entry.stage_id = new_stage.id

    if new_stage.outcome == StageOutcome.WON:
        _ensure_draft_relationship(db, entry, DEFAULT_RELATIONSHIP_TYPE)

    db.flush()
    return entry
