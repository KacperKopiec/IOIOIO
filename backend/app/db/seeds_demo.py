"""Curated AGH Computer Science CRM demo dataset.

Usage:
    docker exec crm-backend uv run python -m app.db.seeds_demo

The script is idempotent: it updates/creates demo rows keyed by stable names,
invoice numbers and file URLs. It does not remove existing user-entered data.

For a clean local demo database, run with:
    RESET_DEMO_DATA=1 uv run python -m app.db.seeds_demo
"""
from __future__ import annotations

import os
from datetime import date, datetime, timedelta
from decimal import Decimal

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.activity import Activity
from app.models.company import Company
from app.models.contact import Contact
from app.models.document import Document
from app.models.enums import (
    ActivityType,
    CompanySize,
    EventStatus,
    PaymentStatus,
    RelationshipStatus,
)
from app.models.event import Event
from app.models.industry import Industry
from app.models.invoice import Invoice
from app.models.pipeline import PipelineEntry, PipelineStage
from app.models.relationship import CompanyRelationship, RelationshipType
from app.models.role import Role
from app.models.tag import Tag, company_relationship_tags
from app.models.user import User


DEMO_USERS: list[dict] = [
    {
        "first_name": "Marek",
        "last_name": "Kowalski",
        "email": "marek.koordynator@agh.edu.pl",
        "role": "koordynator",
    },
    {
        "first_name": "Julia",
        "last_name": "Sokołowska",
        "email": "julia.koordynator@agh.edu.pl",
        "role": "koordynator",
    },
    {
        "first_name": "Katarzyna",
        "last_name": "Wiśniewska",
        "email": "katarzyna.opiekun@agh.edu.pl",
        "role": "opiekun",
    },
    {
        "first_name": "Paweł",
        "last_name": "Zieliński",
        "email": "pawel.opiekun@agh.edu.pl",
        "role": "opiekun",
    },
    {
        "first_name": "Tomasz",
        "last_name": "Lewandowski",
        "email": "tomasz.promocja@agh.edu.pl",
        "role": "promocja",
    },
]


