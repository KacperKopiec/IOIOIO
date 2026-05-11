"""Demo dataset – ~20 companies, 3 events, ~30 pipeline entries, ~50 activities.

Usage: docker exec crm-backend uv run python -m app.db.seeds_demo
Idempotent: companies/events keyed by name; reruns skip already-present rows.
Requires `seeds.py` to have been run first (reference rows).
"""
from __future__ import annotations

import random
from datetime import date, datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.activity import Activity
from app.models.company import Company
from app.models.contact import Contact
from app.models.enums import (
    ActivityType,
    CompanySize,
    EventStatus,
)
from app.models.event import Event
from app.models.industry import Industry
from app.models.pipeline import PipelineEntry, PipelineStage
from app.models.role import Role
from app.models.tag import Tag
from app.models.user import User


COMPANIES: list[dict] = [
    {"name": "Comarch", "city": "Kraków", "industry": "IT", "size": CompanySize.CORPORATION,
     "tags": ["enterprise", "saas", "sponsor"]},
    {"name": "Nokia Krakow", "city": "Kraków", "industry": "Telco", "size": CompanySize.CORPORATION,
     "tags": ["enterprise", "embedded"]},
    {"name": "Motorola Solutions", "city": "Kraków", "industry": "Telco", "size": CompanySize.CORPORATION,
     "tags": ["enterprise"]},
    {"name": "ABB Polska", "city": "Kraków", "industry": "Automotive", "size": CompanySize.CORPORATION,
     "tags": ["enterprise"]},
    {"name": "Aptiv", "city": "Kraków", "industry": "Automotive", "size": CompanySize.CORPORATION,
     "tags": ["enterprise", "embedded"]},
    {"name": "Akamai Technologies", "city": "Kraków", "industry": "Cybersecurity", "size": CompanySize.CORPORATION,
     "tags": ["cloud", "cybersecurity"]},
    {"name": "Cisco Systems", "city": "Kraków", "industry": "IT", "size": CompanySize.CORPORATION,
     "tags": ["enterprise", "cloud"]},
    {"name": "Sabre Polska", "city": "Kraków", "industry": "IT", "size": CompanySize.CORPORATION,
     "tags": ["enterprise", "saas"]},
    {"name": "Allegro", "city": "Poznań", "industry": "E-commerce", "size": CompanySize.CORPORATION,
     "tags": ["enterprise", "recruitment"]},
    {"name": "IFS", "city": "Warszawa", "industry": "IT", "size": CompanySize.SME,
     "tags": ["saas", "enterprise"]},
    {"name": "Estimote", "city": "Kraków", "industry": "IT", "size": CompanySize.STARTUP,
     "tags": ["technology"]},
    {"name": "Brainly", "city": "Kraków", "industry": "IT", "size": CompanySize.SME,
     "tags": ["ai_ml", "saas"]},
    {"name": "Bolt", "city": "Warszawa", "industry": "IT", "size": CompanySize.CORPORATION,
     "tags": ["recruitment", "branding"]},
    {"name": "Asseco Poland", "city": "Rzeszów", "industry": "IT", "size": CompanySize.CORPORATION,
     "tags": ["enterprise"]},
    {"name": "Ailleron", "city": "Kraków", "industry": "Fintech", "size": CompanySize.SME,
     "tags": ["enterprise", "saas"]},
    {"name": "PKO Bank Polski", "city": "Warszawa", "industry": "Fintech", "size": CompanySize.CORPORATION,
     "tags": ["enterprise"]},
    {"name": "BNP Paribas", "city": "Warszawa", "industry": "Fintech", "size": CompanySize.CORPORATION,
     "tags": ["enterprise", "partner"]},
    {"name": "Synerise", "city": "Kraków", "industry": "IT", "size": CompanySize.SME,
     "tags": ["ai_ml", "saas"]},
    {"name": "Ten Square Games", "city": "Wrocław", "industry": "IT", "size": CompanySize.SME,
     "tags": ["technology", "recruitment"]},
    {"name": "Solwit", "city": "Gdańsk", "industry": "IT", "size": CompanySize.SME,
     "tags": ["embedded", "enterprise"]},
    {"name": "PGE Energia Odnawialna", "city": "Warszawa", "industry": "Energy", "size": CompanySize.CORPORATION,
     "tags": ["enterprise"]},
]


CONTACT_FIRST_NAMES = [
    "Anna", "Piotr", "Magdalena", "Krzysztof", "Aleksandra",
    "Łukasz", "Karolina", "Michał", "Małgorzata", "Adam",
]
CONTACT_LAST_NAMES = [
    "Nowak", "Kowalski", "Wiśniewski", "Wójcik", "Kowalczyk",
    "Kamiński", "Lewandowski", "Zieliński", "Szymański", "Woźniak",
]
CONTACT_POSITIONS = [
    "Head of People",
    "Talent Acquisition Lead",
    "Marketing Manager",
    "CSR Coordinator",
    "University Relations",
    "Employer Branding Specialist",
]


