"""Curated AGH Computer Science CRM demo dataset.

Usage:
    docker exec crm-backend uv run python -m app.db.seeds_demo

The script is idempotent: it updates/creates demo rows keyed by stable names,
invoice numbers and file URLs. It does not remove existing user-entered data.

For a clean local demo database, run with:
    RESET_DEMO_DATA=1 uv run python -m app.db.seeds_demo

Skala danych demo (stan na 2026-05-21):
    - 5 użytkowników (2 koordynatorów, 2 opiekunów, 1 promocja)
    - 13 wydarzeń (2024 -> 2028; CLOSED, ACTIVE, DRAFT)
    - ~110 firm partnerskich z polskiego rynku IT
    - 2 kontakty na firmę (manualne lub deterministyczny fallback)
    - ~300 wpisów lejka (pipeline) rozłożonych po latach
    - Aktywności dla każdego wpisu: email intro, notatka, oferta,
      telefon, spotkanie, follow-up, notatka spotkaniowa, task
    - Faktury dla WON (status zależny od wieku zamknięcia)
    - Dokumenty: umowa, brief, logo, NDA, oferta, raport poseventowy
"""
from __future__ import annotations

import os
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Iterable

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
    TagCategory,
)
from app.models.event import Event
from app.models.industry import Industry
from app.models.invoice import Invoice
from app.models.pipeline import PipelineEntry, PipelineStage
from app.models.relationship import CompanyRelationship, RelationshipType
from app.models.role import Role
from app.models.tag import Tag, company_relationship_tags
from app.models.user import User


TODAY = date(2026, 5, 21)


DEMO_USERS: list[dict] = [
    {"first_name": "Marek", "last_name": "Kowalski", "email": "fabia+koordynator@student.agh.edu.pl", "role": "koordynator"},
    {"first_name": "Julia", "last_name": "Sokołowska", "email": "fabia+koordynator2@student.agh.edu.pl", "role": "koordynator"},
    {"first_name": "Katarzyna", "last_name": "Wiśniewska", "email": "fabia+opiekun@student.agh.edu.pl", "role": "opiekun"},
    {"first_name": "Paweł", "last_name": "Zieliński", "email": "fabia+opiekun2@student.agh.edu.pl", "role": "opiekun"},
    {"first_name": "Tomasz", "last_name": "Lewandowski", "email": "fabia+promocja@student.agh.edu.pl", "role": "promocja"},
]


EXTRA_TAGS: list[tuple[str, TagCategory]] = [
    ("startup", TagCategory.RELATIONSHIP),
    ("iot", TagCategory.TECHNOLOGY),
    ("fintech", TagCategory.TECHNOLOGY),
    ("r_and_d", TagCategory.COLLABORATION),
    ("gamedev", TagCategory.TECHNOLOGY),
    ("data", TagCategory.TECHNOLOGY),
    ("medtech", TagCategory.TECHNOLOGY),
    ("energy_tech", TagCategory.TECHNOLOGY),
    ("automotive_tech", TagCategory.TECHNOLOGY),
    ("ecommerce", TagCategory.TECHNOLOGY),
    ("public_sector", TagCategory.RELATIONSHIP),
    ("global_corp", TagCategory.RELATIONSHIP),
    ("local", TagCategory.RELATIONSHIP),
    ("internship", TagCategory.INTEREST),
]


OPIEKUN_1 = "fabia+opiekun@student.agh.edu.pl"
OPIEKUN_2 = "fabia+opiekun2@student.agh.edu.pl"
KOORD_1 = "fabia+koordynator@student.agh.edu.pl"
KOORD_2 = "fabia+koordynator2@student.agh.edu.pl"


def _C(name, legal_name, website, nip, city, industry, size, owner, tags, description):
    return {
        "name": name, "legal_name": legal_name, "website": website, "nip": nip,
        "city": city, "industry": industry, "size": size, "owner": owner,
        "tags": tags, "description": description,
    }