COMPANIES: list[dict] = [
    {
        "name": "Comarch",
        "legal_name": "Comarch S.A.",
        "website": "https://www.comarch.pl",
        "nip": "6770065406",
        "city": "Kraków",
        "industry": "IT",
        "size": CompanySize.CORPORATION,
        "owner": "katarzyna.opiekun@agh.edu.pl",
        "tags": ["enterprise", "saas", "sponsor", "partner"],
        "description": "Krakowski partner enterprise software, ERP i usług cloud.",
    },
    {
        "name": "Akamai Technologies",
        "legal_name": "Akamai Technologies Poland Sp. z o.o.",
        "website": "https://www.akamai.com",
        "nip": "6762444216",
        "city": "Kraków",
        "industry": "Cybersecurity",
        "size": CompanySize.CORPORATION,
        "owner": "pawel.opiekun@agh.edu.pl",
        "tags": ["cloud", "cybersecurity", "enterprise", "recruitment"],
        "description": "Cloud security, edge computing i duży zespół inżynierski w Krakowie.",
    },
    {
        "name": "Nokia Kraków",
        "legal_name": "Nokia Solutions and Networks Sp. z o.o.",
        "website": "https://www.nokia.com",
        "nip": "5270206872",
        "city": "Kraków",
        "industry": "Telco",
        "size": CompanySize.CORPORATION,
        "owner": "katarzyna.opiekun@agh.edu.pl",
        "tags": ["embedded", "enterprise", "recruitment"],
        "description": "Telekomunikacja, 5G, embedded software i infrastruktura sieciowa.",
    },
    {
        "name": "Motorola Solutions",
        "legal_name": "Motorola Solutions Systems Polska Sp. z o.o.",
        "website": "https://www.motorolasolutions.com",
        "nip": "6770073494",
        "city": "Kraków",
        "industry": "Cybersecurity",
        "size": CompanySize.CORPORATION,
        "owner": "pawel.opiekun@agh.edu.pl",
        "tags": ["cybersecurity", "embedded", "enterprise"],
        "description": "Systemy bezpieczeństwa publicznego, komunikacja krytyczna i backend.",
    },
    {
        "name": "Aptiv",
        "legal_name": "Aptiv Services Poland S.A.",
        "website": "https://www.aptiv.com",
        "nip": "6760008955",
        "city": "Kraków",
        "industry": "Automotive",
        "size": CompanySize.CORPORATION,
        "owner": "katarzyna.opiekun@agh.edu.pl",
        "tags": ["embedded", "enterprise", "technology"],
        "description": "Software automotive, systemy ADAS i platformy embedded.",
    },
    {
        "name": "Allegro",
        "legal_name": "Allegro Sp. z o.o.",
        "website": "https://allegro.tech",
        "nip": "5252674798",
        "city": "Poznań",
        "industry": "E-commerce",
        "size": CompanySize.CORPORATION,
        "owner": "pawel.opiekun@agh.edu.pl",
        "tags": ["cloud", "saas", "recruitment", "branding"],
        "description": "E-commerce, platform engineering, search, data i skala produkcyjna.",
    },
    {
        "name": "Brainly",
        "legal_name": "Brainly Sp. z o.o.",
        "website": "https://brainly.com",
        "nip": "6762400332",
        "city": "Kraków",
        "industry": "IT",
        "size": CompanySize.SME,
        "owner": "katarzyna.opiekun@agh.edu.pl",
        "tags": ["ai_ml", "saas", "branding", "alumni"],
        "description": "EdTech, AI-assisted learning i produkt globalny z Krakowa.",
    },
    {
        "name": "Synerise",
        "legal_name": "Synerise S.A.",
        "website": "https://synerise.com",
        "nip": "6762430524",
        "city": "Kraków",
        "industry": "IT",
        "size": CompanySize.SME,
        "owner": "pawel.opiekun@agh.edu.pl",
        "tags": ["ai_ml", "saas", "enterprise"],
        "description": "AI, behavioral data, marketing automation i platforma enterprise.",
    },
    {
        "name": "Cisco Systems Poland",
        "legal_name": "Cisco Systems Poland Sp. z o.o.",
        "website": "https://www.cisco.com",
        "nip": "5261036013",
        "city": "Kraków",
        "industry": "IT",
        "size": CompanySize.CORPORATION,
        "owner": "katarzyna.opiekun@agh.edu.pl",
        "tags": ["cloud", "cybersecurity", "enterprise", "partner"],
        "description": "Sieci, cloud, cybersecurity i programy akademickie.",
    },
    {
        "name": "Sabre Polska",
        "legal_name": "Sabre Polska Sp. z o.o.",
        "website": "https://www.sabre.com",
        "nip": "6772176768",
        "city": "Kraków",
        "industry": "IT",
        "size": CompanySize.CORPORATION,
        "owner": "pawel.opiekun@agh.edu.pl",
        "tags": ["cloud", "enterprise", "recruitment"],
        "description": "Travel tech, systemy rozproszone i inżynieria platformowa.",
    },
    {
        "name": "ABB Corporate Technology Center",
        "legal_name": "ABB Business Services Sp. z o.o.",
        "website": "https://global.abb",
        "nip": "5260304484",
        "city": "Kraków",
        "industry": "R&D",
        "size": CompanySize.CORPORATION,
        "owner": "katarzyna.opiekun@agh.edu.pl",
        "tags": ["embedded", "r_and_d", "enterprise"],
        "description": "R&D, automatyka, systemy przemysłowe i software dla energetyki.",
    },
    {
        "name": "Ailleron",
        "legal_name": "Ailleron S.A.",
        "website": "https://ailleron.com",
        "nip": "9451968512",
        "city": "Kraków",
        "industry": "Fintech",
        "size": CompanySize.SME,
        "owner": "pawel.opiekun@agh.edu.pl",
        "tags": ["fintech", "saas", "enterprise"],
        "description": "Fintech, banking software i produkty dla sektora finansowego.",
    },
    {
        "name": "Grape Up",
        "legal_name": "Grape Up Sp. z o.o.",
        "website": "https://grapeup.com",
        "nip": "9452112857",
        "city": "Kraków",
        "industry": "IT",
        "size": CompanySize.SME,
        "owner": "katarzyna.opiekun@agh.edu.pl",
        "tags": ["cloud", "saas", "technology"],
        "description": "Cloud-native software, platform engineering i konsulting technologiczny.",
    },
    {
        "name": "Software Mansion",
        "legal_name": "Software Mansion S.A.",
        "website": "https://swmansion.com",
        "nip": "6751457634",
        "city": "Kraków",
        "industry": "IT",
        "size": CompanySize.SME,
        "owner": "pawel.opiekun@agh.edu.pl",
        "tags": ["startup", "technology", "workshop"],
        "description": "Software house, open source, mobile i web engineering.",
    },
    {
        "name": "OpenX Poland",
        "legal_name": "OpenX Poland Sp. z o.o.",
        "website": "https://www.openx.com",
        "nip": "6762447556",
        "city": "Kraków",
        "industry": "IT",
        "size": CompanySize.SME,
        "owner": "katarzyna.opiekun@agh.edu.pl",
        "tags": ["cloud", "enterprise", "recruitment"],
        "description": "AdTech, systemy wysokiej przepustowości i platformy data.",
    },
    {
        "name": "Revolut Technology Poland",
        "legal_name": "Revolut Technology Poland Sp. z o.o.",
        "website": "https://www.revolut.com",
        "nip": "5252782604",
        "city": "Kraków",
        "industry": "Fintech",
        "size": CompanySize.CORPORATION,
        "owner": "pawel.opiekun@agh.edu.pl",
        "tags": ["fintech", "cloud", "branding"],
        "description": "Fintech, płatności, compliance i backend wysokiej dostępności.",
    },
    {
        "name": "CloudFerro",
        "legal_name": "CloudFerro S.A.",
        "website": "https://cloudferro.com",
        "nip": "5213658283",
        "city": "Warszawa",
        "industry": "IT",
        "size": CompanySize.SME,
        "owner": "katarzyna.opiekun@agh.edu.pl",
        "tags": ["cloud", "r_and_d", "enterprise"],
        "description": "Chmura obliczeniowa dla nauki, danych satelitarnych i HPC.",
    },
    {
        "name": "S-Labs",
        "legal_name": "S-Labs Sp. z o.o.",
        "website": "https://s-labs.pl",
        "nip": "6762464096",
        "city": "Kraków",
        "industry": "IT",
        "size": CompanySize.STARTUP,
        "owner": "pawel.opiekun@agh.edu.pl",
        "tags": ["iot", "embedded", "startup"],
        "description": "IoT, embedded software i prototypowanie urządzeń połączonych.",
    },
]