EVENTS = [
    {
        "name": "SFI 2024",
        "description": "Studencki Festiwal Informatyczny – największa studencka konferencja IT w Polsce.",
        "start_date": date(2024, 3, 5),
        "end_date": date(2024, 3, 8),
        "target_budget": Decimal("180000.00"),
        "target_partners_count": 12,
        "status": EventStatus.CLOSED,
        "tags": ["technology", "sponsor", "workshop"],
    },
    {
        "name": "KrakHack 2025",
        "description": "Hackathon AGH × krakowski ekosystem startupów.",
        "start_date": date(2025, 5, 10),
        "end_date": date(2025, 5, 11),
        "target_budget": Decimal("80000.00"),
        "target_partners_count": 8,
        "status": EventStatus.ACTIVE,
        "tags": ["hackathon", "ai_ml", "sponsor"],
    },
    {
        "name": "AGH Career Fair 2025",
        "description": "Targi pracy Wydziału Informatyki AGH.",
        "start_date": date(2025, 10, 14),
        "end_date": date(2025, 10, 15),
        "target_budget": Decimal("250000.00"),
        "target_partners_count": 20,
        "status": EventStatus.ACTIVE,
        "tags": ["recruitment", "branding", "sponsor"],
    },
]


ACTIVITY_SUBJECTS = {
    ActivityType.EMAIL: [
        "Wysłałem ofertę sponsoringową",
        "Follow-up po targach",
        "Prośba o feedback do pakietu",
    ],
    ActivityType.MEETING: [
        "Spotkanie wstępne",
        "Spotkanie z dyrektorem marketingu",
        "Omówienie warunków pakietu",
    ],
    ActivityType.PHONE_CALL: [
        "Rozmowa wstępna",
        "Ustalenie szczegółów logistycznych",
        "Negocjacja kwoty",
    ],
    ActivityType.NOTE: [
        "Notatka po rozmowie",
        "Wewnętrzny komentarz",
    ],
    ActivityType.FOLLOW_UP: [
        "Przypomnienie o ofercie",
        "Dopytanie o decyzję",
    ],
    ActivityType.TASK: [
        "Przygotować deck dla zarządu",
        "Wysłać draft umowy",
        "Skonfigurować zaproszenie",
    ],
}


def _get_or_create_company(session: Session, payload: dict) -> Company:
    existing = session.scalar(select(Company).where(Company.name == payload["name"]))
    if existing is not None:
        return existing
    industry = session.scalar(
        select(Industry).where(Industry.name == payload["industry"])
    )
    company = Company(
        name=payload["name"],
        city=payload["city"],
        country="Polska",
        industry_id=industry.id if industry else None,
        company_size=payload["size"],
    )
    if payload.get("tags"):
        tags = session.scalars(
            select(Tag).where(Tag.name.in_(payload["tags"]))
        ).all()
        company.tags = list(tags)
    session.add(company)
    session.flush()
    return company


def _seed_contacts_for(session: Session, company: Company, count: int, rng: random.Random) -> None:
    existing = session.scalar(
        select(func.count(Contact.id)).where(Contact.company_id == company.id)
    )
    if existing and existing >= count:
        return
    slug = company.name.lower().replace(" ", "").replace(".", "")
    for _ in range(count - (existing or 0)):
        first = rng.choice(CONTACT_FIRST_NAMES)
        last = rng.choice(CONTACT_LAST_NAMES)
        session.add(
            Contact(
                company_id=company.id,
                first_name=first,
                last_name=last,
                position=rng.choice(CONTACT_POSITIONS),
                email=f"{first.lower()}.{last.lower()}@{slug}.pl",
                phone=f"+48 {rng.randint(500, 799)} {rng.randint(100, 999)} {rng.randint(100, 999)}",
            )
        )


def _get_or_create_event(session: Session, payload: dict, owner: User | None) -> Event:
    existing = session.scalar(select(Event).where(Event.name == payload["name"]))
    if existing is not None:
        return existing
    event = Event(
        name=payload["name"],
        description=payload["description"],
        start_date=payload["start_date"],
        end_date=payload["end_date"],
        target_budget=payload["target_budget"],
        target_partners_count=payload["target_partners_count"],
        status=payload["status"],
        owner_user_id=owner.id if owner else None,
    )
    if payload.get("tags"):
        tags = session.scalars(
            select(Tag).where(Tag.name.in_(payload["tags"]))
        ).all()
        event.tags = list(tags)
    session.add(event)
    session.flush()
    return event


