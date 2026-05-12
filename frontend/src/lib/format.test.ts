import { describe, expect, it } from 'vitest';
import {
    companySizeToTypeId,
    eventStatusToDisplayId,
    formatDate,
    formatDateRange,
    formatPercent,
    formatPLN,
    ownerInitials,
} from './format';

describe('formatPLN', () => {
    it('returns em-dash for null / undefined', () => {
        expect(formatPLN(null)).toBe('—');
        expect(formatPLN(undefined)).toBe('—');
    });

    it('groups thousands using pl-PL', () => {
        expect(formatPLN(45000)).toMatch(/^45\s?000 PLN$/);
        expect(formatPLN('250000')).toMatch(/^250\s?000 PLN$/);
    });

    it('falls back to em-dash on garbage', () => {
        expect(formatPLN('not-a-number')).toBe('—');
    });
});

describe('formatDate', () => {
    it('renders DD.MM.YYYY in pl-PL', () => {
        expect(formatDate('2024-03-05')).toBe('05.03.2024');
    });

    it('returns em-dash for null', () => {
        expect(formatDate(null)).toBe('—');
        expect(formatDate('not-a-date')).toBe('—');
    });
});

describe('formatDateRange', () => {
    it('renders both endpoints', () => {
        expect(formatDateRange('2024-03-05', '2024-03-08')).toBe(
            '05.03.2024 – 08.03.2024',
        );
    });

    it('returns single date when only one endpoint given', () => {
        expect(formatDateRange('2024-03-05', null)).toBe('05.03.2024');
    });

    it('returns em-dash when both null', () => {
        expect(formatDateRange(null, null)).toBe('—');
    });
});

describe('formatPercent', () => {
    it('multiplies by 100 and rounds', () => {
        expect(formatPercent(0.5)).toBe('50%');
        expect(formatPercent(0.1234, 1)).toBe('12.3%');
    });

    it('returns em-dash for null', () => {
        expect(formatPercent(null)).toBe('—');
    });
});

describe('companySizeToTypeId', () => {
    it('maps known sizes', () => {
        expect(companySizeToTypeId('corporation')).toBe('corporation');
        expect(companySizeToTypeId('startup')).toBe('tech_startup');
        expect(companySizeToTypeId('public_institution')).toBe('government');
    });

    it('returns null for null', () => {
        expect(companySizeToTypeId(null)).toBeNull();
        expect(companySizeToTypeId(undefined)).toBeNull();
    });
});

describe('eventStatusToDisplayId', () => {
    it('maps backend → frontend label ids', () => {
        expect(eventStatusToDisplayId('active')).toBe('ongoing');
        expect(eventStatusToDisplayId('closed')).toBe('completed');
        expect(eventStatusToDisplayId('draft')).toBe('planned');
        expect(eventStatusToDisplayId('cancelled')).toBe('cancelled');
    });
});

describe('ownerInitials', () => {
    it('takes the first letter of each name, uppercased', () => {
        expect(ownerInitials('Anna', 'Nowak')).toBe('AN');
        expect(ownerInitials('marek', 'kowalski')).toBe('MK');
    });

    it('handles empty/null', () => {
        expect(ownerInitials(null, null)).toBe('');
        expect(ownerInitials('Anna', undefined)).toBe('A');
    });
});