CONTACTS: dict[str, list[tuple[str, str, str]]] = {
    "Comarch": [
        ("Agnieszka", "Maj", "University Relations Manager"),
        ("Piotr", "Kania", "Head of Employer Branding"),
    ],
    "Akamai Technologies": [
        ("Marta", "Sroka", "Talent Acquisition Lead"),
        ("Krzysztof", "Wrona", "Engineering Manager"),
    ],
    "Nokia Kraków": [
        ("Joanna", "Bąk", "University Program Coordinator"),
        ("Łukasz", "Filipek", "Software Engineering Manager"),
    ],
    "Motorola Solutions": [
        ("Karolina", "Urban", "CSR Coordinator"),
        ("Tomasz", "Wilk", "Security Engineering Lead"),
    ],
    "Aptiv": [
        ("Paulina", "Cieślak", "Talent Partner"),
        ("Adam", "Baran", "Embedded Systems Lead"),
    ],
    "Allegro": [
        ("Natalia", "Krupa", "Employer Branding Specialist"),
        ("Michał", "Lis", "Platform Engineering Manager"),
    ],
    "Brainly": [
        ("Ewa", "Mazur", "People Partner"),
        ("Filip", "Kozioł", "AI Product Lead"),
    ],
    "Synerise": [
        ("Monika", "Sikora", "Partnership Manager"),
        ("Bartosz", "Kurek", "Machine Learning Lead"),
    ],
}


