"""Reference data seed.

Usage: docker exec crm-backend uv run python -m app.db.seeds
Idempotent: rerunning is a no-op for already-present rows.
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.enums import StageOutcome, TagCategory
from app.models.industry import Industry
from app.models.pipeline import PipelineStage
from app.models.relationship import RelationshipType
from app.models.role import Role
from app.models.tag import Tag
from app.models.user import User


PIPELINE_STAGES: list[tuple[str, int, int, StageOutcome]] = [
    ("Kontakt", 1, 15, StageOutcome.OPEN),
    ("Oferta wysłana", 2, 40, StageOutcome.OPEN),
    ("Negocjacje", 3, 70, StageOutcome.OPEN),
    ("Decyzja: TAK", 4, 100, StageOutcome.WON),
    ("Odrzucony", 5, 0, StageOutcome.LOST),
]

ROLES: list[str] = ["koordynator", "opiekun", "promocja", "zarzad", "merytoryczna"]

RELATIONSHIP_TYPES: list[tuple[str, str]] = [
    ("sponsor", "Sponsor wydarzenia – wsparcie finansowe lub rzeczowe"),
    ("partner", "Partner merytoryczny lub strategiczny"),
    ("recruitment", "Partner rekrutacyjny – stoiska, oferty pracy"),
    ("r_and_d", "Współpraca badawczo-rozwojowa"),
    ("media_partner", "Patronat medialny"),
]

INDUSTRIES: list[str] = [
    "IT",
    "Fintech",
    "Automotive",
    "Energy",
    "E-commerce",
    "Telco",
    "R&D",
    "Cybersecurity",
]

TAGS: list[tuple[str, TagCategory]] = [
    ("cloud", TagCategory.TECHNOLOGY),
    ("saas", TagCategory.TECHNOLOGY),
    ("ai_ml", TagCategory.TECHNOLOGY),
    ("blockchain", TagCategory.TECHNOLOGY),
    ("cybersecurity", TagCategory.TECHNOLOGY),
    ("embedded", TagCategory.TECHNOLOGY),
    ("enterprise", TagCategory.TECHNOLOGY),
    ("recruitment", TagCategory.INTEREST),
    ("branding", TagCategory.INTEREST),
    ("technology", TagCategory.INTEREST),
    ("partner", TagCategory.RELATIONSHIP),
    ("sponsor", TagCategory.RELATIONSHIP),
    ("alumni", TagCategory.RELATIONSHIP),
    ("workshop", TagCategory.COLLABORATION),
    ("hackathon", TagCategory.COLLABORATION),
    ("mentoring", TagCategory.COLLABORATION),
]

DEMO_USERS: list[tuple[str, str, str, str]] = [
    ("Anna", "Nowak", "anna.zarzad@agh.edu.pl", "zarzad"),
    ("Marek", "Kowalski", "marek.koordynator@agh.edu.pl", "koordynator"),
    ("Katarzyna", "Wiśniewska", "katarzyna.opiekun@agh.edu.pl", "opiekun"),
    ("Tomasz", "Lewandowski", "tomasz.promocja@agh.edu.pl", "promocja"),
    ("Joanna", "Wójcik", "joanna.merytoryczna@agh.edu.pl", "merytoryczna"),
]


def _upsert_named(session: Session, model, name: str, **extra) -> None:
    existing = session.scalar(select(model).where(model.name == name))
    if existing is None:
        session.add(model(name=name, **extra))


def seed_pipeline_stages(session: Session) -> None:
    for name, order, prob, outcome in PIPELINE_STAGES:
        existing = session.scalar(
            select(PipelineStage).where(PipelineStage.name == name)
        )
        if existing is None:
            session.add(
                PipelineStage(
                    name=name,
                    order_number=order,
                    success_probability=prob,
                    outcome=outcome,
                )
            )
        else:
            existing.order_number = order
            existing.success_probability = prob
            existing.outcome = outcome


def seed_roles(session: Session) -> None:
    for name in ROLES:
        _upsert_named(session, Role, name)


def seed_relationship_types(session: Session) -> None:
    for name, description in RELATIONSHIP_TYPES:
        existing = session.scalar(
            select(RelationshipType).where(RelationshipType.name == name)
        )
        if existing is None:
            session.add(RelationshipType(name=name, description=description))
        else:
            existing.description = description


def seed_industries(session: Session) -> None:
    for name in INDUSTRIES:
        _upsert_named(session, Industry, name)


def seed_tags(session: Session) -> None:
    for name, category in TAGS:
        existing = session.scalar(select(Tag).where(Tag.name == name))
        if existing is None:
            session.add(Tag(name=name, category=category))
        else:
            existing.category = category


def seed_demo_users(session: Session) -> None:
    for first_name, last_name, email, role_name in DEMO_USERS:
        existing = session.scalar(select(User).where(User.email == email))
        if existing is not None:
            continue
        role = session.scalar(select(Role).where(Role.name == role_name))
        session.add(
            User(
                first_name=first_name,
                last_name=last_name,
                email=email,
                role_id=role.id if role else None,
                is_active=True,
            )
        )


def run() -> None:
    with SessionLocal() as session:
        seed_pipeline_stages(session)
        seed_roles(session)
        session.flush()
        seed_relationship_types(session)
        seed_industries(session)
        seed_tags(session)
        seed_demo_users(session)
        session.commit()
    print("Seeded reference data.")


if __name__ == "__main__":
    run()
