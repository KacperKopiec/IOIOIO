from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.enums import CompanySize


class Company(Base, TimestampMixin):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    legal_name: Mapped[str | None] = mapped_column(String(200))
    website: Mapped[str | None] = mapped_column(String(255))
    nip: Mapped[str | None] = mapped_column(String(32))
    description: Mapped[str | None] = mapped_column(Text)
    industry_id: Mapped[int | None] = mapped_column(
        ForeignKey("industries.id", ondelete="SET NULL")
    )
    company_size: Mapped[CompanySize | None] = mapped_column(
        Enum(
            CompanySize,
            name="company_size",
            create_type=True,
            values_callable=lambda enum: [m.value for m in enum],
        )
    )
    country: Mapped[str | None] = mapped_column(String(80))
    city: Mapped[str | None] = mapped_column(String(120))

    industry: Mapped["Industry | None"] = relationship(back_populates="companies")
    contacts: Mapped[list["Contact"]] = relationship(
        back_populates="company", cascade="all, delete-orphan"
    )
    tags: Mapped[list["Tag"]] = relationship(
        secondary="company_tags", back_populates="companies"
    )
