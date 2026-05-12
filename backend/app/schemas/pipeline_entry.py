from datetime import datetime
from decimal import Decimal

from pydantic import Field

from app.schemas.common import OrmBase
from app.schemas.company import CompanyOut
from app.schemas.pipeline_stage import PipelineStageOut
from app.schemas.user import UserOut


class PipelineEntryBase(OrmBase):
    event_id: int
    company_id: int
    stage_id: int
    owner_user_id: int | None = None
    contact_person_id: int | None = None
    expected_amount: Decimal | None = Field(default=None, ge=0)
    agreed_amount: Decimal | None = Field(default=None, ge=0)
    probability_override: int | None = Field(default=None, ge=0, le=100)
    notes: str | None = None


class PipelineEntryCreate(OrmBase):
    event_id: int
    company_id: int
    stage_id: int | None = None
    owner_user_id: int | None = None
    contact_person_id: int | None = None
    expected_amount: Decimal | None = Field(default=None, ge=0)
    notes: str | None = None


class PipelineEntryUpdate(OrmBase):
    stage_id: int | None = None
    owner_user_id: int | None = None
    contact_person_id: int | None = None
    expected_amount: Decimal | None = Field(default=None, ge=0)
    agreed_amount: Decimal | None = Field(default=None, ge=0)
    probability_override: int | None = Field(default=None, ge=0, le=100)
    notes: str | None = None


class PipelineMoveRequest(OrmBase):
    stage_id: int
    agreed_amount: Decimal | None = Field(default=None, ge=0)
    rejection_reason: str | None = None


class PipelineEntryOut(PipelineEntryBase):
    id: int
    first_contact_at: datetime | None = None
    offer_sent_at: datetime | None = None
    closed_at: datetime | None = None
    rejection_reason: str | None = None
    created_at: datetime
    updated_at: datetime
    stage: PipelineStageOut | None = None
    company: CompanyOut | None = None
    owner: UserOut | None = None