EVENTS: list[dict] = [
    {
        "name": "SFI 2024",
        "description": "Studencki Festiwal Informatyczny AGH: konferencja o AI, cloud, cyberbezpieczeństwie i inżynierii oprogramowania.",
        "start_date": date(2024, 3, 21),
        "end_date": date(2024, 3, 23),
        "target_budget": Decimal("120000.00"),
        "target_partners_count": 8,
        "status": EventStatus.CLOSED,
        "owner": "marek.koordynator@agh.edu.pl",
        "tags": ["technology", "sponsor", "workshop"],
    },
    {
        "name": "KrakHack 2025",
        "description": "Hackathon Wydziału Informatyki AGH wokół AI agents, cybersecurity i danych miejskich.",
        "start_date": date(2025, 5, 17),
        "end_date": date(2025, 5, 18),
        "target_budget": Decimal("85000.00"),
        "target_partners_count": 7,
        "status": EventStatus.ACTIVE,
        "owner": "julia.koordynator@agh.edu.pl",
        "tags": ["hackathon", "ai_ml", "sponsor"],
    },
    {
        "name": "AGH IT Career Fair 2025",
        "description": "Targi pracy i praktyk dla studentów informatyki, cyberbezpieczeństwa, data science i systemów embedded.",
        "start_date": date(2025, 10, 14),
        "end_date": date(2025, 10, 15),
        "target_budget": Decimal("210000.00"),
        "target_partners_count": 16,
        "status": EventStatus.ACTIVE,
        "owner": "marek.koordynator@agh.edu.pl",
        "tags": ["recruitment", "branding", "sponsor"],
    },
    {
        "name": "CyberSec AGH Lab 2026",
        "description": "Cykl warsztatów praktycznych z security engineering, cloud hardening i incident response.",
        "start_date": date(2026, 2, 12),
        "end_date": date(2026, 2, 13),
        "target_budget": Decimal("95000.00"),
        "target_partners_count": 6,
        "status": EventStatus.DRAFT,
        "owner": "julia.koordynator@agh.edu.pl",
        "tags": ["cybersecurity", "workshop", "sponsor"],
    },
]


PIPELINE_PLAN: dict[str, list[tuple[str, str, str, int, int | None, int, int | None, int | None]]] = {
    "SFI 2024": [
        ("Comarch", "Decyzja: TAK", "sponsor", 15000, 15000, -110, -92, -55),
        ("Akamai Technologies", "Decyzja: TAK", "partner", 10000, 10000, -104, -88, -42),
        ("Nokia Kraków", "Decyzja: TAK", "recruitment", 10000, 10000, -100, -80, -40),
        ("Motorola Solutions", "Decyzja: TAK", "sponsor", 10000, 10000, -90, -70, -35),
        ("Aptiv", "Odrzucony", "partner", 12000, None, -85, -62, -20),
        ("Allegro", "Oferta wysłana", "recruitment", 18000, None, -74, -50, None),
        ("Brainly", "Negocjacje", "partner", 8000, None, -70, -45, None),
        ("Cisco Systems Poland", "Zainteresowany", "partner", 16000, None, -60, None, None),
        ("Sabre Polska", "Kontakt", "recruitment", 10000, None, -45, None, None),
        ("ABB Corporate Technology Center", "Odrzucony", "r_and_d", 20000, None, -80, -55, -28),
    ],
    "KrakHack 2025": [
        ("Brainly", "Decyzja: TAK", "sponsor", 15000, 15000, -90, -70, -35),
        ("Synerise", "Decyzja: TAK", "partner", 18000, 18000, -80, -60, -20),
        ("Software Mansion", "Negocjacje", "partner", 12000, None, -45, -28, None),
        ("Grape Up", "Oferta wysłana", "sponsor", 10000, None, -40, -18, None),
        ("Akamai Technologies", "Zainteresowany", "partner", 20000, None, -36, None, None),
        ("S-Labs", "Kontakt", "partner", 6000, None, -20, None, None),
        ("Comarch", "Odrzucony", "sponsor", 25000, None, -70, -50, -15),
        ("CloudFerro", "Oferta wysłana", "r_and_d", 14000, None, -32, -14, None),
    ],
    "AGH IT Career Fair 2025": [
        ("Allegro", "Decyzja: TAK", "recruitment", 35000, 35000, -150, -130, -80),
        ("Nokia Kraków", "Decyzja: TAK", "recruitment", 28000, 28000, -145, -120, -75),
        ("Sabre Polska", "Decyzja: TAK", "recruitment", 22000, 22000, -130, -100, -60),
        ("Motorola Solutions", "Negocjacje", "recruitment", 25000, None, -80, -55, None),
        ("Aptiv", "Oferta wysłana", "recruitment", 20000, None, -72, -40, None),
        ("OpenX Poland", "Zainteresowany", "recruitment", 16000, None, -55, None, None),
        ("Revolut Technology Poland", "Kontakt", "branding", 18000, None, -28, None, None),
        ("Ailleron", "Oferta wysłana", "recruitment", 12000, None, -50, -22, None),
        ("Cisco Systems Poland", "Negocjacje", "partner", 24000, None, -65, -38, None),
        ("Comarch", "Zainteresowany", "sponsor", 30000, None, -40, None, None),
        ("ABB Corporate Technology Center", "Kontakt", "r_and_d", 18000, None, -30, None, None),
        ("Grape Up", "Odrzucony", "partner", 10000, None, -95, -70, -21),
    ],
    "CyberSec AGH Lab 2026": [
        ("Akamai Technologies", "Zainteresowany", "partner", 25000, None, -20, None, None),
        ("Cisco Systems Poland", "Oferta wysłana", "sponsor", 22000, None, -18, -5, None),
        ("Motorola Solutions", "Kontakt", "partner", 18000, None, -12, None, None),
        ("CloudFerro", "Kontakt", "r_and_d", 16000, None, -10, None, None),
        ("OpenX Poland", "Zainteresowany", "partner", 12000, None, -8, None, None),
    ],
}


