from enum import StrEnum


class CompanySize(StrEnum):
    STARTUP = "startup"
    SME = "sme"
    CORPORATION = "corporation"
    PUBLIC_INSTITUTION = "public_institution"


class EventStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class ActivityType(StrEnum):
    NOTE = "note"
    MEETING = "meeting"
    EMAIL = "email"
    PHONE_CALL = "phone_call"
    FOLLOW_UP = "follow_up"
    TASK = "task"


class StageOutcome(StrEnum):
    OPEN = "open"
    WON = "won"
    LOST = "lost"


class RelationshipStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ON_HOLD = "on_hold"


class TagCategory(StrEnum):
    TECHNOLOGY = "technology"
    INTEREST = "interest"
    RELATIONSHIP = "relationship"
    COLLABORATION = "collaboration"
