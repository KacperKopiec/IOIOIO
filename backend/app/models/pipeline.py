from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import StageOutcome


class PipelineStage(Base):
    __tablename__ = "pipeline_stages"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    order_number: Mapped[int] = mapped_column(nullable=False)
    success_probability: Mapped[int] = mapped_column(nullable=False, default=0)
    outcome: Mapped[StageOutcome] = mapped_column(
        Enum(
            StageOutcome,
            name="stage_outcome",
            create_type=True,
            values_callable=lambda enum: [m.value for m in enum],
        ),
        nullable=False,
        default=StageOutcome.OPEN,
    )

    entries: Mapped[list["PipelineEntry"]] = relationship(back_populates="stage")


class PipelineEntry(Base, TimestampMixin):
    __tablename__ = "pipeline_entries"
    __table_args__ = (
        UniqueConstraint("event_id", "company_id", name="uq_pipeline_event_company"),
        Index("ix_pipeline_event_stage", "event_id", "stage_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    stage_id: Mapped[int] = mapped_column(
        ForeignKey("pipeline_stages.id", ondelete="RESTRICT"), nullable=False
    )
    owner_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    contact_person_id: Mapped[int | None] = mapped_column(
        ForeignKey("contacts.id", ondelete="SET NULL")
    )
    expected_amount: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    agreed_amount: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    probability_override: Mapped[int | None] = mapped_column()
    first_contact_at: Mapped[datetime | None] = mapped_column(DateTime)
    offer_sent_at: Mapped[datetime | None] = mapped_column(DateTime)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime)
    rejection_reason: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)

    event: Mapped["Event"] = relationship(back_populates="pipeline_entries")
    company: Mapped["Company"] = relationship()
    stage: Mapped["PipelineStage"] = relationship(back_populates="entries")
    owner: Mapped["User | None"] = relationship()
    contact_person: Mapped["Contact | None"] = relationship()