def _slug(text: str) -> str:
    return (
        text.lower()
        .replace("ą", "a")
        .replace("ć", "c")
        .replace("ę", "e")
        .replace("ł", "l")
        .replace("ń", "n")
        .replace("ó", "o")
        .replace("ś", "s")
        .replace("ż", "z")
        .replace("ź", "z")
        .replace(" ", "")
        .replace(".", "")
    )


def _by_name(session: Session, model, names: list[str]):
    return {row.name: row for row in session.scalars(select(model).where(model.name.in_(names))).all()}


def _ensure_extra_tags(session: Session) -> None:
    from app.models.enums import TagCategory

    for name, category in [
        ("startup", TagCategory.RELATIONSHIP),
        ("iot", TagCategory.TECHNOLOGY),
        ("fintech", TagCategory.TECHNOLOGY),
        ("r_and_d", TagCategory.COLLABORATION),
    ]:
        existing = session.scalar(select(Tag).where(Tag.name == name))
        if existing is None:
            session.add(Tag(name=name, category=category))
        else:
            existing.category = category


def _reset_demo_data(session: Session) -> None:
    session.execute(delete(company_relationship_tags))
    for model in (Invoice, Document, Activity, CompanyRelationship, PipelineEntry, Event, Contact, Company):
        session.execute(delete(model))
    session.commit()


def _upsert_users(session: Session) -> dict[str, User]:
    roles = {role.name: role for role in session.scalars(select(Role)).all()}
    out: dict[str, User] = {}
    for payload in DEMO_USERS:
        user = session.scalar(select(User).where(User.email == payload["email"]))
        if user is None:
            user = User(email=payload["email"], is_active=True)
            session.add(user)
        user.first_name = payload["first_name"]
        user.last_name = payload["last_name"]
        user.role_id = roles[payload["role"]].id if payload["role"] in roles else None
        out[user.email] = user
    session.flush()
    return out


def _upsert_companies(session: Session, users: dict[str, User]) -> dict[str, Company]:
    industries = _by_name(session, Industry, list({c["industry"] for c in COMPANIES}))
    all_tag_names = sorted({tag for c in COMPANIES for tag in c["tags"]})
    tags = _by_name(session, Tag, all_tag_names)

    out: dict[str, Company] = {}
    for payload in COMPANIES:
        company = session.scalar(select(Company).where(Company.name == payload["name"]))
        if company is None:
            company = Company(name=payload["name"])
            session.add(company)
        company.legal_name = payload["legal_name"]
        company.website = payload["website"]
        company.nip = payload["nip"]
        company.city = payload["city"]
        company.country = "Polska"
        company.description = payload["description"]
        company.industry_id = industries[payload["industry"]].id if payload["industry"] in industries else None
        company.company_size = payload["size"]
        owner = users.get(payload["owner"])
        company.owner_user_id = owner.id if owner else None
        company.tags = [tags[name] for name in payload["tags"] if name in tags]
        out[company.name] = company
    session.flush()
    return out


