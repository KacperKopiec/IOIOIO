from datetime import datetime

from pydantic import EmailStr, Field

from app.schemas.common import OrmBase


class ContactBase(OrmBase):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    position: str | None = Field(default=None, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=40)
    linkedin_url: str | None = Field(default=None, max_length=255)
    notes: str | None = None


class ContactCreate(ContactBase):
    company_id: int


class ContactUpdate(OrmBase):
    first_name: str | None = Field(default=None, min_length=1, max_length=80)
    last_name: str | None = Field(default=None, min_length=1, max_length=80)
    position: str | None = Field(default=None, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=40)
    linkedin_url: str | None = Field(default=None, max_length=255)
    notes: str | None = None


class ContactOut(ContactBase):
    id: int
    company_id: int
    created_at: datetime
    updated_at: datetime