COMPANIES: list[dict] = [
    # --- Kraków: duzi gracze IT/tech ---
    _C("Comarch", "Comarch S.A.", "https://www.comarch.pl", "6770065406", "Kraków", "IT", CompanySize.CORPORATION, OPIEKUN_1, ["enterprise", "saas", "sponsor", "partner", "local"], "Krakowski partner enterprise software, ERP i usług cloud."),
    _C("Akamai Technologies", "Akamai Technologies Poland Sp. z o.o.", "https://www.akamai.com", "6762444216", "Kraków", "Cybersecurity", CompanySize.CORPORATION, OPIEKUN_2, ["cloud", "cybersecurity", "enterprise", "recruitment", "global_corp"], "Cloud security, edge computing i duży zespół inżynierski w Krakowie."),
    _C("Nokia Kraków", "Nokia Solutions and Networks Sp. z o.o.", "https://www.nokia.com", "5270206872", "Kraków", "Telco", CompanySize.CORPORATION, OPIEKUN_1, ["embedded", "enterprise", "recruitment", "global_corp"], "Telekomunikacja, 5G, embedded software i infrastruktura sieciowa."),
    _C("Motorola Solutions", "Motorola Solutions Systems Polska Sp. z o.o.", "https://www.motorolasolutions.com", "6770073494", "Kraków", "Cybersecurity", CompanySize.CORPORATION, OPIEKUN_2, ["cybersecurity", "embedded", "enterprise", "global_corp"], "Systemy bezpieczeństwa publicznego, komunikacja krytyczna i backend."),
    _C("Aptiv", "Aptiv Services Poland S.A.", "https://www.aptiv.com", "6760008955", "Kraków", "Automotive", CompanySize.CORPORATION, OPIEKUN_1, ["embedded", "enterprise", "technology", "automotive_tech"], "Software automotive, systemy ADAS i platformy embedded."),
    _C("Cisco Systems Poland", "Cisco Systems Poland Sp. z o.o.", "https://www.cisco.com", "5261036013", "Kraków", "IT", CompanySize.CORPORATION, OPIEKUN_1, ["cloud", "cybersecurity", "enterprise", "partner", "global_corp"], "Sieci, cloud, cybersecurity i programy akademickie."),
    _C("Sabre Polska", "Sabre Polska Sp. z o.o.", "https://www.sabre.com", "6772176768", "Kraków", "IT", CompanySize.CORPORATION, OPIEKUN_2, ["cloud", "enterprise", "recruitment", "global_corp"], "Travel tech, systemy rozproszone i inżynieria platformowa."),
    _C("ABB Corporate Technology Center", "ABB Business Services Sp. z o.o.", "https://global.abb", "5260304484", "Kraków", "R&D", CompanySize.CORPORATION, OPIEKUN_1, ["embedded", "r_and_d", "enterprise", "global_corp"], "R&D, automatyka, systemy przemysłowe i software dla energetyki."),
    _C("IBM Polska", "IBM Polska Sp. z o.o.", "https://www.ibm.com/pl-pl", "5260307883", "Kraków", "IT", CompanySize.CORPORATION, OPIEKUN_2, ["cloud", "ai_ml", "enterprise", "global_corp", "recruitment"], "Cloud, AI, mainframe i programy uniwersyteckie."),
    _C("Capgemini Polska", "Capgemini Polska Sp. z o.o.", "https://www.capgemini.com", "5262134175", "Kraków", "IT", CompanySize.CORPORATION, OPIEKUN_1, ["cloud", "enterprise", "global_corp", "recruitment", "mentoring"], "Konsulting IT, transformacja cyfrowa, outsourcing."),
    _C("Ericsson Polska", "Ericsson Sp. z o.o.", "https://www.ericsson.com", "5260205255", "Kraków", "Telco", CompanySize.CORPORATION, OPIEKUN_2, ["embedded", "enterprise", "global_corp", "recruitment"], "5G, sieci dostępowe, R&D radia."),
    _C("HSBC Service Delivery Polska", "HSBC Service Delivery (Polska) Sp. z o.o.", "https://www.hsbc.com", "6762413581", "Kraków", "Fintech", CompanySize.CORPORATION, OPIEKUN_1, ["fintech", "enterprise", "global_corp", "recruitment"], "Bankowość globalna, IT operations, fraud i compliance."),
    _C("Shell Business Operations", "Shell Polska Sp. z o.o.", "https://www.shell.pl", "5252246313", "Kraków", "Energy", CompanySize.CORPORATION, OPIEKUN_2, ["enterprise", "global_corp", "energy_tech", "recruitment"], "Globalne centrum usług biznesowych Shell, IT i finanse."),
    _C("Philip Morris Digital Hub", "Philip Morris Polska Distribution Sp. z o.o.", "https://www.pmi.com", "5252385127", "Kraków", "IT", CompanySize.CORPORATION, OPIEKUN_1, ["cloud", "data", "enterprise", "global_corp"], "Digital hub PMI: dane, e-commerce, IoT urządzeń konsumenckich."),
    _C("UBS Kraków", "UBS Business Solutions Poland Sp. z o.o.", "https://www.ubs.com", "6762506841", "Kraków", "Fintech", CompanySize.CORPORATION, OPIEKUN_2, ["fintech", "enterprise", "global_corp", "recruitment"], "Banking IT, trading systems, risk i compliance."),
    _C("State Street", "State Street Bank International GmbH Oddział w Polsce", "https://www.statestreet.com", "1080014555", "Kraków", "Fintech", CompanySize.CORPORATION, OPIEKUN_1, ["fintech", "enterprise", "global_corp"], "Asset management, post-trade i platformy danych finansowych."),
    _C("Lufthansa Systems Poland", "Lufthansa Systems Poland Sp. z o.o.", "https://www.lhsystems.com", "6762315214", "Kraków", "IT", CompanySize.CORPORATION, OPIEKUN_2, ["enterprise", "global_corp", "recruitment"], "Software dla lotnictwa, scheduling, operations."),
    _C("Heineken Global Shared Services", "HEINEKEN Global Shared Services Sp. z o.o.", "https://www.theheinekencompany.com", "6762470680", "Kraków", "IT", CompanySize.CORPORATION, OPIEKUN_1, ["enterprise", "data", "global_corp"], "Centrum usług wspólnych Heinekena: IT, analytics, automation."),
    _C("Schibsted Polska", "Schibsted Tech Polska Sp. z o.o.", "https://schibsted.pl", "6762469960", "Kraków", "IT", CompanySize.CORPORATION, OPIEKUN_2, ["cloud", "data", "ecommerce", "global_corp"], "Media i marketplaces — backend, ML, mobile."),
    _C("Sii Polska", "Sii Sp. z o.o.", "https://sii.pl", "5252612180", "Kraków", "IT", CompanySize.CORPORATION, OPIEKUN_1, ["enterprise", "saas", "recruitment", "mentoring"], "Software house, konsulting IT, outsourcing inżynieryjny."),
    _C("ALSTOM Polska", "Alstom Konstal S.A.", "https://www.alstom.com", "5780002293", "Kraków", "R&D", CompanySize.CORPORATION, OPIEKUN_2, ["embedded", "r_and_d", "global_corp"], "Transport szynowy, systemy sterowania pociągów."),

    # --- Kraków: SME/scale-ups ---
    _C("Brainly", "Brainly Sp. z o.o.", "https://brainly.com", "6762400332", "Kraków", "IT", CompanySize.SME, OPIEKUN_1, ["ai_ml", "saas", "branding", "alumni"], "EdTech, AI-assisted learning i produkt globalny z Krakowa."),
    _C("Synerise", "Synerise S.A.", "https://synerise.com", "6762430524", "Kraków", "IT", CompanySize.SME, OPIEKUN_2, ["ai_ml", "saas", "enterprise", "data"], "AI, behavioral data, marketing automation i platforma enterprise."),
    _C("Ailleron", "Ailleron S.A.", "https://ailleron.com", "9451968512", "Kraków", "Fintech", CompanySize.SME, OPIEKUN_1, ["fintech", "saas", "enterprise"], "Fintech, banking software i produkty dla sektora finansowego."),
    _C("Grape Up", "Grape Up Sp. z o.o.", "https://grapeup.com", "9452112857", "Kraków", "IT", CompanySize.SME, OPIEKUN_2, ["cloud", "saas", "technology"], "Cloud-native software, platform engineering i konsulting technologiczny."),
    _C("Software Mansion", "Software Mansion S.A.", "https://swmansion.com", "6751457634", "Kraków", "IT", CompanySize.SME, OPIEKUN_1, ["startup", "technology", "workshop"], "Software house, open source, mobile i web engineering."),
    _C("OpenX Poland", "OpenX Poland Sp. z o.o.", "https://www.openx.com", "6762447556", "Kraków", "IT", CompanySize.SME, OPIEKUN_2, ["cloud", "enterprise", "recruitment", "data"], "AdTech, systemy wysokiej przepustowości i platformy data."),
    _C("Revolut Technology Poland", "Revolut Technology Poland Sp. z o.o.", "https://www.revolut.com", "5252782604", "Kraków", "Fintech", CompanySize.CORPORATION, OPIEKUN_1, ["fintech", "cloud", "branding", "global_corp"], "Fintech, płatności, compliance i backend wysokiej dostępności."),
    _C("Future Processing", "Future Processing Sp. z o.o.", "https://www.future-processing.com", "6342214756", "Gliwice", "IT", CompanySize.SME, OPIEKUN_2, ["enterprise", "saas", "mentoring"], "Software house, outsourcing inżynieryjny, projekty enterprise."),
    _C("Codete", "Codete Sp. z o.o.", "https://codete.com", "6762447100", "Kraków", "IT", CompanySize.SME, OPIEKUN_1, ["data", "ai_ml", "saas"], "Konsulting data i AI, custom software."),
    _C("Spyrosoft", "Spyrosoft S.A.", "https://spyro-soft.com", "8943064215", "Wrocław", "IT", CompanySize.SME, OPIEKUN_2, ["enterprise", "saas", "recruitment"], "Custom software, geospatial, automotive, fintech."),
    _C("STX Next", "STX Next Sp. z o.o.", "https://www.stxnext.com", "7792302348", "Poznań", "IT", CompanySize.SME, OPIEKUN_1, ["saas", "technology", "mentoring"], "Python house, web i fintech."),
    _C("Apptension", "Apptension Sp. z o.o.", "https://www.apptension.com", "7831704583", "Poznań", "IT", CompanySize.SME, OPIEKUN_2, ["saas", "branding", "startup"], "Product studio, web/mobile, startup-friendly."),
    _C("Estimote", "Estimote Sp. z o.o.", "https://estimote.com", "6762430110", "Kraków", "IT", CompanySize.STARTUP, OPIEKUN_1, ["iot", "embedded", "startup"], "Beacons, IoT proximity, lokalizacja w pomieszczeniach."),
    _C("S-Labs", "S-Labs Sp. z o.o.", "https://s-labs.pl", "6762464096", "Kraków", "IT", CompanySize.STARTUP, OPIEKUN_2, ["iot", "embedded", "startup"], "IoT, embedded software i prototypowanie urządzeń połączonych."),
    _C("Bright Inventions", "Bright Inventions Sp. z o.o.", "https://brightinventions.pl", "5842723531", "Gdańsk", "IT", CompanySize.SME, OPIEKUN_1, ["iot", "saas", "startup"], "Software house, mobile, IoT, blockchain."),

    # --- Warszawa ---
    _C("Allegro", "Allegro Sp. z o.o.", "https://allegro.tech", "5252674798", "Warszawa", "E-commerce", CompanySize.CORPORATION, OPIEKUN_1, ["cloud", "saas", "recruitment", "branding", "ecommerce"], "E-commerce, platform engineering, search, data i skala produkcyjna."),
    _C("CD Projekt RED", "CD PROJEKT S.A.", "https://www.cdprojekt.com", "7342867148", "Warszawa", "IT", CompanySize.CORPORATION, OPIEKUN_2, ["gamedev", "branding", "global_corp"], "Gamedev, AAA, silnik REDengine, branding krajowy."),
    _C("Asseco Poland", "Asseco Poland S.A.", "https://www.asseco.com", "5220011478", "Rzeszów", "IT", CompanySize.CORPORATION, OPIEKUN_1, ["enterprise", "saas", "fintech", "public_sector"], "Software enterprise, bankowość, ZUS, e-government."),
    _C("Onwelo", "Onwelo S.A.", "https://onwelo.com", "5252571683", "Warszawa", "IT", CompanySize.SME, OPIEKUN_2, ["cloud", "data", "enterprise"], "Konsulting IT, data i cloud."),
    _C("CloudFerro", "CloudFerro S.A.", "https://cloudferro.com", "5213658283", "Warszawa", "IT", CompanySize.SME, OPIEKUN_1, ["cloud", "r_and_d", "enterprise", "data"], "Chmura obliczeniowa dla nauki, danych satelitarnych i HPC."),
    _C("Goldman Sachs Poland", "Goldman Sachs Poland Services Sp. z o.o.", "https://www.goldmansachs.com", "5252773770", "Warszawa", "Fintech", CompanySize.CORPORATION, OPIEKUN_2, ["fintech", "enterprise", "global_corp", "recruitment"], "Investment banking, trading platforms, risk, engineering hub."),
    _C("Google Poland", "Google Poland Sp. z o.o.", "https://about.google", "5262842610", "Warszawa", "IT", CompanySize.CORPORATION, OPIEKUN_1, ["cloud", "ai_ml", "global_corp", "branding"], "Cloud, ML i programy akademickie Google."),
    _C("Microsoft Polska", "Microsoft Sp. z o.o.", "https://www.microsoft.com/pl-pl", "5270103391", "Warszawa", "IT", CompanySize.CORPORATION, OPIEKUN_2, ["cloud", "ai_ml", "enterprise", "global_corp"], "Azure, Dynamics, Visual Studio, partnerstwa edukacyjne."),
    _C("Samsung R&D Polska", "Samsung R&D Institute Poland Sp. z o.o.", "https://research.samsung.com/srpol", "5252376681", "Warszawa", "R&D", CompanySize.CORPORATION, OPIEKUN_1, ["ai_ml", "embedded", "r_and_d", "global_corp"], "AI, NLP, multimedia, embedded — globalny instytut Samsunga."),
    _C("Meta Poland", "Meta Platforms Poland Sp. z o.o.", "https://about.meta.com", "5252913013", "Warszawa", "IT", CompanySize.CORPORATION, OPIEKUN_2, ["ai_ml", "cloud", "global_corp", "branding"], "Inżynieria platformowa, AI, ad-tech."),
    _C("Orange Polska", "Orange Polska S.A.", "https://www.orange.pl", "5260250995", "Warszawa", "Telco", CompanySize.CORPORATION, OPIEKUN_1, ["enterprise", "recruitment", "local", "energy_tech"], "Telekomunikacja, sieci, IoT, B2B."),
    _C("T-Mobile Polska", "T-Mobile Polska S.A.", "https://www.t-mobile.pl", "5261040567", "Warszawa", "Telco", CompanySize.CORPORATION, OPIEKUN_2, ["enterprise", "recruitment", "global_corp"], "Telekomunikacja, mobile, B2B."),
    _C("Play P4", "P4 Sp. z o.o.", "https://www.play.pl", "9512120077", "Warszawa", "Telco", CompanySize.CORPORATION, OPIEKUN_1, ["enterprise", "recruitment", "local"], "Telekomunikacja, MNO, infrastruktura sieciowa."),
    _C("Citi Service Center Poland", "Citibank Europe plc Oddział w Polsce", "https://www.citi.com/poland", "5252197737", "Warszawa", "Fintech", CompanySize.CORPORATION, OPIEKUN_2, ["fintech", "enterprise", "global_corp"], "Banking IT, trading, ops."),
    _C("JPMorgan Chase Poland", "JPMorgan Polska Services Sp. z o.o.", "https://www.jpmorganchase.com", "5252758103", "Warszawa", "Fintech", CompanySize.CORPORATION, OPIEKUN_1, ["fintech", "enterprise", "global_corp", "recruitment"], "Investment banking, asset management, engineering hub."),
    _C("mBank IT", "mBank S.A.", "https://www.mbank.pl", "5260215088", "Warszawa", "Fintech", CompanySize.CORPORATION, OPIEKUN_2, ["fintech", "enterprise", "local"], "Bankowość detaliczna i korporacyjna, IT in-house."),
    _C("PKO BP IT", "Powszechna Kasa Oszczędności Bank Polski S.A.", "https://www.pkobp.pl", "5250007738", "Warszawa", "Fintech", CompanySize.CORPORATION, OPIEKUN_1, ["fintech", "enterprise", "local", "public_sector"], "Największy bank w Polsce, IT in-house, mobile."),
    _C("PZU IT", "Powszechny Zakład Ubezpieczeń S.A.", "https://www.pzu.pl", "5260005381", "Warszawa", "Fintech", CompanySize.CORPORATION, OPIEKUN_2, ["fintech", "enterprise", "local", "data"], "Ubezpieczenia, IT in-house, data."),
    _C("Inpost", "InPost S.A.", "https://inpost.pl", "6793108059", "Kraków", "E-commerce", CompanySize.CORPORATION, OPIEKUN_1, ["ecommerce", "iot", "enterprise", "local"], "Logistyka, paczkomaty, IoT, e-commerce."),
    _C("PGE Energia Odnawialna", "PGE Energia Odnawialna S.A.", "https://www.gkpge.pl", "5260017639", "Warszawa", "Energy", CompanySize.CORPORATION, OPIEKUN_2, ["energy_tech", "enterprise", "public_sector", "local"], "Energetyka odnawialna, OZE, IT operacyjne."),
    _C("Tauron Polska Energia", "TAURON Polska Energia S.A.", "https://www.tauron.pl", "9542583988", "Katowice", "Energy", CompanySize.CORPORATION, OPIEKUN_1, ["energy_tech", "enterprise", "public_sector"], "Energetyka, dystrybucja, smart metering."),

    # --- Wrocław ---
    _C("Nokia Wrocław", "Nokia Solutions and Networks Wrocław", "https://www.nokia.com", "8961005804", "Wrocław", "Telco", CompanySize.CORPORATION, OPIEKUN_2, ["embedded", "enterprise", "global_corp"], "5G core, radio software, R&D."),
    _C("Volvo IT Wrocław", "Volvo IT Sp. z o.o.", "https://www.volvogroup.com", "8951740645", "Wrocław", "Automotive", CompanySize.CORPORATION, OPIEKUN_1, ["embedded", "automotive_tech", "global_corp"], "Software dla pojazdów ciężarowych, telematics."),
    _C("Credit Agricole IT", "Credit Agricole Bank Polska S.A.", "https://www.credit-agricole.pl", "8970005923", "Wrocław", "Fintech", CompanySize.CORPORATION, OPIEKUN_2, ["fintech", "enterprise", "global_corp"], "Bankowość, IT in-house, transformacja cyfrowa."),
    _C("CodiLime", "CodiLime Sp. z o.o.", "https://codilime.com", "5252563210", "Warszawa", "IT", CompanySize.SME, OPIEKUN_1, ["enterprise", "cloud", "saas"], "Networking, SDN, cloud-native engineering."),
    _C("Techland", "Techland Sp. z o.o.", "https://techland.net", "8941018858", "Wrocław", "IT", CompanySize.CORPORATION, OPIEKUN_2, ["gamedev", "branding"], "Gamedev AAA, Dying Light, własny silnik."),
    _C("Ten Square Games", "Ten Square Games S.A.", "https://tensquaregames.com", "8982167107", "Wrocław", "IT", CompanySize.SME, OPIEKUN_1, ["gamedev", "saas", "branding"], "Free-to-play mobile games, monetyzacja, LiveOps."),
    _C("Capgemini Wrocław", "Capgemini Polska Sp. z o.o. (oddział Wrocław)", "https://www.capgemini.com", "8952121420", "Wrocław", "IT", CompanySize.CORPORATION, OPIEKUN_2, ["enterprise", "global_corp", "recruitment"], "Wrocławski oddział Capgemini, projekty enterprise."),

    # --- Trójmiasto ---
    _C("Atlassian Poland", "Atlassian Poland Sp. z o.o.", "https://www.atlassian.com", "5252781462", "Gdańsk", "IT", CompanySize.CORPORATION, OPIEKUN_1, ["saas", "cloud", "global_corp", "recruitment"], "Jira, Confluence, Bitbucket — engineering hub w Gdańsku."),
    _C("Intel Technology Poland", "Intel Technology Poland Sp. z o.o.", "https://www.intel.pl", "5832758155", "Gdańsk", "R&D", CompanySize.CORPORATION, OPIEKUN_2, ["embedded", "r_and_d", "global_corp"], "Software dla CPU/GPU, multimedia, AI."),
    _C("Energa Operator", "ENERGA-OPERATOR S.A.", "https://energa-operator.pl", "5830001183", "Gdańsk", "Energy", CompanySize.CORPORATION, OPIEKUN_1, ["energy_tech", "enterprise", "public_sector", "local"], "Operator systemu dystrybucyjnego energii."),
    _C("Lufthansa Systems Gdańsk", "Lufthansa Systems Poland Gdańsk", "https://www.lhsystems.com", "5833148123", "Gdańsk", "IT", CompanySize.CORPORATION, OPIEKUN_2, ["enterprise", "global_corp"], "Aviation IT, scheduling, operations."),
    _C("Playway", "Playway S.A.", "https://www.playway.com", "1182118556", "Warszawa", "IT", CompanySize.SME, OPIEKUN_1, ["gamedev", "saas"], "Wydawca gier indie i mid-core."),
    _C("Vivid Games", "Vivid Games S.A.", "https://www.vividgames.com", "9532495748", "Bydgoszcz", "IT", CompanySize.SME, OPIEKUN_2, ["gamedev", "branding"], "Mobile games, F2P, własne IP."),
    _C("Intive", "Intive Sp. z o.o.", "https://www.intive.com", "9542588817", "Wrocław", "IT", CompanySize.SME, OPIEKUN_1, ["enterprise", "saas", "global_corp"], "Software house, web/mobile, e-commerce."),

    # --- Poznań ---
    _C("Netguru", "Netguru S.A.", "https://www.netguru.com", "7773257346", "Poznań", "IT", CompanySize.SME, OPIEKUN_1, ["saas", "branding", "startup"], "Software house, projekty produktowe, fintech, healthtech."),
    _C("Espeo Software", "Espeo Software Sp. z o.o.", "https://espeo.eu", "7811890262", "Poznań", "IT", CompanySize.SME, OPIEKUN_2, ["saas", "blockchain", "fintech"], "Custom software, blockchain, fintech."),
    _C("Roche Poland IT", "Roche Polska Sp. z o.o.", "https://www.roche.pl", "1000004854", "Warszawa", "R&D", CompanySize.CORPORATION, OPIEKUN_1, ["medtech", "r_and_d", "global_corp", "data"], "Pharma IT, diagnostyka, dane medyczne."),
    _C("GSK Poznań", "GlaxoSmithKline Services Sp. z o.o.", "https://www.gsk.com/pl-pl", "7821025922", "Poznań", "R&D", CompanySize.CORPORATION, OPIEKUN_2, ["medtech", "r_and_d", "global_corp"], "Farma, IT operations, hub usług biznesowych."),
    _C("Vox Energy", "VOX Energy Sp. z o.o.", "https://voxenergy.pl", "7822844210", "Poznań", "Energy", CompanySize.SME, OPIEKUN_1, ["energy_tech", "iot", "startup"], "OZE, fotowoltaika, smart energy."),

    # --- Mniejsze software house i scale-upy ---
    _C("The Software House", "The Software House Sp. z o.o.", "https://tsh.io", "6342848710", "Gliwice", "IT", CompanySize.SME, OPIEKUN_2, ["saas", "startup", "mentoring"], "Software house Node.js/Python, product engineering."),
    _C("Iteo", "Iteo Sp. z o.o.", "https://iteo.com", "9542738945", "Katowice", "IT", CompanySize.SME, OPIEKUN_1, ["saas", "branding", "startup"], "Web, mobile, branding produktowy."),
    _C("Polidea", "Polidea Sp. z o.o.", "https://polidea.com", "5252507470", "Warszawa", "IT", CompanySize.SME, OPIEKUN_2, ["iot", "saas", "startup"], "IoT, mobile, embedded — często z hardware partners."),
    _C("RST Software", "RST Software Sp. z o.o.", "https://www.rst.software", "8951980140", "Wrocław", "IT", CompanySize.SME, OPIEKUN_1, ["saas", "enterprise", "data"], "Custom software, mobility, data products."),
    _C("Pragmatists", "Pragmatists Sp. z o.o.", "https://pragmatists.com", "5252510155", "Warszawa", "IT", CompanySize.SME, OPIEKUN_2, ["saas", "mentoring", "startup"], "Software house z naciskiem na craft i XP."),
    _C("Untitled Kingdom", "Untitled Kingdom Sp. z o.o.", "https://untitledkingdom.com", "7010368725", "Warszawa", "IT", CompanySize.SME, OPIEKUN_1, ["saas", "medtech", "startup"], "Healthtech, IoT, mobile."),
    _C("Visiona", "Visiona Sp. z o.o.", "https://visiona.co", "5252612988", "Warszawa", "IT", CompanySize.STARTUP, OPIEKUN_2, ["ai_ml", "data", "startup"], "Computer vision, retail analytics."),
    _C("DocPlanner Group", "DocPlanner Sp. z o.o.", "https://www.docplanner.com", "5252620634", "Warszawa", "IT", CompanySize.CORPORATION, OPIEKUN_1, ["saas", "medtech", "branding"], "Healthtech, marketplace, mobile/web."),
    _C("Booksy", "Booksy International S.A.", "https://booksy.com", "5252606081", "Warszawa", "IT", CompanySize.SME, OPIEKUN_2, ["saas", "ecommerce", "branding"], "SaaS dla branży beauty, mobile-first."),
    _C("Codewise", "Codewise Sp. z o.o.", "https://codewise.com", "6772345195", "Kraków", "IT", CompanySize.SME, OPIEKUN_1, ["saas", "data", "ai_ml"], "AdTech, optymalizacja kampanii, ML."),
    _C("Eleven Labs Poland", "Eleven Labs Sp. z o.o.", "https://elevenlabs.io", "5252969920", "Warszawa", "IT", CompanySize.STARTUP, OPIEKUN_2, ["ai_ml", "startup", "branding"], "Generative voice AI, TTS, badania nad mową."),
    _C("Synerise Labs", "Synerise Labs Sp. z o.o.", "https://synerise.com", "6762595218", "Kraków", "R&D", CompanySize.SME, OPIEKUN_1, ["ai_ml", "r_and_d", "data"], "Laboratorium R&D Synerise, badania ML."),

    # --- Cybersecurity / specjaliści ---
    _C("Securitum", "Securitum Sp. z o.o.", "https://www.securitum.pl", "9452132290", "Kraków", "Cybersecurity", CompanySize.SME, OPIEKUN_2, ["cybersecurity", "saas", "mentoring"], "Pentesting, audyty, szkolenia."),
    _C("CERT Polska / NASK", "Naukowa i Akademicka Sieć Komputerowa NASK PIB", "https://www.cert.pl", "5210417157", "Warszawa", "Cybersecurity", CompanySize.PUBLIC_INSTITUTION, OPIEKUN_1, ["cybersecurity", "r_and_d", "public_sector", "local"], "CERT krajowy, badania bezpieczeństwa, NASK."),
    _C("Trail of Bits PL", "Trail of Bits Poland Sp. z o.o.", "https://www.trailofbits.com", "5252908612", "Warszawa", "Cybersecurity", CompanySize.SME, OPIEKUN_2, ["cybersecurity", "r_and_d", "global_corp"], "Wysokopoziomowy security research, blockchain audits."),
    _C("Tenable Poland", "Tenable Network Security Poland Sp. z o.o.", "https://www.tenable.com", "5252735894", "Warszawa", "Cybersecurity", CompanySize.CORPORATION, OPIEKUN_1, ["cybersecurity", "saas", "global_corp"], "Vulnerability management, exposure management."),
    _C("F-Secure Polska", "F-Secure Poland Sp. z o.o.", "https://www.f-secure.com", "5252582187", "Warszawa", "Cybersecurity", CompanySize.SME, OPIEKUN_2, ["cybersecurity", "saas", "global_corp"], "Antywirus, security consumer i enterprise."),
    _C("Hyprr Security", "Hyprr Security Sp. z o.o.", "https://hyprr.io", "6762638901", "Kraków", "Cybersecurity", CompanySize.STARTUP, OPIEKUN_1, ["cybersecurity", "startup", "ai_ml"], "Startup AI-powered SOC, threat intel."),
    _C("SOC24", "SOC24 Sp. z o.o.", "https://soc24.pl", "9452194512", "Kraków", "Cybersecurity", CompanySize.SME, OPIEKUN_2, ["cybersecurity", "saas", "local"], "Managed SOC, monitoring 24/7."),

    # --- AI / Data ---
    _C("Deepsense.ai", "Deepsense.ai Sp. z o.o.", "https://deepsense.ai", "5252608835", "Warszawa", "IT", CompanySize.SME, OPIEKUN_1, ["ai_ml", "data", "r_and_d", "mentoring"], "Konsulting AI/ML, projekty enterprise, badania."),
    _C("DLabs.ai", "DLabs.ai Sp. z o.o.", "https://dlabs.ai", "7831781230", "Poznań", "IT", CompanySize.SME, OPIEKUN_2, ["ai_ml", "data", "startup"], "Machine learning konsulting i custom modeling."),
    _C("TidalScale Polska", "TidalScale Polska Sp. z o.o.", "https://tidalscale.io", "5252965441", "Warszawa", "R&D", CompanySize.STARTUP, OPIEKUN_1, ["r_and_d", "data", "startup"], "Hyperscale memory, badania nad architekturą."),
    _C("Tidio", "Tidio Sp. z o.o.", "https://www.tidio.com", "5862295984", "Szczecin", "IT", CompanySize.SME, OPIEKUN_2, ["saas", "ai_ml", "branding"], "Chatboty, customer support AI, SaaS B2B."),
    _C("Adobe Polska", "Adobe Systems Polska Sp. z o.o.", "https://www.adobe.com/pl", "5252412250", "Warszawa", "IT", CompanySize.CORPORATION, OPIEKUN_1, ["saas", "ai_ml", "global_corp", "branding"], "Creative Cloud, Experience Cloud, AI generatywne."),
    _C("SAS Institute Polska", "SAS Institute Sp. z o.o.", "https://www.sas.com/pl_pl", "5260307055", "Warszawa", "IT", CompanySize.CORPORATION, OPIEKUN_2, ["data", "ai_ml", "enterprise", "global_corp"], "Analytics, data science enterprise, decision intelligence."),
    _C("Talkie.ai", "Talkie.ai Sp. z o.o.", "https://talkie.ai", "5252794017", "Warszawa", "IT", CompanySize.STARTUP, OPIEKUN_1, ["ai_ml", "startup", "medtech"], "Voice AI dla healthcare i call centers."),
    _C("Edge AI Lab", "Edge AI Lab Sp. z o.o.", "https://edgeailab.pl", "6762812456", "Kraków", "R&D", CompanySize.STARTUP, OPIEKUN_2, ["ai_ml", "embedded", "r_and_d", "startup"], "AI on edge devices, MLOps dla IoT."),

    # --- Embedded / hardware ---
    _C("Siemens Polska", "Siemens Sp. z o.o.", "https://new.siemens.com/pl", "5260103840", "Warszawa", "R&D", CompanySize.CORPORATION, OPIEKUN_1, ["embedded", "r_and_d", "global_corp", "energy_tech"], "Automatyka, energetyka, IoT przemysłowy."),
    _C("Bosch Polska", "Robert Bosch Sp. z o.o.", "https://www.bosch.pl", "5260307550", "Warszawa", "R&D", CompanySize.CORPORATION, OPIEKUN_2, ["embedded", "r_and_d", "automotive_tech", "global_corp"], "Mobility solutions, IoT przemysłowy, R&D."),
    _C("Schaeffler Industrial", "Schaeffler Industrial Polska Sp. z o.o.", "https://www.schaeffler.pl", "6772344512", "Kraków", "R&D", CompanySize.CORPORATION, OPIEKUN_1, ["embedded", "r_and_d", "automotive_tech", "global_corp"], "Automotive components, R&D w Krakowie."),
    _C("Delphi Technologies", "Delphi Poland S.A.", "https://www.delphi.com", "8131114115", "Kraków", "Automotive", CompanySize.CORPORATION, OPIEKUN_2, ["embedded", "automotive_tech", "global_corp"], "Powertrain software, sterowniki."),
    _C("Solaris Bus & Coach", "Solaris Bus & Coach S.A.", "https://www.solarisbus.com", "7771741540", "Bolechowo", "Automotive", CompanySize.CORPORATION, OPIEKUN_1, ["embedded", "automotive_tech", "energy_tech", "local"], "Autobusy elektryczne, software EV."),
    _C("ZF Polska", "ZF Automotive Poland Sp. z o.o.", "https://www.zf.com", "9540108456", "Częstochowa", "Automotive", CompanySize.CORPORATION, OPIEKUN_2, ["embedded", "automotive_tech", "global_corp"], "ADAS, transmission control, embedded."),

    # --- Startupy ---
    _C("DocPlanner Tech", "DocPlanner Tech Sp. z o.o.", "https://www.docplanner.com", "5252620635", "Warszawa", "IT", CompanySize.SME, OPIEKUN_1, ["saas", "medtech", "startup"], "Engineering hub healthtech, marketplace."),
    _C("Packhelp", "Packhelp Sp. z o.o.", "https://packhelp.com", "5252701045", "Warszawa", "E-commerce", CompanySize.SME, OPIEKUN_2, ["saas", "ecommerce", "startup"], "Custom packaging marketplace, mass customization."),
    _C("Brand24", "Brand24 S.A.", "https://brand24.pl", "8961515719", "Wrocław", "IT", CompanySize.SME, OPIEKUN_1, ["saas", "data", "branding"], "Social media monitoring, ML."),
    _C("Livespace", "Livespace Sp. z o.o.", "https://livespace.io", "5252531055", "Warszawa", "IT", CompanySize.SME, OPIEKUN_2, ["saas", "startup", "mentoring"], "CRM B2B, SaaS dla zespołów sprzedaży."),
    _C("Survicate", "Survicate Sp. z o.o.", "https://survicate.com", "5252622099", "Warszawa", "IT", CompanySize.SME, OPIEKUN_1, ["saas", "data", "startup"], "Customer feedback, surveys SaaS."),
    _C("Zowie", "Zowie Sp. z o.o.", "https://getzowie.com", "5252805912", "Warszawa", "IT", CompanySize.STARTUP, OPIEKUN_2, ["saas", "ai_ml", "startup"], "AI customer service for e-commerce."),
    _C("Tylko", "Tylko Sp. z o.o.", "https://tylko.com", "5252622112", "Warszawa", "E-commerce", CompanySize.SME, OPIEKUN_1, ["saas", "ecommerce", "branding"], "Custom furniture, configurator 3D."),
    _C("Sundose", "Sundose Sp. z o.o.", "https://sundose.io", "5213837402", "Warszawa", "E-commerce", CompanySize.STARTUP, OPIEKUN_2, ["ecommerce", "medtech", "startup"], "Personalizowana suplementacja, D2C."),

    # --- Sektor publiczny / R&D ---
    _C("OPI PIB", "Ośrodek Przetwarzania Informacji PIB", "https://opi.org.pl", "5250009140", "Warszawa", "R&D", CompanySize.PUBLIC_INSTITUTION, OPIEKUN_1, ["r_and_d", "public_sector", "data", "local"], "Państwowy instytut naukowy, dane edukacji, AI."),
    _C("CBR", "Centrum Badań i Rozwoju Sp. z o.o.", "https://cbr-polska.pl", "9532625145", "Bydgoszcz", "R&D", CompanySize.SME, OPIEKUN_2, ["r_and_d", "public_sector"], "B+R kontraktowe, fundusze unijne."),
    _C("ŁUKASIEWICZ ITTI", "Sieć Badawcza Łukasiewicz - Instytut Logistyki i Magazynowania", "https://ilim.lukasiewicz.gov.pl", "7770020410", "Poznań", "R&D", CompanySize.PUBLIC_INSTITUTION, OPIEKUN_1, ["r_and_d", "public_sector", "data"], "Logistyka, łańcuchy dostaw, badania stosowane."),

    # --- Globalni ---
    _C("Oracle Polska", "Oracle Polska Sp. z o.o.", "https://www.oracle.com/pl", "5210088838", "Warszawa", "IT", CompanySize.CORPORATION, OPIEKUN_2, ["enterprise", "cloud", "global_corp"], "Bazy danych, ERP, cloud OCI."),
    _C("SAP Polska", "SAP Polska Sp. z o.o.", "https://www.sap.com/poland", "5260005604", "Warszawa", "IT", CompanySize.CORPORATION, OPIEKUN_1, ["enterprise", "cloud", "global_corp"], "ERP, S/4HANA, partnerstwa edukacyjne."),
    _C("Salesforce Poland", "Salesforce Polska Sp. z o.o.", "https://www.salesforce.com/pl", "5252918114", "Warszawa", "IT", CompanySize.CORPORATION, OPIEKUN_2, ["saas", "cloud", "global_corp"], "CRM, platforma chmurowa."),
    _C("Amazon Development Center Poland", "Amazon Development Center Poland Sp. z o.o.", "https://www.amazon.science", "5252754135", "Gdańsk", "IT", CompanySize.CORPORATION, OPIEKUN_1, ["cloud", "ai_ml", "enterprise", "global_corp"], "AWS, Alexa, badania ML — duży hub w Gdańsku."),
    _C("Roche Diagnostics IT", "Roche Diagnostics Polska Sp. z o.o.", "https://diagnostics.roche.com", "5223027388", "Warszawa", "R&D", CompanySize.CORPORATION, OPIEKUN_2, ["medtech", "r_and_d", "global_corp", "data"], "Diagnostyka, IT laboratoryjne."),
    _C("Pearson Central Europe", "Pearson Central Europe Sp. z o.o.", "https://www.pearson.com", "5252189670", "Warszawa", "IT", CompanySize.CORPORATION, OPIEKUN_1, ["saas", "global_corp", "branding"], "Edukacja, testy, content digital."),
    _C("Roche Polska", "Roche Polska Sp. z o.o.", "https://www.roche.pl", "1000004855", "Warszawa", "R&D", CompanySize.CORPORATION, OPIEKUN_2, ["medtech", "r_and_d", "global_corp"], "Farmaceutyka, IT operations, pharma analytics."),

    # --- Mniejsi gracze regionalni ---
    _C("Speednet", "Speednet Sp. z o.o.", "https://speednetsoftware.com", "5852244114", "Gdynia", "IT", CompanySize.SME, OPIEKUN_1, ["saas", "mobile", "mentoring"], "Mobile, healthcare, sports tech."),
    _C("ITMagination", "ITMagination Sp. z o.o.", "https://itmagination.com", "5252384753", "Warszawa", "IT", CompanySize.SME, OPIEKUN_2, ["data", "saas", "enterprise"], "Data engineering, BI, custom software."),
    _C("Cogniteam", "Cogniteam Sp. z o.o.", "https://cogniteam.pl", "6772398456", "Kraków", "IT", CompanySize.STARTUP, OPIEKUN_1, ["ai_ml", "embedded", "startup"], "Robotyka, ROS, vision."),
    _C("Akeneo Polska", "Akeneo Poland Sp. z o.o.", "https://www.akeneo.com", "6762529834", "Kraków", "IT", CompanySize.SME, OPIEKUN_2, ["saas", "ecommerce", "global_corp"], "PIM (product information management), open source."),
]