def _upsert_contacts(session: Session, companies: dict[str, Company]) -> None:
    fallback = [
        ("Anna", "Krawczyk", "University Relations"),
        ("Marcin", "Duda", "Engineering Manager"),
    ]
    for company in companies.values():
        contacts = CONTACTS.get(company.name, fallback)
        domain = _slug(company.name) + ".pl"
        for idx, (first, last, position) in enumerate(contacts, start=1):
            email = f"{_slug(first)}.{_slug(last)}@{domain}"
            contact = session.scalar(
                select(Contact).where(
                    Contact.company_id == company.id,
                    Contact.email == email,
                )
            )
            if contact is None:
                contact = Contact(company_id=company.id, email=email)
                session.add(contact)
            contact.first_name = first
            contact.last_name = last
            contact.position = position
            contact.phone = f"+48 600 {company.id:03d} {idx:03d}"
            contact.notes = "Kontakt demo dla współpracy z Wydziałem Informatyki AGH."


def _upsert_events(session: Session, users: dict[str, User]) -> dict[str, Event]:
    all_tag_names = sorted({tag for e in EVENTS for tag in e["tags"]})
    tags = _by_name(session, Tag, all_tag_names)
    out: dict[str, Event] = {}
    for payload in EVENTS:
        event = session.scalar(select(Event).where(Event.name == payload["name"]))
        if event is None:
            event = Event(name=payload["name"])
            session.add(event)
        event.description = payload["description"]
        event.start_date = payload["start_date"]
        event.end_date = payload["end_date"]
        event.target_budget = payload["target_budget"]
        event.target_partners_count = payload["target_partners_count"]
        event.status = payload["status"]
        owner = users.get(payload["owner"])
        event.owner_user_id = owner.id if owner else None
        event.tags = [tags[name] for name in payload["tags"] if name in tags]
        out[event.name] = event
    session.flush()
    return out


def _date_from_event(event: Event, offset_days: int | None) -> datetime | None:
    if offset_days is None:
        return None
    base = event.start_date or date.today()
    return datetime.combine(base, datetime.min.time()) + timedelta(days=offset_days)


def _upsert_pipeline(
    session: Session,
    events: dict[str, Event],
    companies: dict[str, Company],
    users: dict[str, User],
) -> list[PipelineEntry]:
    stages = {stage.name: stage for stage in session.scalars(select(PipelineStage)).all()}
    opiekun_emails = ["katarzyna.opiekun@agh.edu.pl", "pawel.opiekun@agh.edu.pl"]
    entries: list[PipelineEntry] = []

    for event_name, rows in PIPELINE_PLAN.items():
        event = events[event_name]
        for idx, row in enumerate(rows):
            company_name, stage_name, rel_type, expected, agreed, first_offset, offer_offset, closed_offset = row
            company = companies[company_name]
            existing = session.scalar(
                select(PipelineEntry).where(
                    PipelineEntry.event_id == event.id,
                    PipelineEntry.company_id == company.id,
                )
            )
            entry = existing or PipelineEntry(event_id=event.id, company_id=company.id)
            if existing is None:
                session.add(entry)
            owner = users[opiekun_emails[idx % len(opiekun_emails)]]
            contact = session.scalar(
                select(Contact).where(Contact.company_id == company.id).order_by(Contact.id).limit(1)
            )
            entry.stage_id = stages[stage_name].id
            entry.owner_user_id = owner.id
            entry.contact_person_id = contact.id if contact else None
            entry.expected_amount = Decimal(str(expected))
            entry.agreed_amount = Decimal(str(agreed)) if agreed is not None else None
            entry.first_contact_at = _date_from_event(event, first_offset)
            entry.offer_sent_at = _date_from_event(event, offer_offset)
            entry.closed_at = _date_from_event(event, closed_offset)
            entry.rejection_reason = (
                "Budżet przeniesiony na inny kwartał" if stages[stage_name].outcome.value == "lost" else None
            )
            entry.notes = f"Profil: {rel_type}; dobrany do tematyki wydarzenia {event.name}."
            entries.append(entry)
    session.flush()
    return entries


