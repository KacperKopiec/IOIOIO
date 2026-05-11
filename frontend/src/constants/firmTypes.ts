/**
 * Predefined firm types for classification.
 * Extend this object to add new types - styling is automatically applied.
 */

export const FIRM_TYPES = {
    TECH_STARTUP: {
        id: 'tech_startup',
        label: 'Tech Startup',
        bgColor: '#F0F9FF',
        textColor: '#0369A1'
    },
    CORPORATION: {
        id: 'corporation',
        label: 'Korporacja',
        bgColor: '#F3E8FF',
        textColor: '#5B21B6'
    },
    SME: {
        id: 'sme',
        label: 'SME',
        bgColor: '#ECFDF5',
        textColor: '#065F46'
    },
    GOVERNMENT: {
        id: 'government',
        label: 'Sektor publiczny',
        bgColor: '#FEF3C7',
        textColor: '#92400E'
    },
    NGO: {
        id: 'ngo',
        label: 'NGO',
        bgColor: '#FCE7F3',
        textColor: '#831843'
    },
    UNIVERSITY: {
        id: 'university',
        label: 'Uniwersytet',
        bgColor: '#E0F2FE',
        textColor: '#0369A1'
    },
    RESEARCH_INSTITUTE: {
        id: 'research_institute',
        label: 'Instytut badawczy',
        bgColor: '#F5EDFF',
        textColor: '#6B21A8'
    },
    CONSULTANT: {
        id: 'consultant',
        label: 'Consulting',
        bgColor: '#FEF5E7',
        textColor: '#9D4F02'
    }
} as const;

export type FirmTypeId = typeof FIRM_TYPES[keyof typeof FIRM_TYPES]['id'];

/**
 * Get type config by ID
 */
export const getTypeConfig = (typeId: FirmTypeId | string) => {
    return Object.values(FIRM_TYPES).find(t => t.id === typeId);
};

/**
 * Get type label by ID
 */
export const getTypeLabel = (typeId: FirmTypeId | string): string => {
    const type = getTypeConfig(typeId);
    return type ? type.label : typeId;
};

/**
 * Map legacy type strings to type IDs (for backward compatibility)
 */
export const mapLegacyType = (legacyType: string): FirmTypeId | string => {
    const mapping: Record<string, FirmTypeId> = {
        'Tech Startup': 'tech_startup',
        'Korporacja': 'corporation',
        'SME': 'sme',
        'Sektor publiczny': 'government',
        'NGO': 'ngo',
        'Uniwersytet': 'university',
        'Instytut badawczy': 'research_institute',
        'Consulting': 'consultant'
    };
    return mapping[legacyType] || legacyType;
};