CONTACT_OVERRIDES: dict[str, list[tuple[str, str, str]]] = {
    "Comarch": [("Agnieszka", "Maj", "University Relations Manager"), ("Piotr", "Kania", "Head of Employer Branding")],
    "Akamai Technologies": [("Marta", "Sroka", "Talent Acquisition Lead"), ("Krzysztof", "Wrona", "Engineering Manager")],
    "Nokia Kraków": [("Joanna", "Bąk", "University Program Coordinator"), ("Łukasz", "Filipek", "Software Engineering Manager")],
    "Motorola Solutions": [("Karolina", "Urban", "CSR Coordinator"), ("Tomasz", "Wilk", "Security Engineering Lead")],
    "Aptiv": [("Paulina", "Cieślak", "Talent Partner"), ("Adam", "Baran", "Embedded Systems Lead")],
    "Allegro": [("Natalia", "Krupa", "Employer Branding Specialist"), ("Michał", "Lis", "Platform Engineering Manager")],
    "Brainly": [("Ewa", "Mazur", "People Partner"), ("Filip", "Kozioł", "AI Product Lead")],
    "Synerise": [("Monika", "Sikora", "Partnership Manager"), ("Bartosz", "Kurek", "Machine Learning Lead")],
    "Cisco Systems Poland": [("Anna", "Gajewska", "University Relations EMEA"), ("Wojciech", "Pawlak", "Technical Lead Networking")],
    "Sabre Polska": [("Beata", "Janik", "Talent Programs Manager"), ("Marcin", "Sosnowski", "Director of Engineering")],
    "ABB Corporate Technology Center": [("Iwona", "Pieczonka", "R&D Partnerships"), ("Andrzej", "Lis", "Senior Principal Engineer")],
    "IBM Polska": [("Magdalena", "Górska", "University Programs Lead"), ("Dariusz", "Wójcik", "Cloud Solutions Architect")],
    "Capgemini Polska": [("Aleksandra", "Marcinkowska", "Talent Lead"), ("Robert", "Dudek", "Solution Architect")],
    "Ericsson Polska": [("Karolina", "Witek", "University Outreach"), ("Jakub", "Kwiatkowski", "5G R&D Manager")],
    "Google Poland": [("Zuzanna", "Walczak", "University Programs"), ("Mateusz", "Borowski", "Engineering Manager Cloud")],
    "Microsoft Polska": [("Klaudia", "Pawłowska", "Academic Engagement"), ("Sebastian", "Adamski", "Cloud Solution Architect")],
    "Samsung R&D Polska": [("Hanna", "Bochenek", "University Liaison"), ("Patryk", "Roman", "Senior ML Researcher")],
    "Meta Poland": [("Olga", "Wilkowska", "University Engagement EMEA"), ("Krystian", "Skowron", "Engineering Manager")],
    "Atlassian Poland": [("Dominika", "Rudnicka", "Talent Programs Lead"), ("Bartłomiej", "Tatar", "Principal Engineer")],
    "Google Poland": [("Zuzanna", "Walczak", "University Programs"), ("Mateusz", "Borowski", "Engineering Manager Cloud")],
    "Amazon Development Center Poland": [("Klara", "Surdacka", "Campus Recruiting"), ("Dawid", "Smolarek", "Principal Engineer")],
    "Allegro": [("Natalia", "Krupa", "Employer Branding Specialist"), ("Michał", "Lis", "Platform Engineering Manager")],
    "CD Projekt RED": [("Justyna", "Olszewska", "University Outreach"), ("Marek", "Czerwiński", "Lead Engine Programmer")],
    "Goldman Sachs Poland": [("Aleksandra", "Bogusławska", "Campus Recruiting EMEA"), ("Konrad", "Polak", "VP Engineering")],
    "HSBC Service Delivery Polska": [("Justyna", "Mróz", "Talent Acquisition"), ("Filip", "Banaś", "Tech Manager")],
    "UBS Kraków": [("Maja", "Zielonka", "Campus Hiring"), ("Adrian", "Janiec", "Engineering Lead")],
    "Eleven Labs Poland": [("Alicja", "Stachura", "People Lead"), ("Jakub", "Łopatka", "Voice Research Lead")],
}


