from __future__ import annotations

import logging
import smtplib
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.models.activity import Activity
from app.models.enums import ActivityType
from app.models.user import User


log = logging.getLogger(__name__)


UPCOMING_WINDOW_DAYS = 14
ACTION_TYPES = (ActivityType.TASK, ActivityType.FOLLOW_UP)


@dataclass
class ReminderResult:
    sent: bool
    to: str
    subject: str
    overdue_count: int
    upcoming_count: int
    transport: str  # "smtp" lub "log"
    detail: str | None = None


def _format_dt(value: datetime | None) -> str:
    if value is None:
        return "—"
    return value.strftime("%Y-%m-%d %H:%M")


def _activity_line(act: Activity) -> str:
    parts = [act.subject or "(bez tematu)"]
    if act.company is not None:
        parts.append(f"firma: {act.company.name}")
    if act.event is not None:
        parts.append(f"wydarzenie: {act.event.name}")
    parts.append(f"termin: {_format_dt(act.due_date)}")
    return " · ".join(parts)


def _collect_activities(db: Session, user_id: int) -> tuple[list[Activity], list[Activity]]:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    horizon = now + timedelta(days=UPCOMING_WINDOW_DAYS)

    base = (
        select(Activity)
        .options(selectinload(Activity.company), selectinload(Activity.event))
        .where(
            Activity.assigned_user_id == user_id,
            Activity.activity_type.in_(ACTION_TYPES),
            Activity.completed_at.is_(None),
        )
    )

    overdue = list(
        db.scalars(
            base.where(Activity.due_date.is_not(None), Activity.due_date < now)
            .order_by(Activity.due_date.asc())
        )
    )
    upcoming = list(
        db.scalars(
            base.where(
                or_(
                    Activity.due_date.is_(None),
                    Activity.due_date.between(now, horizon),
                )
            ).order_by(Activity.due_date.asc().nullslast())
        )
    )
    return overdue, upcoming


def _build_email(user: User, overdue: list[Activity], upcoming: list[Activity]) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = (
        f"Przypomnienia CRM — {len(overdue)} zaległe, {len(upcoming)} nadchodzące"
    )
    settings = get_settings()
    msg["From"] = settings.smtp_from
    msg["To"] = user.email

    lines: list[str] = []
    lines.append(f"Cześć {user.first_name},")
    lines.append("")
    lines.append("To Twoje aktualne przypomnienia z CRM Wydziału Informatyki AGH.")
    lines.append("")
    lines.append(f"ZALEGŁE ({len(overdue)}):")
    if overdue:
        for act in overdue:
            lines.append(f"  • {_activity_line(act)}")
    else:
        lines.append("  Brak zaległych aktywności.")
    lines.append("")
    lines.append(f"NADCHODZĄCE w ciągu {UPCOMING_WINDOW_DAYS} dni ({len(upcoming)}):")
    if upcoming:
        for act in upcoming:
            lines.append(f"  • {_activity_line(act)}")
    else:
        lines.append("  Brak nadchodzących aktywności.")
    lines.append("")
    lines.append("— CRM AGH")

    msg.set_content("\n".join(lines))
    return msg


def send_reminder_email(db: Session, user_id: int) -> ReminderResult:
    user = db.get(User, user_id)
    if user is None or not user.email:
        return ReminderResult(
            sent=False, to="", subject="", overdue_count=0, upcoming_count=0,
            transport="log", detail="Użytkownik nie istnieje lub brak adresu e-mail.",
        )

    overdue, upcoming = _collect_activities(db, user_id)
    msg = _build_email(user, overdue, upcoming)

    settings = get_settings()
    result = ReminderResult(
        sent=False,
        to=user.email,
        subject=msg["Subject"],
        overdue_count=len(overdue),
        upcoming_count=len(upcoming),
        transport="smtp" if settings.smtp_host else "log",
    )

    if not settings.smtp_host:
        log.warning(
            "SMTP nie skonfigurowany — wiadomość do %s zapisana w logu zamiast wysyłki.",
            user.email,
        )
        log.info("Treść maila:\n%s", msg.get_content())
        result.detail = (
            "SMTP nie skonfigurowany (SMTP_HOST). Treść maila wypisana w logu kontenera."
        )
        return result

    use_ssl = settings.smtp_use_ssl or settings.smtp_port == 465
    try:
        if use_ssl:
            client = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=15)
        else:
            client = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15)
        with client as smtp:
            smtp.ehlo()
            if not use_ssl and settings.smtp_use_tls:
                smtp.starttls()
                smtp.ehlo()
            if settings.smtp_user and settings.smtp_password:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(msg)
        result.sent = True
        return result
    except Exception as exc:
        log.exception("Wysyłka maila do %s nie powiodła się", user.email)
        result.detail = f"Błąd SMTP: {exc}"
        return result
