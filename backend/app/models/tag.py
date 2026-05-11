from sqlalchemy import Column, Enum, ForeignKey, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import TagCategory


company_tags = Table(
    "company_tags",
    Base.metadata,
    Column("company_id", ForeignKey("companies.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

event_tags = Table(
    "event_tags",
    Base.metadata,
    Column("event_id", ForeignKey("events.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

company_relationship_tags = Table(
    "company_relationship_tags",
    Base.metadata,
    Column(
        "company_relationship_id",
        ForeignKey("company_relationships.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    category: Mapped[TagCategory] = mapped_column(
        Enum(
            TagCategory,
            name="tag_category",
            create_type=True,
            values_callable=lambda enum: [m.value for m in enum],
        ),
        nullable=False,
    )

    companies: Mapped[list["Company"]] = relationship(
        secondary=company_tags, back_populates="tags"
    )
    events: Mapped[list["Event"]] = relationship(
        secondary=event_tags, back_populates="tags"
    )