# --- Deterministic contact fallback ---

FIRST_NAMES_F = [
    "Anna", "Magdalena", "Katarzyna", "Joanna", "Aleksandra", "Karolina", "Natalia",
    "Ewa", "Marta", "Monika", "Agnieszka", "Beata", "Iwona", "Zuzanna", "Justyna",
    "Patrycja", "Sylwia", "Wioleta", "Małgorzata", "Renata",
]
FIRST_NAMES_M = [
    "Marcin", "Tomasz", "Piotr", "Paweł", "Łukasz", "Krzysztof", "Adam",
    "Michał", "Maciej", "Jakub", "Mateusz", "Bartosz", "Wojciech", "Robert",
    "Sebastian", "Dawid", "Kamil", "Rafał", "Grzegorz", "Daniel",
]
LAST_NAMES = [
    "Nowak", "Kowalski", "Wójcik", "Kowalczyk", "Kamiński", "Lewandowski",
    "Zieliński", "Szymański", "Woźniak", "Dąbrowski", "Kozłowski", "Jankowski",
    "Mazur", "Krawczyk", "Piotrowski", "Grabowski", "Pawłowski", "Michalski",
    "Adamczyk", "Nowicki", "Kaczmarek", "Wieczorek", "Stępień", "Sikora",
    "Baran", "Duda",
]
POSITIONS = [
    "University Relations Manager",
    "Talent Acquisition Lead",
    "Employer Branding Specialist",
    "Engineering Manager",
    "Technical Recruiter",
    "Head of People",
    "CSR Coordinator",
    "Partnership Manager",
    "Head of Engineering",
    "Recruitment Partner",
    "Talent Programs Manager",
    "Director of Engineering",
    "Lead Software Engineer",
    "Product Manager",
    "VP of Engineering",
    "Head of Talent",
    "Community Manager",
    "Developer Relations Lead",
    "Senior People Partner",
    "Engineering Director",
]


