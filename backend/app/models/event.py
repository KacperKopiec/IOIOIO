from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import EventStatus


class Event(Base, TimestampMixin):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    owner_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    target_budget: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    target_partners_count: Mapped[int | None] = mapped_column()
    status: Mapped[EventStatus] = mapped_column(
        Enum(
            EventStatus,
            name="event_status",
            create_type=True,
            values_callable=lambda enum: [m.value for m in enum],
        ),
        default=EventStatus.DRAFT,
        nullable=False,
    )

    owner: Mapped["User | None"] = relationship()
    tags: Mapped[list["Tag"]] = relationship(
        secondary="event_tags", back_populates="events"
    )
    pipeline_entries: Mapped[list["PipelineEntry"]] = relationship(
        back_populates="event", cascade="all, delete-orphan"
    )
