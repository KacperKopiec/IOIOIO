import type { PipelineStage } from '../../types/api';

export interface StageTone {
    dot: string;
    badgeBg: string;
    badgeText: string;
    border?: string;
}

const ORDER_TONES: Record<number, StageTone> = {
    1: { dot: '#3B82F6', badgeBg: '#EFF6FF', badgeText: '#2563EB' },
    2: { dot: '#F59E0B', badgeBg: '#FFFBEB', badgeText: '#B45309' },
    3: {
        dot: '#F97316',
        badgeBg: '#FFF7ED',
        badgeText: '#EA580C',
        border: '#FED7AA',
    },
    4: {
        dot: '#10B981',
        badgeBg: '#ECFDF5',
        badgeText: '#059669',
        border: '#A7F3D0',
    },
    5: { dot: '#EF4444', badgeBg: '#F1F5F9', badgeText: '#64748B' },
};

const FALLBACK: StageTone = {
    dot: '#94A3B8',
    badgeBg: '#F1F5F9',
    badgeText: '#475569',
};

export function getStageTone(stage: PipelineStage | undefined | null): StageTone {
    if (!stage) return FALLBACK;
    if (stage.outcome === 'won') return ORDER_TONES[4];
    if (stage.outcome === 'lost') return ORDER_TONES[5];
    return ORDER_TONES[stage.order_number] ?? FALLBACK;
}

export function formatRelativeDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.round(diffMs / (24 * 60 * 60_000));
    const diffHrs = Math.round(diffMs / (60 * 60_000));

    if (diffMs < 60_000) return 'przed chwilą';
    if (diffHrs < 1) return `${Math.round(diffMs / 60_000)} min temu`;
    if (diffHrs < 24) return `${diffHrs}h temu`;
    if (diffDays === 1) return 'wczoraj';
    if (diffDays < 7) return `${diffDays} dni temu`;
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
}