def _slug(text: str) -> str:
    table = str.maketrans({
        "ą": "a", "ć": "c", "ę": "e", "ł": "l", "ń": "n", "ó": "o",
        "ś": "s", "ż": "z", "ź": "z",
    })
    return text.lower().translate(table).replace(" ", "").replace(".", "").replace(",", "").replace("/", "")


def _generated_contacts(company_name: str) -> list[tuple[str, str, str]]:
    """Stable deterministic fallback contacts derived from company name."""
    h = sum(ord(c) for c in company_name)
    first_a = FIRST_NAMES_F[h % len(FIRST_NAMES_F)]
    last_a = LAST_NAMES[(h * 3 + 1) % len(LAST_NAMES)]
    pos_a = POSITIONS[(h * 7) % len(POSITIONS)]
    first_b = FIRST_NAMES_M[(h * 5 + 2) % len(FIRST_NAMES_M)]
    last_b = LAST_NAMES[(h * 11 + 7) % len(LAST_NAMES)]
    pos_b = POSITIONS[(h * 13 + 3) % len(POSITIONS)]
    return [(first_a, last_a, pos_a), (first_b, last_b, pos_b)]


# --- Events ---

EVENTS: list[dict] = [
    # Historyczne (CLOSED)
    {"name": "SFI 2024", "description": "Studencki Festiwal Informatyczny AGH: AI, cloud, cybersec, inżynieria oprogramowania.", "start_date": date(2024, 3, 21), "end_date": date(2024, 3, 23), "target_budget": Decimal("120000.00"), "target_partners_count": 10, "status": EventStatus.CLOSED, "owner": KOORD_1, "tags": ["technology", "sponsor", "workshop"]},
    {"name": "AGH IT Career Fair 2024", "description": "Targi pracy i praktyk dla studentów informatyki, cyberbezpieczeństwa i data science.", "start_date": date(2024, 10, 16), "end_date": date(2024, 10, 17), "target_budget": Decimal("180000.00"), "target_partners_count": 16, "status": EventStatus.CLOSED, "owner": KOORD_1, "tags": ["recruitment", "branding", "sponsor"]},
    {"name": "CyberSec AGH Lab 2025", "description": "Warsztaty z security engineering, cloud hardening i incident response.", "start_date": date(2025, 2, 13), "end_date": date(2025, 2, 14), "target_budget": Decimal("85000.00"), "target_partners_count": 8, "status": EventStatus.CLOSED, "owner": KOORD_2, "tags": ["cybersecurity", "workshop", "sponsor"]},
    {"name": "SFI 2025", "description": "Studencki Festiwal Informatyczny AGH, edycja 2025: AI, platform engineering, security.", "start_date": date(2025, 3, 20), "end_date": date(2025, 3, 22), "target_budget": Decimal("140000.00"), "target_partners_count": 12, "status": EventStatus.CLOSED, "owner": KOORD_1, "tags": ["technology", "sponsor", "workshop"]},
    {"name": "KrakHack 2025", "description": "Hackathon Wydziału Informatyki AGH wokół AI agents, cybersecurity i danych miejskich.", "start_date": date(2025, 5, 17), "end_date": date(2025, 5, 18), "target_budget": Decimal("85000.00"), "target_partners_count": 8, "status": EventStatus.CLOSED, "owner": KOORD_2, "tags": ["hackathon", "ai_ml", "sponsor"]},
    {"name": "AGH IT Career Fair 2025", "description": "Targi pracy i praktyk dla studentów informatyki — edycja 2025.", "start_date": date(2025, 10, 14), "end_date": date(2025, 10, 15), "target_budget": Decimal("210000.00"), "target_partners_count": 18, "status": EventStatus.CLOSED, "owner": KOORD_1, "tags": ["recruitment", "branding", "sponsor"]},
    {"name": "CyberSec AGH Lab 2026", "description": "Warsztaty cybersec — edycja 2026: cloud hardening, threat hunting, IR.", "start_date": date(2026, 2, 12), "end_date": date(2026, 2, 13), "target_budget": Decimal("95000.00"), "target_partners_count": 8, "status": EventStatus.CLOSED, "owner": KOORD_2, "tags": ["cybersecurity", "workshop", "sponsor"]},
    {"name": "SFI 2026", "description": "Studencki Festiwal Informatyczny AGH 2026: AI agents, distributed systems, robotics.", "start_date": date(2026, 3, 19), "end_date": date(2026, 3, 21), "target_budget": Decimal("160000.00"), "target_partners_count": 14, "status": EventStatus.CLOSED, "owner": KOORD_1, "tags": ["technology", "sponsor", "workshop"]},

    # Aktywne (w toku)
    {"name": "KrakHack 2026", "description": "Hackathon AGH 2026 — AI agents, MLOps, automotive software.", "start_date": date(2026, 7, 11), "end_date": date(2026, 7, 12), "target_budget": Decimal("110000.00"), "target_partners_count": 10, "status": EventStatus.ACTIVE, "owner": KOORD_2, "tags": ["hackathon", "ai_ml", "sponsor"]},
    {"name": "AGH IT Career Fair 2026", "description": "Targi pracy 2026: rekrutacja IT, cybersec, data, embedded.", "start_date": date(2026, 10, 13), "end_date": date(2026, 10, 14), "target_budget": Decimal("240000.00"), "target_partners_count": 20, "status": EventStatus.ACTIVE, "owner": KOORD_1, "tags": ["recruitment", "branding", "sponsor"]},

    # W planach (DRAFT)
    {"name": "CyberSec AGH Lab 2027", "description": "Cykl warsztatów 2027: AI security, supply chain, quantum-safe crypto.", "start_date": date(2027, 2, 11), "end_date": date(2027, 2, 12), "target_budget": Decimal("105000.00"), "target_partners_count": 9, "status": EventStatus.DRAFT, "owner": KOORD_2, "tags": ["cybersecurity", "workshop", "sponsor"]},
    {"name": "SFI 2027", "description": "Studencki Festiwal Informatyczny AGH 2027 — wczesny etap planowania.", "start_date": date(2027, 3, 18), "end_date": date(2027, 3, 20), "target_budget": Decimal("170000.00"), "target_partners_count": 15, "status": EventStatus.DRAFT, "owner": KOORD_1, "tags": ["technology", "sponsor", "workshop"]},
    {"name": "AGH AI Summit 2028", "description": "Pierwsza edycja konferencji AI Wydziału Informatyki AGH — agendy AI agents, foundation models, MLOps.", "start_date": date(2028, 4, 25), "end_date": date(2028, 4, 27), "target_budget": Decimal("260000.00"), "target_partners_count": 18, "status": EventStatus.DRAFT, "owner": KOORD_1, "tags": ["ai_ml", "technology", "sponsor"]},
]


