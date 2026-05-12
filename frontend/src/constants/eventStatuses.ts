/**
 * Predefined event statuses
 */

export const EVENT_STATUSES = {
    PLANNED: {
        id: 'planned',
        label: 'Zaplanowane',
        bgColor: '#EFF6FF',
        textColor: '#1D4ED8'
    },
    ONGOING: {
        id: 'ongoing',
        label: 'W trakcie',
        bgColor: '#F0FDF4',
        textColor: '#15803D'
    },
    COMPLETED: {
        id: 'completed',
        label: 'Ukończone',
        bgColor: '#F1F5F9',
        textColor: '#475569'
    },
    CANCELLED: {
        id: 'cancelled',
        label: 'Anulowane',
        bgColor: '#FEF2F2',
        textColor: '#B91C1C'
    }
} as const;

export type EventStatusId = typeof EVENT_STATUSES[keyof typeof EVENT_STATUSES]['id'];

export const getEventStatusConfig = (statusId: EventStatusId | string) => {
    return Object.values(EVENT_STATUSES).find(s => s.id === statusId);
};

export const getEventStatusLabel = (statusId: EventStatusId | string): string => {
    const status = getEventStatusConfig(statusId);
    return status ? status.label : statusId;
};
