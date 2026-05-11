from datetime import date, datetime
from decimal import Decimal

from pydantic import Field

from app.models.enums import RelationshipStatus
from app.schemas.common import OrmBase
from app.schemas.relationship_type import RelationshipTypeOut


class CompanyRelationshipBase(OrmBase):
    company_id: int
    event_id: int | None = None
    pipeline_entry_id: int | None = None
    relationship_type_id: int
    package_name: str | None = Field(default=None, max_length=120)
    amount_net: Decimal | None = Field(default=None, ge=0)
    amount_gross: Decimal | None = Field(default=None, ge=0)
    currency: str = Field(default="PLN", max_length=8)
    start_date: date | None = None
    end_date: date | None = None
    contract_signed_at: datetime | None = None
    owner_user_id: int | None = None
    status: RelationshipStatus = RelationshipStatus.DRAFT
    notes: str | None = None


class CompanyRelationshipCreate(CompanyRelationshipBase):
    pass


class CompanyRelationshipUpdate(OrmBase):
    event_id: int | None = None
    pipeline_entry_id: int | None = None
    relationship_type_id: int | None = None
    package_name: str | None = Field(default=None, max_length=120)
    amount_net: Decimal | None = Field(default=None, ge=0)
    amount_gross: Decimal | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, max_length=8)
    start_date: date | None = None
    end_date: date | None = None
    contract_signed_at: datetime | None = None
    owner_user_id: int | None = None
    status: RelationshipStatus | None = None
    notes: str | None = None


class CompanyRelationshipOut(CompanyRelationshipBase):
    id: int
    created_at: datetime
    updated_at: datetime
    relationship_type: RelationshipTypeOut | None = None