def _upsert_relationships(session: Session, entries: list[PipelineEntry]) -> None:
    rel_types = {row.name: row for row in session.scalars(select(RelationshipType)).all()}
    tags = {row.name: row for row in session.scalars(select(Tag)).all()}
    stages = {row.id: row for row in session.scalars(select(PipelineStage)).all()}

    for entry in entries:
        stage = stages[entry.stage_id]
        if stage.outcome.value != "won":
            continue
        rel_name = "sponsor"
        if entry.notes and "recruitment" in entry.notes:
            rel_name = "recruitment"
        elif entry.notes and "partner" in entry.notes:
            rel_name = "partner"
        elif entry.notes and "r_and_d" in entry.notes:
            rel_name = "r_and_d"

        relationship = session.scalar(
            select(CompanyRelationship).where(
                CompanyRelationship.pipeline_entry_id == entry.id
            )
        )
        if relationship is None:
            relationship = CompanyRelationship(
                company_id=entry.company_id,
                event_id=entry.event_id,
                pipeline_entry_id=entry.id,
                relationship_type_id=rel_types[rel_name].id,
            )
            session.add(relationship)
        relationship.relationship_type_id = rel_types[rel_name].id
        relationship.amount_net = entry.agreed_amount or entry.expected_amount
        relationship.amount_gross = (relationship.amount_net or Decimal("0")) * Decimal("1.23")
        relationship.currency = "PLN"
        relationship.contract_signed_at = entry.closed_at
        relationship.start_date = entry.event.start_date if entry.event else None
        relationship.end_date = entry.event.end_date if entry.event else None
        relationship.owner_user_id = entry.owner_user_id
        relationship.status = RelationshipStatus.ACTIVE
        relationship.package_name = {
            "sponsor": "Pakiet Sponsor",
            "partner": "Pakiet Partner Merytoryczny",
            "recruitment": "Pakiet Rekrutacyjny",
            "r_and_d": "Pakiet R&D",
        }.get(rel_name, "Pakiet Partner")
        relationship.notes = "Relacja utworzona z wygranego wpisu pipeline demo."
        tag_names = list(dict.fromkeys([rel_name, "sponsor"]))
        relationship.tags = [tags[name] for name in tag_names if name in tags]


def _activity_key(session: Session, entry: PipelineEntry, subject: str, activity_type: ActivityType) -> Activity | None:
    return session.scalar(
        select(Activity).where(
            Activity.pipeline_entry_id == entry.id,
            Activity.subject == subject,
            Activity.activity_type == activity_type,
        )
    )


def _upsert_activities(session: Session, entries: list[PipelineEntry], users: dict[str, User]) -> None:
    stages = {row.id: row for row in session.scalars(select(PipelineStage)).all()}
    today = datetime.utcnow().replace(hour=9, minute=0, second=0, microsecond=0)
    assignee_cycle = [users["katarzyna.opiekun@agh.edu.pl"], users["pawel.opiekun@agh.edu.pl"]]

    for idx, entry in enumerate(entries):
        stage = stages[entry.stage_id]
        company_name = entry.company.name if entry.company else f"firma #{entry.company_id}"
        seed_rows: list[tuple[ActivityType, str, str, datetime | None, datetime | None, bool]] = [
            (
                ActivityType.EMAIL,
                f"Wysłano intro do {company_name}",
                "Pierwsza wiadomość z opisem inicjatywy i propozycją rozmowy.",
                entry.first_contact_at,
                None,
                True,
            ),
            (
                ActivityType.NOTE,
                f"Profil partnera: {company_name}",
                f"Dopasowanie do wydarzenia: {entry.notes}",
                (entry.first_contact_at or today) + timedelta(days=1),
                None,
                True,
            ),
        ]
        if entry.offer_sent_at:
            seed_rows.append(
                (
                    ActivityType.EMAIL,
                    f"Wysłano ofertę pakietową do {company_name}",
                    "Oferta zawiera pakiety sponsoringowe, obecność w komunikacji i propozycję warsztatu.",
                    entry.offer_sent_at,
                    None,
                    True,
                )
            )
        if stage.outcome.value == "open":
            due = today - timedelta(days=2) if idx % 3 == 0 else today + timedelta(days=5 + idx % 5)
            seed_rows.append(
                (
                    ActivityType.FOLLOW_UP,
                    f"Ponowić kontakt: {company_name}",
                    "Sprawdzić decyzję po przesłaniu oferty i ustalić kolejny krok.",
                    None,
                    due,
                    False,
                )
            )
        elif stage.outcome.value == "won":
            seed_rows.append(
                (
                    ActivityType.TASK,
                    f"Domknąć materiały partnerskie: {company_name}",
                    "Uzupełnić logo, opis firmy i informacje do strony wydarzenia.",
                    None,
                    (entry.closed_at or today) + timedelta(days=7),
                    True,
                )
            )
        else:
            seed_rows.append(
                (
                    ActivityType.NOTE,
                    f"Powód odrzucenia: {company_name}",
                    entry.rejection_reason or "Firma nie weszła w partnerstwo w tej edycji.",
                    entry.closed_at,
                    None,
                    True,
                )
            )

        for atype, subject, description, activity_date, due_date, completed in seed_rows:
            activity = _activity_key(session, entry, subject, atype)
            if activity is None:
                activity = Activity(
                    pipeline_entry_id=entry.id,
                    company_id=entry.company_id,
                    event_id=entry.event_id,
                    contact_id=entry.contact_person_id,
                    activity_type=atype,
                    subject=subject,
                )
                session.add(activity)
            activity.description = description
            activity.activity_date = activity_date
            activity.due_date = due_date
            activity.assigned_user_id = assignee_cycle[idx % len(assignee_cycle)].id
            activity.completed_at = due_date if completed and due_date else None