# --- Pipeline plan helpers ---

# Each entry: (company_name, stage_name, rel_type, expected, agreed_or_None, first_offset, offer_offset_or_None, closed_offset_or_None)
# Offsets are in days relative to the event's start_date.

def _won(company: str, rel_type: str, amount: int, *, first: int = -120, offer: int = -75, closed: int = -35) -> tuple:
    return (company, "Decyzja: TAK", rel_type, amount, amount, first, offer, closed)

def _lost(company: str, rel_type: str, expected: int, *, first: int = -100, offer: int = -60, closed: int = -25) -> tuple:
    return (company, "Odrzucony", rel_type, expected, None, first, offer, closed)

def _neg(company: str, rel_type: str, expected: int, *, first: int = -55, offer: int = -32) -> tuple:
    return (company, "Negocjacje", rel_type, expected, None, first, offer, None)

def _offer(company: str, rel_type: str, expected: int, *, first: int = -45, offer: int = -20) -> tuple:
    return (company, "Oferta wysłana", rel_type, expected, None, first, offer, None)

def _interest(company: str, rel_type: str, expected: int, *, first: int = -30) -> tuple:
    return (company, "Zainteresowany", rel_type, expected, None, first, None, None)

def _contact(company: str, rel_type: str, expected: int, *, first: int = -20) -> tuple:
    return (company, "Kontakt", rel_type, expected, None, first, None, None)


