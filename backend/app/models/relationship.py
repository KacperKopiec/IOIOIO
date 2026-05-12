from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import RelationshipStatus


class RelationshipType(Base):
    __tablename__ = "relationship_types"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)


class CompanyRelationship(Base, TimestampMixin):
    __tablename__ = "company_relationships"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    event_id: Mapped[int | None] = mapped_column(
        ForeignKey("events.id", ondelete="SET NULL")
    )
    pipeline_entry_id: Mapped[int | None] = mapped_column(
        ForeignKey("pipeline_entries.id", ondelete="SET NULL")
    )
    relationship_type_id: Mapped[int] = mapped_column(
        ForeignKey("relationship_types.id", ondelete="RESTRICT"), nullable=False
    )
    package_name: Mapped[str | None] = mapped_column(String(120))
    amount_net: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    amount_gross: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    currency: Mapped[str] = mapped_column(String(8), default="PLN", nullable=False)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    contract_signed_at: Mapped[datetime | None] = mapped_column(DateTime)
    owner_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    status: Mapped[RelationshipStatus] = mapped_column(
        Enum(
            RelationshipStatus,
            name="relationship_status",
            create_type=True,
            values_callable=lambda enum: [m.value for m in enum],
        ),
        default=RelationshipStatus.DRAFT,
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(Text)

    company: Mapped["Company"] = relationship()
    event: Mapped["Event | None"] = relationship()
    pipeline_entry: Mapped["PipelineEntry | None"] = relationship()
    relationship_type: Mapped["RelationshipType"] = relationship()
    owner: Mapped["User | None"] = relationship()
    tags: Mapped[list["Tag"]] = relationship(
        secondary="company_relationship_tags"
    )