def _upsert_invoices(session: Session, entries: list[PipelineEntry]) -> None:
    statuses = [PaymentStatus.PAID, PaymentStatus.PENDING, PaymentStatus.UNPAID]
    won_entries = [entry for entry in entries if entry.agreed_amount is not None]
    for idx, entry in enumerate(won_entries, start=1):
        invoice_number = f"FV/AGH-IT/{entry.event_id:02d}/{entry.company_id:03d}"
        invoice = session.scalar(select(Invoice).where(Invoice.invoice_number == invoice_number))
        if invoice is None:
            invoice = Invoice(invoice_number=invoice_number)
            session.add(invoice)
        issue_date = (entry.closed_at or datetime.utcnow()).date()
        status = statuses[idx % len(statuses)]
        invoice.company_id = entry.company_id
        invoice.event_id = entry.event_id
        invoice.amount = entry.agreed_amount or entry.expected_amount or Decimal("0")
        invoice.currency = "PLN"
        invoice.issue_date = issue_date
        invoice.due_date = issue_date + timedelta(days=14)
        invoice.payment_status = status
        invoice.paid_at = issue_date + timedelta(days=8) if status == PaymentStatus.PAID else None
        invoice.notes = "Demo: rejestr faktur za pakiet partnerski wydarzenia AGH."


def _upsert_documents(session: Session, entries: list[PipelineEntry], users: dict[str, User]) -> None:
    uploader = users.get("marek.koordynator@agh.edu.pl")
    for entry in entries:
        if entry.agreed_amount is None:
            continue
        file_url = f"/demo/documents/event-{entry.event_id}/company-{entry.company_id}-umowa.pdf"
        document = session.scalar(select(Document).where(Document.file_url == file_url))
        if document is None:
            document = Document(file_url=file_url)
            session.add(document)
        document.company_id = entry.company_id
        document.event_id = entry.event_id
        document.pipeline_entry_id = entry.id
        document.uploaded_by_user_id = uploader.id if uploader else None
        document.file_name = f"Umowa partnerska - {entry.company.name if entry.company else entry.company_id}.pdf"
        document.document_type = "umowa"
        document.archived = False


def run() -> None:
    with SessionLocal() as session:
        if os.getenv("RESET_DEMO_DATA") == "1":
            _reset_demo_data(session)

        _ensure_extra_tags(session)
        session.flush()
        users = _upsert_users(session)
        companies = _upsert_companies(session, users)
        _upsert_contacts(session, companies)
        events = _upsert_events(session, users)
        entries = _upsert_pipeline(session, events, companies, users)
        session.flush()
        # Load relationships for convenience in subsequent seed sections.
        for entry in entries:
            session.refresh(entry)
        _upsert_relationships(session, entries)
        _upsert_activities(session, entries, users)
        _upsert_invoices(session, entries)
        _upsert_documents(session, entries, users)
        session.commit()
    print("Seeded curated AGH IT demo data.")


if __name__ == "__main__":
    run()