PIPELINE_PLAN: dict[str, list[tuple]] = {
    "SFI 2024": [
        _won("Comarch", "sponsor", 18000, first=-150, offer=-110, closed=-65),
        _won("Akamai Technologies", "partner", 12000, first=-140, offer=-100, closed=-55),
        _won("Nokia Kraków", "recruitment", 10000, first=-135, offer=-95, closed=-50),
        _won("Motorola Solutions", "sponsor", 12000, first=-130, offer=-90, closed=-45),
        _won("Brainly", "partner", 8000, first=-125, offer=-80, closed=-40),
        _won("Cisco Systems Poland", "partner", 14000, first=-120, offer=-75, closed=-35),
        _lost("Aptiv", "partner", 12000, first=-100, offer=-65, closed=-28),
        _lost("ABB Corporate Technology Center", "r_and_d", 20000, first=-95, offer=-60, closed=-22),
        _lost("Allegro", "recruitment", 18000, first=-90, offer=-55, closed=-15),
        _lost("Synerise", "partner", 9000, first=-85, offer=-50, closed=-12),
    ],
    "AGH IT Career Fair 2024": [
        _won("Allegro", "recruitment", 32000, first=-160, offer=-120, closed=-80),
        _won("Nokia Kraków", "recruitment", 24000, first=-155, offer=-115, closed=-75),
        _won("Sabre Polska", "recruitment", 20000, first=-150, offer=-110, closed=-70),
        _won("Cisco Systems Poland", "recruitment", 22000, first=-145, offer=-105, closed=-65),
        _won("Motorola Solutions", "recruitment", 18000, first=-140, offer=-100, closed=-60),
        _won("Aptiv", "recruitment", 17000, first=-135, offer=-95, closed=-55),
        _won("Capgemini Polska", "recruitment", 16000, first=-130, offer=-90, closed=-50),
        _won("HSBC Service Delivery Polska", "recruitment", 18000, first=-125, offer=-85, closed=-45),
        _won("IBM Polska", "recruitment", 22000, first=-120, offer=-80, closed=-40),
        _won("Sii Polska", "recruitment", 14000, first=-115, offer=-75, closed=-38),
        _lost("Goldman Sachs Poland", "recruitment", 28000, first=-110, offer=-70, closed=-30),
        _lost("UBS Kraków", "recruitment", 22000, first=-105, offer=-65, closed=-25),
        _lost("Revolut Technology Poland", "recruitment", 24000, first=-100, offer=-60, closed=-20),
        _lost("State Street", "recruitment", 16000, first=-95, offer=-55, closed=-15),
    ],
    "CyberSec AGH Lab 2025": [
        _won("Akamai Technologies", "sponsor", 15000, first=-110, offer=-70, closed=-30),
        _won("Cisco Systems Poland", "partner", 14000, first=-105, offer=-65, closed=-28),
        _won("Motorola Solutions", "partner", 12000, first=-100, offer=-60, closed=-25),
        _won("Tenable Poland", "sponsor", 10000, first=-95, offer=-55, closed=-22),
        _won("Securitum", "partner", 7000, first=-90, offer=-50, closed=-18),
        _lost("F-Secure Polska", "sponsor", 9000, first=-85, offer=-45, closed=-14),
        _lost("Trail of Bits PL", "r_and_d", 15000, first=-80, offer=-40, closed=-10),
        _lost("CERT Polska / NASK", "r_and_d", 12000, first=-75, offer=-35, closed=-8),
    ],
    "SFI 2025": [
        _won("Comarch", "sponsor", 20000, first=-180, offer=-120, closed=-70),
        _won("Allegro", "partner", 16000, first=-170, offer=-110, closed=-60),
        _won("Brainly", "partner", 9000, first=-160, offer=-100, closed=-55),
        _won("Synerise", "partner", 11000, first=-155, offer=-95, closed=-50),
        _won("Software Mansion", "workshop" if False else "partner", 8000, first=-150, offer=-90, closed=-45),
        _won("Akamai Technologies", "partner", 13000, first=-145, offer=-85, closed=-40),
        _won("Google Poland", "partner", 25000, first=-140, offer=-80, closed=-35),
        _won("IBM Polska", "partner", 18000, first=-135, offer=-75, closed=-30),
        _lost("Microsoft Polska", "partner", 20000, first=-130, offer=-70, closed=-25),
        _lost("Sabre Polska", "recruitment", 15000, first=-120, offer=-60, closed=-18),
        _lost("Aptiv", "partner", 11000, first=-115, offer=-55, closed=-12),
    ],
    "KrakHack 2025": [
        _won("Brainly", "sponsor", 15000, first=-110, offer=-75, closed=-30),
        _won("Synerise", "partner", 18000, first=-105, offer=-70, closed=-28),
        _won("Software Mansion", "partner", 12000, first=-100, offer=-65, closed=-25),
        _won("Grape Up", "sponsor", 10000, first=-95, offer=-60, closed=-22),
        _won("Akamai Technologies", "partner", 18000, first=-90, offer=-55, closed=-18),
        _won("CD Projekt RED", "partner", 14000, first=-85, offer=-50, closed=-15),
        _lost("S-Labs", "partner", 6000, first=-70, offer=-40, closed=-10),
        _lost("Comarch", "sponsor", 25000, first=-100, offer=-65, closed=-20),
        _lost("CloudFerro", "r_and_d", 14000, first=-75, offer=-35, closed=-8),
        _lost("Deepsense.ai", "partner", 12000, first=-72, offer=-32, closed=-6),
    ],
    "AGH IT Career Fair 2025": [
        _won("Allegro", "recruitment", 38000, first=-180, offer=-140, closed=-90),
        _won("Nokia Kraków", "recruitment", 30000, first=-175, offer=-135, closed=-85),
        _won("Sabre Polska", "recruitment", 24000, first=-170, offer=-130, closed=-80),
        _won("Motorola Solutions", "recruitment", 25000, first=-165, offer=-125, closed=-75),
        _won("Aptiv", "recruitment", 20000, first=-160, offer=-120, closed=-70),
        _won("Ailleron", "recruitment", 13000, first=-155, offer=-115, closed=-65),
        _won("Cisco Systems Poland", "recruitment", 24000, first=-150, offer=-110, closed=-60),
        _won("HSBC Service Delivery Polska", "recruitment", 22000, first=-145, offer=-105, closed=-55),
        _won("UBS Kraków", "recruitment", 26000, first=-140, offer=-100, closed=-50),
        _won("Goldman Sachs Poland", "recruitment", 32000, first=-135, offer=-95, closed=-45),
        _won("IBM Polska", "recruitment", 22000, first=-130, offer=-90, closed=-40),
        _won("Capgemini Polska", "recruitment", 18000, first=-125, offer=-85, closed=-38),
        _lost("Microsoft Polska", "recruitment", 24000, first=-120, offer=-80, closed=-32),
        _lost("Google Poland", "recruitment", 28000, first=-115, offer=-75, closed=-28),
        _lost("Revolut Technology Poland", "recruitment", 22000, first=-110, offer=-70, closed=-22),
        _lost("Atlassian Poland", "recruitment", 18000, first=-105, offer=-65, closed=-18),
    ],
    "CyberSec AGH Lab 2026": [
        _won("Akamai Technologies", "partner", 18000, first=-105, offer=-70, closed=-30),
        _won("Cisco Systems Poland", "sponsor", 15000, first=-100, offer=-65, closed=-28),
        _won("Motorola Solutions", "partner", 14000, first=-95, offer=-60, closed=-25),
        _won("Securitum", "partner", 9000, first=-90, offer=-55, closed=-22),
        _won("Tenable Poland", "sponsor", 12000, first=-85, offer=-50, closed=-18),
        _won("Hyprr Security", "partner", 6000, first=-80, offer=-45, closed=-14),
        _lost("F-Secure Polska", "sponsor", 11000, first=-75, offer=-40, closed=-10),
        _lost("Trail of Bits PL", "r_and_d", 18000, first=-70, offer=-35, closed=-7),
        _lost("CERT Polska / NASK", "r_and_d", 15000, first=-65, offer=-30, closed=-5),
    ],
    "SFI 2026": [
        _won("Comarch", "sponsor", 22000, first=-180, offer=-130, closed=-75),
        _won("Allegro", "partner", 18000, first=-170, offer=-120, closed=-65),
        _won("Google Poland", "partner", 28000, first=-165, offer=-115, closed=-60),
        _won("IBM Polska", "partner", 20000, first=-160, offer=-110, closed=-55),
        _won("Brainly", "partner", 10000, first=-155, offer=-105, closed=-50),
        _won("Synerise", "partner", 12000, first=-150, offer=-100, closed=-45),
        _won("Akamai Technologies", "partner", 15000, first=-145, offer=-95, closed=-40),
        _won("Software Mansion", "partner", 9000, first=-140, offer=-90, closed=-35),
        _won("Samsung R&D Polska", "r_and_d", 22000, first=-135, offer=-85, closed=-30),
        _won("CD Projekt RED", "partner", 16000, first=-130, offer=-80, closed=-28),
        _lost("Microsoft Polska", "partner", 24000, first=-125, offer=-75, closed=-22),
        _lost("Meta Poland", "partner", 22000, first=-120, offer=-70, closed=-18),
        _lost("Adobe Polska", "partner", 14000, first=-110, offer=-60, closed=-12),
        _lost("Eleven Labs Poland", "partner", 8000, first=-100, offer=-55, closed=-8),
    ],

    # ACTIVE: KrakHack 2026 (event start 2026-07-11, today 2026-05-21 => offset -51 = today)
    "KrakHack 2026": [
        _won("Brainly", "sponsor", 18000, first=-180, offer=-130, closed=-90),
        _won("Synerise", "partner", 20000, first=-175, offer=-125, closed=-85),
        _won("Google Poland", "partner", 30000, first=-170, offer=-120, closed=-80),
        _won("Akamai Technologies", "partner", 18000, first=-160, offer=-110, closed=-70),
        _neg("Software Mansion", "partner", 14000, first=-90, offer=-55),
        _neg("Eleven Labs Poland", "partner", 10000, first=-85, offer=-52),
        _neg("Edge AI Lab", "r_and_d", 7000, first=-80, offer=-58),
        _offer("Grape Up", "sponsor", 12000, first=-70, offer=-30),
        _offer("Codete", "partner", 9000, first=-65, offer=-28),
        _offer("Deepsense.ai", "partner", 14000, first=-60, offer=-25),
        _offer("Talkie.ai", "partner", 8000, first=-58, offer=-22),
        _interest("CD Projekt RED", "partner", 16000, first=-50),
        _interest("Cogniteam", "r_and_d", 5000, first=-48),
        _contact("Tidio", "partner", 7000, first=-30),
        _contact("Zowie", "partner", 6000, first=-25),
        _contact("Visiona", "partner", 5500, first=-20),
        _lost("S-Labs", "partner", 7000, first=-95, offer=-65, closed=-40),
        _lost("DLabs.ai", "partner", 9000, first=-92, offer=-60, closed=-35),
    ],

    # ACTIVE: AGH IT Career Fair 2026 (start 2026-10-13, today 2026-05-21 => offset -145)
    "AGH IT Career Fair 2026": [
        _won("Allegro", "recruitment", 42000, first=-220, offer=-180, closed=-160),
        _won("Nokia Kraków", "recruitment", 32000, first=-215, offer=-175, closed=-155),
        _won("Goldman Sachs Poland", "recruitment", 36000, first=-210, offer=-170, closed=-150),
        _won("Capgemini Polska", "recruitment", 22000, first=-200, offer=-160, closed=-148),
        _neg("HSBC Service Delivery Polska", "recruitment", 26000, first=-180, offer=-150),
        _neg("UBS Kraków", "recruitment", 28000, first=-175, offer=-148),
        _neg("Atlassian Poland", "recruitment", 22000, first=-170, offer=-146),
        _neg("Amazon Development Center Poland", "recruitment", 30000, first=-168, offer=-144),
        _offer("Sabre Polska", "recruitment", 24000, first=-160, offer=-148),
        _offer("Motorola Solutions", "recruitment", 26000, first=-158, offer=-147),
        _offer("Aptiv", "recruitment", 20000, first=-156, offer=-146),
        _offer("Cisco Systems Poland", "recruitment", 24000, first=-155, offer=-145),
        _offer("Microsoft Polska", "recruitment", 28000, first=-152, offer=-148),
        _offer("Revolut Technology Poland", "recruitment", 22000, first=-150, offer=-147),
        _interest("Citi Service Center Poland", "recruitment", 24000, first=-145),
        _interest("JPMorgan Chase Poland", "recruitment", 26000, first=-145),
        _interest("State Street", "recruitment", 18000, first=-143),
        _interest("IBM Polska", "recruitment", 22000, first=-140),
        _interest("Sii Polska", "recruitment", 16000, first=-138),
        _contact("Google Poland", "recruitment", 28000, first=-100),
        _contact("Meta Poland", "recruitment", 22000, first=-90),
        _contact("Spyrosoft", "recruitment", 12000, first=-50),
        _contact("Intive", "recruitment", 11000, first=-45),
        _lost("Lufthansa Systems Poland", "recruitment", 16000, first=-200, offer=-160, closed=-140),
        _lost("Roche Polska", "recruitment", 14000, first=-180, offer=-150, closed=-130),
    ],

    # DRAFT: CyberSec AGH Lab 2027 (start 2027-02-11, today 2026-05-21 => offset -266)
    "CyberSec AGH Lab 2027": [
        _interest("Akamai Technologies", "partner", 20000, first=-180),
        _interest("Cisco Systems Poland", "sponsor", 16000, first=-175),
        _interest("Motorola Solutions", "partner", 14000, first=-170),
        _contact("Tenable Poland", "sponsor", 13000, first=-90),
        _contact("Securitum", "partner", 9000, first=-85),
        _contact("Trail of Bits PL", "r_and_d", 16000, first=-80),
        _contact("Hyprr Security", "partner", 7000, first=-60),
        _contact("SOC24", "partner", 6000, first=-55),
        _contact("CERT Polska / NASK", "r_and_d", 14000, first=-50),
    ],

    # DRAFT: SFI 2027 (start 2027-03-18, today => offset -301)
    "SFI 2027": [
        _interest("Comarch", "sponsor", 24000, first=-220),
        _interest("Allegro", "partner", 19000, first=-200),
        _interest("Google Poland", "partner", 30000, first=-195),
        _interest("Brainly", "partner", 11000, first=-180),
        _interest("Synerise", "partner", 13000, first=-175),
        _contact("Software Mansion", "partner", 10000, first=-90),
        _contact("Akamai Technologies", "partner", 16000, first=-85),
        _contact("CD Projekt RED", "partner", 17000, first=-75),
        _contact("Samsung R&D Polska", "r_and_d", 24000, first=-70),
        _contact("Microsoft Polska", "partner", 25000, first=-60),
        _contact("IBM Polska", "partner", 22000, first=-55),
        _contact("Eleven Labs Poland", "partner", 9000, first=-50),
    ],

    # DRAFT: AGH AI Summit 2028 (start 2028-04-25, today => offset -704)
    "AGH AI Summit 2028": [
        _interest("Google Poland", "partner", 35000, first=-280),
        _interest("Samsung R&D Polska", "partner", 28000, first=-260),
        _interest("Meta Poland", "partner", 26000, first=-240),
        _contact("Synerise", "partner", 14000, first=-150),
        _contact("Brainly", "partner", 12000, first=-145),
        _contact("Eleven Labs Poland", "partner", 11000, first=-140),
        _contact("Deepsense.ai", "partner", 12000, first=-135),
        _contact("Talkie.ai", "partner", 8000, first=-130),
        _contact("Edge AI Lab", "r_and_d", 9000, first=-120),
        _contact("Microsoft Polska", "partner", 30000, first=-100),
        _contact("IBM Polska", "partner", 24000, first=-90),
        _contact("DLabs.ai", "partner", 10000, first=-80),
    ],
}


# --- Helpers ---

def _by_name(session: Session, model, names: list[str]):
    return {row.name: row for row in session.scalars(select(model).where(model.name.in_(names))).all()}


def _ensure_extra_tags(session: Session) -> None:
    for name, category in EXTRA_TAGS:
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
    for company in companies.values():
        contacts = CONTACT_OVERRIDES.get(company.name) or _generated_contacts(company.name)
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
    base = event.start_date or TODAY
    return datetime.combine(base, datetime.min.time()) + timedelta(days=offset_days)


TODAY_DT = datetime.combine(TODAY, datetime.min.time())


def _clamp_entry_dates(entry: PipelineEntry) -> None:
    """Przesuwa daty wpisu lejka tak, by żadna nie była po TODAY.

    Zachowuje odstępy między first_contact_at, offer_sent_at, closed_at oraz
    dodaje deterministyczny jitter (0-29 dni), żeby wpisy nie kumulowały się
    w jednym dniu. Bez tego wszystkie 'Kontakt' z 2027/2028 wskazywałyby
    na ten sam dzień (TODAY-1).
    """
    non_null = [d for d in (entry.first_contact_at, entry.offer_sent_at, entry.closed_at) if d]
    if not non_null:
        return
    max_dt = max(non_null)
    if max_dt <= TODAY_DT:
        return
    jitter = (entry.company_id * 7 + entry.event_id * 3) % 30
    target = TODAY_DT - timedelta(days=1 + jitter)
    delta = max_dt - target
    if entry.first_contact_at:
        entry.first_contact_at -= delta
    if entry.offer_sent_at:
        entry.offer_sent_at -= delta
    if entry.closed_at:
        entry.closed_at -= delta