def _seed_pipeline_for_event(
    session: Session,
    event: Event,
    companies: list[Company],
    stages: list[PipelineStage],
    owner: User | None,
    rng: random.Random,
) -> list[PipelineEntry]:
    distribution = {
        EventStatus.CLOSED: [0.05, 0.10, 0.10, 0.55, 0.20],
        EventStatus.ACTIVE: [0.30, 0.25, 0.20, 0.15, 0.10],
        EventStatus.DRAFT: [0.70, 0.20, 0.05, 0.03, 0.02],
    }
    weights = distribution.get(event.status, distribution[EventStatus.ACTIVE])

    selected = rng.sample(companies, min(10, len(companies)))
    entries: list[PipelineEntry] = []
    for company in selected:
        existing = session.scalar(
            select(PipelineEntry).where(
                PipelineEntry.event_id == event.id,
                PipelineEntry.company_id == company.id,
            )
        )
        if existing is not None:
            entries.append(existing)
            continue
        stage = rng.choices(stages, weights=weights, k=1)[0]
        expected = Decimal(rng.choice([5000, 10000, 15000, 25000, 40000]))
        agreed: Decimal | None = None
        closed_at: datetime | None = None
        offer_sent_at: datetime | None = None
        first_contact_at = datetime.combine(event.start_date or date.today(), datetime.min.time()) - timedelta(
            days=rng.randint(30, 180)
        )
        if stage.outcome.value == "won":
            agreed = expected
            closed_at = first_contact_at + timedelta(days=rng.randint(20, 90))
            offer_sent_at = first_contact_at + timedelta(days=rng.randint(5, 20))
        elif stage.outcome.value == "lost":
            closed_at = first_contact_at + timedelta(days=rng.randint(10, 60))
            offer_sent_at = first_contact_at + timedelta(days=rng.randint(5, 20))
        elif stage.name in ("Negocjacje", "Oferta wysłana"):
            offer_sent_at = first_contact_at + timedelta(days=rng.randint(5, 20))

        contact = session.scalar(
            select(Contact).where(Contact.company_id == company.id).limit(1)
        )
        entry = PipelineEntry(
            event_id=event.id,
            company_id=company.id,
            stage_id=stage.id,
            owner_user_id=owner.id if owner else None,
            contact_person_id=contact.id if contact else None,
            expected_amount=expected,
            agreed_amount=agreed,
            first_contact_at=first_contact_at,
            offer_sent_at=offer_sent_at,
            closed_at=closed_at,
            notes=None,
        )
        session.add(entry)
        entries.append(entry)
    session.flush()
    return entries


def _seed_activities(
    session: Session,
    entries: list[PipelineEntry],
    users: list[User],
    count: int,
    rng: random.Random,
) -> None:
    existing = session.scalar(select(func.count(Activity.id))) or 0
    if existing >= count:
        return
    needed = count - existing
    activity_types = list(ActivityType)
    for _ in range(needed):
        if not entries:
            return
        entry = rng.choice(entries)
        atype = rng.choice(activity_types)
        subject = rng.choice(ACTIVITY_SUBJECTS[atype])
        activity_date = (entry.first_contact_at or datetime.utcnow()) + timedelta(
            days=rng.randint(0, 90)
        )
        due_date = activity_date + timedelta(days=rng.randint(1, 14))
        is_completed = rng.random() < 0.6
        session.add(
            Activity(
                company_id=entry.company_id,
                contact_id=entry.contact_person_id,
                event_id=entry.event_id,
                pipeline_entry_id=entry.id,
                assigned_user_id=rng.choice(users).id if users else None,
                activity_type=atype,
                subject=subject,
                description=None,
                activity_date=activity_date,
                due_date=due_date,
                completed_at=due_date if is_completed else None,
            )
        )


def run() -> None:
    rng = random.Random(42)
    with SessionLocal() as session:
        coordinator = session.scalar(
            select(User)
            .join(Role, User.role_id == Role.id)
            .where(Role.name == "koordynator")
        )
        opiekun = session.scalar(
            select(User)
            .join(Role, User.role_id == Role.id)
            .where(Role.name == "opiekun")
        )
        all_users = list(session.scalars(select(User)).all())

        companies: list[Company] = []
        for payload in COMPANIES:
            company = _get_or_create_company(session, payload)
            companies.append(company)
        session.flush()

        for company in companies:
            _seed_contacts_for(session, company, count=2, rng=rng)
        session.flush()

        stages = list(
            session.scalars(
                select(PipelineStage).order_by(PipelineStage.order_number)
            ).all()
        )

        all_entries: list[PipelineEntry] = []
        for payload in EVENTS:
            event = _get_or_create_event(session, payload, owner=coordinator)
            entries = _seed_pipeline_for_event(
                session, event, companies, stages, owner=opiekun, rng=rng
            )
            all_entries.extend(entries)

        _seed_activities(session, all_entries, all_users, count=50, rng=rng)
        session.commit()
    print("Seeded demo data.")


if __name__ == "__main__":
    run()
