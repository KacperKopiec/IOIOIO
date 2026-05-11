import type { CompanySize, EventStatus, StageOutcome } from '../types/api';
import type { FirmTypeId } from '../constants/firmTypes';
import type { EventStatusId } from '../constants/eventStatuses';

export function formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export function formatDateRange(
    start: string | null | undefined,
    end: string | null | undefined,
): string {
    if (!start && !end) return '—';
    if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
    return formatDate(start || end);
}

export function formatPLN(value: string | number | null | undefined): string {
    if (value == null) return '—';
    const numeric = typeof value === 'string' ? Number.parseFloat(value) : value;
    if (Number.isNaN(numeric)) return '—';
    return new Intl.NumberFormat('pl-PL', {
        maximumFractionDigits: 0,
    }).format(numeric) + ' PLN';
}

export function formatPercent(value: number | null | undefined, digits = 0): string {
    if (value == null) return '—';
    return `${(value * 100).toFixed(digits)}%`;
}

// Map backend CompanySize enum -> existing frontend FirmTypeId for badge styling.
const COMPANY_SIZE_TO_TYPE: Record<CompanySize, FirmTypeId> = {
    startup: 'tech_startup',
    sme: 'sme',
    corporation: 'corporation',
    public_institution: 'government',
};

export function companySizeToTypeId(
    size: CompanySize | null | undefined,
): FirmTypeId | null {
    if (!size) return null;
    return COMPANY_SIZE_TO_TYPE[size] ?? null;
}

// Map backend EventStatus -> frontend display id (EventStatusId is planned/ongoing/completed/cancelled
// while backend is draft/active/closed/cancelled — closest mapping for label/colors).
const EVENT_STATUS_TO_DISPLAY: Record<EventStatus, EventStatusId> = {
    draft: 'planned',
    active: 'ongoing',
    closed: 'completed',
    cancelled: 'cancelled',
};

export function eventStatusToDisplayId(status: EventStatus): EventStatusId {
    return EVENT_STATUS_TO_DISPLAY[status];
}

export function ownerInitials(
    firstName: string | null | undefined,
    lastName: string | null | undefined,
): string {
    const f = firstName?.charAt(0) ?? '';
    const l = lastName?.charAt(0) ?? '';
    return (f + l).toUpperCase();
}

export function stageOutcomeColor(outcome: StageOutcome): string {
    switch (outcome) {
        case 'won':
            return '#065F46';
        case 'lost':
            return '#B91C1C';
        default:
            return '#1F2937';
    }
}