def _clamp_past(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt > TODAY_DT:
        return TODAY_DT - timedelta(days=1)
    return dt


def _upsert_pipeline(
    session: Session,
    events: dict[str, Event],
    companies: dict[str, Company],
    users: dict[str, User],
) -> list[PipelineEntry]:
    stages = {stage.name: stage for stage in session.scalars(select(PipelineStage)).all()}
    opiekun_emails = [OPIEKUN_1, OPIEKUN_2]
    entries: list[PipelineEntry] = []

    for event_name, rows in PIPELINE_PLAN.items():
        event = events[event_name]
        for idx, row in enumerate(rows):
            company_name, stage_name, rel_type, expected, agreed, first_offset, offer_offset, closed_offset = row
            company = companies.get(company_name)
            if company is None:
                # Defensywnie: pomiń wpisy, których firma nie istnieje (np. literówka w planie).
                print(f"WARN: skipping pipeline entry — company '{company_name}' not in COMPANIES")
                continue
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
            stage = stages[stage_name]
            entry.stage_id = stage.id
            entry.owner_user_id = owner.id
            entry.contact_person_id = contact.id if contact else None
            entry.expected_amount = Decimal(str(expected))
            entry.agreed_amount = Decimal(str(agreed)) if agreed is not None else None
            entry.first_contact_at = _date_from_event(event, first_offset)
            entry.offer_sent_at = _date_from_event(event, offer_offset)
            entry.closed_at = _date_from_event(event, closed_offset)
            _clamp_entry_dates(entry)
            entry.rejection_reason = (
                "Budżet przeniesiony na kolejny rok / brak dopasowania pakietu"
                if stage.outcome.value == "lost" else None
            )
            entry.notes = f"Profil: {rel_type}; dobrany do tematyki wydarzenia {event.name}."
            entries.append(entry)
    session.flush()
    return entries


def _upsert_relationships(session: Session, entries: list[PipelineEntry]) -> None:
    rel_types = {row.name: row for row in session.scalars(select(RelationshipType)).all()}
    tags = {row.name: row for row in session.scalars(select(Tag)).all()}
    stages = {row.id: row for row in session.scalars(select(PipelineStage)).all()}
    today_dt = datetime.combine(TODAY, datetime.min.time())

    for entry in entries:
        stage = stages[entry.stage_id]
        if stage.outcome.value != "won":
            continue
        rel_name = "sponsor"
        if entry.notes and "recruitment" in entry.notes:
            rel_name = "recruitment"
        elif entry.notes and "r_and_d" in entry.notes:
            rel_name = "r_and_d"
        elif entry.notes and "partner" in entry.notes:
            rel_name = "partner"

        relationship = session.scalar(
            select(CompanyRelationship).where(CompanyRelationship.pipeline_entry_id == entry.id)
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

        # ACTIVE jeśli event jeszcze się nie zakończył, COMPLETED jeśli się zakończył.
        event_end = entry.event.end_date if entry.event else None
        if event_end and event_end < TODAY:
            relationship.status = RelationshipStatus.COMPLETED
        else:
            relationship.status = RelationshipStatus.ACTIVE

        relationship.package_name = {
            "sponsor": "Pakiet Sponsor",
            "partner": "Pakiet Partner Merytoryczny",
            "recruitment": "Pakiet Rekrutacyjny",
            "r_and_d": "Pakiet R&D",
        }.get(rel_name, "Pakiet Partner")
        relationship.notes = "Relacja utworzona z wygranego wpisu pipeline (demo)."
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
    today_dt = datetime.combine(TODAY, datetime.min.time()).replace(hour=9)
    assignee_cycle = [users[OPIEKUN_1], users[OPIEKUN_2]]

    for idx, entry in enumerate(entries):
        stage = stages[entry.stage_id]
        company_name = entry.company.name if entry.company else f"firma #{entry.company_id}"
        seed_rows: list[tuple[ActivityType, str, str, datetime | None, datetime | None, bool]] = []

        # Intro e-mail (pierwszy kontakt)
        if entry.first_contact_at:
            seed_rows.append((
                ActivityType.EMAIL,
                f"Wysłano intro do {company_name}",
                "Pierwsza wiadomość z opisem inicjatywy i propozycją rozmowy.",
                entry.first_contact_at, None, True,
            ))
            # Notatka profilu
            seed_rows.append((
                ActivityType.NOTE,
                f"Profil partnera: {company_name}",
                f"Dopasowanie do wydarzenia: {entry.notes}",
                entry.first_contact_at + timedelta(days=1), None, True,
            ))
            # Telefon kontaktowy (pomiędzy intro a ofertą)
            phone_dt = entry.first_contact_at + timedelta(days=5)
            seed_rows.append((
                ActivityType.PHONE_CALL,
                f"Rozmowa wprowadzająca: {company_name}",
                "Krótka rozmowa: zarys współpracy, pakiety, kalendarz decyzji.",
                phone_dt, None, True,
            ))

        # Oferta wysłana
        if entry.offer_sent_at:
            seed_rows.append((
                ActivityType.EMAIL,
                f"Wysłano ofertę pakietową do {company_name}",
                "Oferta zawiera pakiety sponsoringowe, obecność w komunikacji i propozycję warsztatu.",
                entry.offer_sent_at, None, True,
            ))

        outcome = stage.outcome.value
        if outcome == "won":
            # Spotkanie kontraktowe
            meeting_dt = (entry.offer_sent_at or entry.first_contact_at or today_dt) + timedelta(days=10)
            seed_rows.append((
                ActivityType.MEETING,
                f"Spotkanie kontraktowe: {company_name}",
                "Ustalono finalny pakiet, harmonogram płatności i wymagania komunikacyjne.",
                meeting_dt, None, True,
            ))
            # Notatka pomeetingowa
            seed_rows.append((
                ActivityType.NOTE,
                f"Notatka ze spotkania: {company_name}",
                "Ustalenia: logo do 2 tygodni, brief partnerski, raport poseventowy w pakiecie.",
                meeting_dt + timedelta(days=1), None, True,
            ))
            # Task: domknąć materiały
            seed_rows.append((
                ActivityType.TASK,
                f"Domknąć materiały partnerskie: {company_name}",
                "Uzupełnić logo, opis firmy i informacje do strony wydarzenia.",
                None, (entry.closed_at or today_dt) + timedelta(days=7), True,
            ))
        elif outcome == "lost":
            seed_rows.append((
                ActivityType.NOTE,
                f"Powód odrzucenia: {company_name}",
                entry.rejection_reason or "Firma nie weszła w partnerstwo w tej edycji.",
                entry.closed_at, None, True,
            ))
        else:
            # Otwarty wpis — follow-up (zaległy lub planowany)
            due = today_dt - timedelta(days=2) if idx % 3 == 0 else today_dt + timedelta(days=5 + idx % 8)
            seed_rows.append((
                ActivityType.FOLLOW_UP,
                f"Ponowić kontakt: {company_name}",
                "Sprawdzić decyzję po przesłaniu oferty i ustalić kolejny krok.",
                None, due, False,
            ))
            # Dodatkowa rozmowa, jeśli oferta poszła
            if entry.offer_sent_at:
                seed_rows.append((
                    ActivityType.PHONE_CALL,
                    f"Telefon przypominający: {company_name}",
                    "Status decyzji po stronie partnera, dopytanie o blokery.",
                    entry.offer_sent_at + timedelta(days=14),
                    None, True,
                ))

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
            activity.activity_date = _clamp_past(activity_date)
            activity.due_date = due_date
            activity.assigned_user_id = assignee_cycle[idx % len(assignee_cycle)].id
            completed_dt = (due_date or activity.activity_date) if completed else None
            activity.completed_at = _clamp_past(completed_dt)


def _payment_status_for(closed_at: datetime | None) -> PaymentStatus:
    """Status faktury zależny od wieku zamknięcia (referencja: TODAY)."""
    if closed_at is None:
        return PaymentStatus.PENDING
    age_days = (TODAY - closed_at.date()).days
    if age_days > 120:
        return PaymentStatus.PAID
    if age_days > 60:
        # 80% opłaconych
        return PaymentStatus.PAID if (closed_at.day % 5) != 0 else PaymentStatus.UNPAID
    if age_days > 21:
        return PaymentStatus.PAID if (closed_at.day % 3) == 0 else PaymentStatus.PENDING
    if age_days >= 0:
        return PaymentStatus.PENDING
    # Zamknięcie w przyszłości — jeszcze nie ma faktury statusowo zamkniętej, ale dla demo wystawiamy PENDING
    return PaymentStatus.PENDING


def _upsert_invoices(session: Session, entries: list[PipelineEntry]) -> None:
    won_entries = [entry for entry in entries if entry.agreed_amount is not None]
    for entry in won_entries:
        invoice_number = f"FV/AGH-IT/{entry.event_id:02d}/{entry.company_id:03d}"
        invoice = session.scalar(select(Invoice).where(Invoice.invoice_number == invoice_number))
        if invoice is None:
            invoice = Invoice(invoice_number=invoice_number)
            session.add(invoice)
        issue_date = (entry.closed_at or datetime.combine(TODAY, datetime.min.time())).date()
        payment_status = _payment_status_for(entry.closed_at)
        invoice.company_id = entry.company_id
        invoice.event_id = entry.event_id
        invoice.amount = entry.agreed_amount or entry.expected_amount or Decimal("0")
        invoice.currency = "PLN"
        invoice.issue_date = issue_date
        invoice.due_date = issue_date + timedelta(days=14)
        invoice.payment_status = payment_status
        invoice.paid_at = issue_date + timedelta(days=8) if payment_status == PaymentStatus.PAID else None
        invoice.notes = "Demo: faktura za pakiet partnerski wydarzenia AGH."


def _document_key(session: Session, file_url: str) -> Document | None:
    return session.scalar(select(Document).where(Document.file_url == file_url))


def _upsert_documents(session: Session, entries: list[PipelineEntry], users: dict[str, User]) -> None:
    stages = {row.id: row for row in session.scalars(select(PipelineStage)).all()}
    uploader = users.get(KOORD_1)

    for entry in entries:
        stage = stages[entry.stage_id]
        outcome = stage.outcome.value
        company = entry.company
        event = entry.event
        company_name = company.name if company else f"firma {entry.company_id}"
        event_name = event.name if event else f"event {entry.event_id}"
        base = f"/demo/documents/event-{entry.event_id}/company-{entry.company_id}"

        docs: list[tuple[str, str, str]] = []  # (file_url, file_name, document_type)

        # Oferta — gdy została wysłana
        if entry.offer_sent_at:
            docs.append((
                f"{base}-oferta.pdf",
                f"Oferta partnerska - {company_name} - {event_name}.pdf",
                "oferta",
            ))

        # NDA — gdy doszliśmy do negocjacji albo wygranej
        if outcome in ("won",) or stages[entry.stage_id].name == "Negocjacje":
            docs.append((
                f"{base}-nda.pdf",
                f"NDA - {company_name} - {event_name}.pdf",
                "nda",
            ))

        if outcome == "won":
            docs.append((
                f"{base}-umowa.pdf",
                f"Umowa partnerska - {company_name} - {event_name}.pdf",
                "umowa",
            ))
            docs.append((
                f"{base}-brief.pdf",
                f"Brief partnerski - {company_name} - {event_name}.pdf",
                "brief",
            ))
            docs.append((
                f"{base}-logo.png",
                f"Logo {company_name}.png",
                "logo",
            ))
            # Raport poseventowy tylko dla wydarzeń zakończonych
            event_end = event.end_date if event else None
            if event_end and event_end < TODAY:
                docs.append((
                    f"{base}-raport-poseventowy.pdf",
                    f"Raport poseventowy - {company_name} - {event_name}.pdf",
                    "raport",
                ))

        for file_url, file_name, doc_type in docs:
            document = _document_key(session, file_url)
            if document is None:
                document = Document(file_url=file_url)
                session.add(document)
            document.company_id = entry.company_id
            document.event_id = entry.event_id
            document.pipeline_entry_id = entry.id
            document.uploaded_by_user_id = uploader.id if uploader else None
            document.file_name = file_name
            document.document_type = doc_type
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
