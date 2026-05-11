/**
 * Predefined event types
 */

export const EVENT_TYPES = {
    WORKSHOP: {
        id: 'workshop',
        label: 'Workshop',
        bgColor: '#EFF6FF',
        textColor: '#1D4ED8'
    },
    CONFERENCE: {
        id: 'conference',
        label: 'Konferencja',
        bgColor: '#ECFDF5',
        textColor: '#065F46'
    },
    HACKATHON: {
        id: 'hackathon',
        label: 'Hackathon',
        bgColor: '#FEF2F2',
        textColor: '#B91C1C'
    },
    NETWORKING: {
        id: 'networking',
        label: 'Networking',
        bgColor: '#FFFBEB',
        textColor: '#B45309'
    }
} as const;

export type EventTypeId = typeof EVENT_TYPES[keyof typeof EVENT_TYPES]['id'];

export const getEventTypeConfig = (typeId: EventTypeId | string) => {
    return Object.values(EVENT_TYPES).find(t => t.id === typeId);
};

export const getEventTypeLabel = (typeId: EventTypeId | string): string => {
    const type = getEventTypeConfig(typeId);
    return type ? type.label : typeId;
};
