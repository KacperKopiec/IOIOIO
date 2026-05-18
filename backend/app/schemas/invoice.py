from datetime import date, datetime
from decimal import Decimal

from pydantic import Field, model_validator

from app.models.enums import PaymentStatus
from app.schemas.common import OrmBase


class InvoiceBase(OrmBase):
    company_id: int
    event_id: int | None = None
    invoice_number: str = Field(min_length=1, max_length=80)
    amount: Decimal = Field(ge=0)
    currency: str = Field(default="PLN", min_length=1, max_length=8)
    issue_date: date
    due_date: date | None = None
    payment_status: PaymentStatus = PaymentStatus.PENDING
    paid_at: date | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def paid_status_requires_paid_at_consistency(self) -> "InvoiceBase":
        if self.payment_status != PaymentStatus.PAID and self.paid_at is not None:
            raise ValueError("Data zapłaty może być ustawiona tylko dla opłaconej faktury")
        return self


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceUpdate(OrmBase):
    company_id: int | None = None
    event_id: int | None = None
    invoice_number: str | None = Field(default=None, min_length=1, max_length=80)
    amount: Decimal | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=1, max_length=8)
    issue_date: date | None = None
    due_date: date | None = None
    payment_status: PaymentStatus | None = None
    paid_at: date | None = None
    notes: str | None = None


class InvoiceOut(InvoiceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    company_name: str | None = None
    event_name: str | None = None
