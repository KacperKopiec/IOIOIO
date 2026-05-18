from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DbDep
from app.models.company import Company
from app.models.enums import PaymentStatus
from app.models.event import Event
from app.models.invoice import Invoice
from app.schemas.invoice import InvoiceCreate, InvoiceOut, InvoiceUpdate

router = APIRouter(prefix="/invoices", tags=["invoices"])


def _invoice_options():
    return selectinload(Invoice.company), selectinload(Invoice.event)


def _load_invoice(db: DbDep, invoice_id: int) -> Invoice:
    invoice = db.scalar(
        select(Invoice).options(*_invoice_options()).where(Invoice.id == invoice_id)
    )
    if invoice is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Faktura nie istnieje"
        )
    return invoice


def _validate_links(db: DbDep, company_id: int | None, event_id: int | None) -> None:
    if company_id is not None and db.get(Company, company_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Firma nie istnieje"
        )
    if event_id is not None and db.get(Event, event_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Wydarzenie nie istnieje"
        )


@router.get("", response_model=list[InvoiceOut])
def list_invoices(
    db: DbDep,
    company_id: int | None = Query(default=None),
    event_id: int | None = Query(default=None),
    payment_status: PaymentStatus | None = Query(default=None),
) -> list[Invoice]:
    stmt = (
        select(Invoice)
        .options(*_invoice_options())
        .order_by(Invoice.issue_date.desc(), Invoice.created_at.desc())
    )
    if company_id is not None:
        stmt = stmt.where(Invoice.company_id == company_id)
    if event_id is not None:
        stmt = stmt.where(Invoice.event_id == event_id)
    if payment_status is not None:
        stmt = stmt.where(Invoice.payment_status == payment_status)
    return list(db.scalars(stmt).all())


@router.get("/{invoice_id}", response_model=InvoiceOut)
def get_invoice(invoice_id: int, db: DbDep) -> Invoice:
    return _load_invoice(db, invoice_id)


@router.post("", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
def create_invoice(payload: InvoiceCreate, db: DbDep) -> Invoice:
    _validate_links(db, payload.company_id, payload.event_id)
    invoice = Invoice(**payload.model_dump())
    db.add(invoice)
    db.commit()
    return _load_invoice(db, invoice.id)


@router.patch("/{invoice_id}", response_model=InvoiceOut)
def update_invoice(invoice_id: int, payload: InvoiceUpdate, db: DbDep) -> Invoice:
    invoice = _load_invoice(db, invoice_id)
    data = payload.model_dump(exclude_unset=True)
    next_company_id = data.get("company_id", invoice.company_id)
    next_event_id = data.get("event_id", invoice.event_id)
    _validate_links(db, next_company_id, next_event_id)
    for key, value in data.items():
        setattr(invoice, key, value)
    if (
        "payment_status" in data
        and invoice.payment_status != PaymentStatus.PAID
        and "paid_at" not in data
    ):
        invoice.paid_at = None
    db.commit()
    return _load_invoice(db, invoice.id)


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(invoice_id: int, db: DbDep) -> None:
    invoice = _load_invoice(db, invoice_id)
    db.delete(invoice)
    db.commit()
