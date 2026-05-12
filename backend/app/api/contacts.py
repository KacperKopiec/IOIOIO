from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import DbDep
from app.models.company import Company
from app.models.contact import Contact
from app.schemas.contact import ContactCreate, ContactOut, ContactUpdate

router = APIRouter(prefix="/contacts", tags=["contacts"])


def _load_contact(db, contact_id: int) -> Contact:
    contact = db.get(Contact, contact_id)
    if contact is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Kontakt nie istnieje"
        )
    return contact


def _ensure_company_exists(db, company_id: int) -> None:
    if db.get(Company, company_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Firma nie istnieje"
        )


@router.get("", response_model=list[ContactOut])
def list_contacts(
    db: DbDep,
    company_id: int | None = Query(default=None),
) -> list[Contact]:
    stmt = select(Contact).order_by(Contact.last_name, Contact.first_name)
    if company_id is not None:
        stmt = stmt.where(Contact.company_id == company_id)
    return list(db.scalars(stmt).all())


@router.get("/{contact_id}", response_model=ContactOut)
def get_contact(contact_id: int, db: DbDep) -> Contact:
    return _load_contact(db, contact_id)


@router.post("", response_model=ContactOut, status_code=status.HTTP_201_CREATED)
def create_contact(payload: ContactCreate, db: DbDep) -> Contact:
    _ensure_company_exists(db, payload.company_id)
    contact = Contact(**payload.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.patch("/{contact_id}", response_model=ContactOut)
def update_contact(contact_id: int, payload: ContactUpdate, db: DbDep) -> Contact:
    contact = _load_contact(db, contact_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(contact, key, value)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(contact_id: int, db: DbDep) -> None:
    contact = _load_contact(db, contact_id)
    db.delete(contact)
    db.commit()
