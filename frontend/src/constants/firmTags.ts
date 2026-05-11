/**
 * Predefined firm tags for categorization.
 * Extend this object to add new tags - styling is automatically applied.
 */

export const FIRM_TAGS = {
    CLOUD: {
        id: 'cloud',
        label: 'Cloud',
        bgColor: '#E0F2FE',
        textColor: '#0369A1'
    },
    SAAS: {
        id: 'saas',
        label: 'SaaS',
        bgColor: '#F0FDFA',
        textColor: '#0D9488'
    },
    STARTUP: {
        id: 'startup',
        label: 'Startup',
        bgColor: '#FEF3C7',
        textColor: '#92400E'
    },
    ENTERPRISE: {
        id: 'enterprise',
        label: 'Enterprise',
        bgColor: '#F3E8FF',
        textColor: '#6B21A8'
    },
    PARTNER: {
        id: 'partner',
        label: 'Partner',
        bgColor: '#ECFDF5',
        textColor: '#065F46'
    },
    RESEARCH: {
        id: 'research',
        label: 'Research',
        bgColor: '#FCE7F3',
        textColor: '#831843'
    },
    AI_ML: {
        id: 'ai_ml',
        label: 'AI/ML',
        bgColor: '#F5E6FF',
        textColor: '#5B21B6'
    },
    BLOCKCHAIN: {
        id: 'blockchain',
        label: 'Blockchain',
        bgColor: '#FEF5E7',
        textColor: '#9D4F02'
    }
} as const;

export type FirmTagId = typeof FIRM_TAGS[keyof typeof FIRM_TAGS]['id'];

/**
 * Get tag config by ID
 */
export const getTagConfig = (tagId: FirmTagId | string) => {
    return Object.values(FIRM_TAGS).find(t => t.id === tagId);
};

/**
 * Get tag label by ID
 */
export const getTagLabel = (tagId: FirmTagId | string): string => {
    const tag = getTagConfig(tagId);
    return tag ? tag.label : tagId;
};

/**
 * Map legacy tag strings to tag IDs (for backward compatibility)
 */
export const mapLegacyTag = (legacyTag: string): FirmTagId | string => {
    const mapping: Record<string, FirmTagId> = {
        'Cloud': 'cloud',
        'SaaS': 'saas',
        'Startup': 'startup',
        'Enterprise': 'enterprise',
        'Partner': 'partner',
        'Research': 'research',
        'AI/ML': 'ai_ml',
        'Blockchain': 'blockchain'
    };
    return mapping[legacyTag] || legacyTag;
};
