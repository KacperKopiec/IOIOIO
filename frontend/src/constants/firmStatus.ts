/**
 * Centralized status definitions for firms.
 * Extend this object to add new statuses - styling and labels are automatically applied.
 * Example: Add { UMOWA: { id: 'umowa', label: 'Umowa', bgColor: '#DBEAFE', textColor: '#0C51BE', dotColor: '#1E40AF' } }
 */

export const FIRM_STATUSES = {
    ACTIVE_PARTNER: {
        id: 'active_partner',
        label: 'Aktywny partner',
        bgColor: '#ECFDF5',
        textColor: '#065F46',
        dotColor: '#006C49'
    },
    CONTACT: {
        id: 'contact',
        label: 'Kontakt',
        bgColor: '#FEF3C7',
        textColor: '#92400E',
        dotColor: '#D97706'
    },
    PROSPECT: {
        id: 'prospect',
        label: 'Prospect',
        bgColor: '#F3F4F6',
        textColor: '#374151',
        dotColor: '#6B7280'
    },
    UMOWA: {
        id: 'umowa',
        label: 'Umowa',
        bgColor: '#DBEAFE',
        textColor: '#0C51BE',
        dotColor: '#1E40AF'
    }
} as const;

export type FirmStatusId = typeof FIRM_STATUSES[keyof typeof FIRM_STATUSES]['id'];

/**
 * Get status config by ID
 * @param statusId - The status identifier from your database
 * @returns Status configuration with colors and label
 */
export const getStatusConfig = (statusId: FirmStatusId | string) => {
    return Object.values(FIRM_STATUSES).find(s => s.id === statusId);
};

/**
 * Get status label by ID
 * @param statusId - The status identifier
 * @returns Human-readable label
 */
export const getStatusLabel = (statusId: FirmStatusId | string): string => {
    const status = getStatusConfig(statusId);
    return status ? status.label : 'Unknown';
};

/**
 * Determine status ID from old string-based status (for backward compatibility)
 */
export const mapLegacyStatus = (legacyStatus: string): FirmStatusId => {
    switch (legacyStatus) {
        case 'Aktywny partner':
            return 'active_partner';
        case 'Kontakt':
            return 'contact';
        case 'Prospect':
            return 'prospect';
        case 'umowa':
            return 'umowa';
        default:
            return 'prospect';
    }
};
