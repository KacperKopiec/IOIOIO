from datetime import datetime

from pydantic import Field

from app.models.enums import CompanySize
from app.schemas.common import OrmBase
from app.schemas.industry import IndustryOut
from app.schemas.tag import TagOut


class CompanyBase(OrmBase):
    name: str = Field(min_length=1, max_length=160)
    legal_name: str | None = Field(default=None, max_length=200)
    website: str | None = Field(default=None, max_length=255)
    nip: str | None = Field(default=None, max_length=32)
    description: str | None = None
    industry_id: int | None = None
    company_size: CompanySize | None = None
    country: str | None = Field(default=None, max_length=80)
    city: str | None = Field(default=None, max_length=120)


class CompanyCreate(CompanyBase):
    tag_ids: list[int] = Field(default_factory=list)


class CompanyUpdate(OrmBase):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    legal_name: str | None = Field(default=None, max_length=200)
    website: str | None = Field(default=None, max_length=255)
    nip: str | None = Field(default=None, max_length=32)
    description: str | None = None
    industry_id: int | None = None
    company_size: CompanySize | None = None
    country: str | None = Field(default=None, max_length=80)
    city: str | None = Field(default=None, max_length=120)
    tag_ids: list[int] | None = None


class CompanyOut(CompanyBase):
    id: int
    created_at: datetime
    updated_at: datetime
    industry: IndustryOut | None = None
    tags: list[TagOut] = Field(default_factory=list)
