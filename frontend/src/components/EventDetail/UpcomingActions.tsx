import React from 'react';
import type { RecentActivityBrief } from '../../types/api';
import styles from './UpcomingActions.module.css';

interface UpcomingActionsProps {
    actions: RecentActivityBrief[];
    isLoading: boolean;
}

function dueBadge(iso: string | null): { label: string; tone: 'soon' | 'today' } {
    if (!iso) return { label: '—', tone: 'soon' };
    const date = new Date(iso);
    const now = new Date();
    const diffDays = Math.round(
        (date.getTime() - now.getTime()) / (24 * 60 * 60_000),
    );
    if (diffDays <= 0) return { label: 'Dzisiaj', tone: 'today' };
    if (diffDays === 1) return { label: 'Jutro', tone: 'today' };
    if (diffDays <= 7) return { label: `Za ${diffDays}d`, tone: 'soon' };
    return {
        label: date.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' }),
        tone: 'soon',
    };
}

function initials(text: string | null | undefined): string {
    if (!text) return '?';
    return text
        .split(' ')
        .map((part) => part.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

const UpcomingActions: React.FC<UpcomingActionsProps> = ({ actions, isLoading }) => {
    const visible = actions.slice(0, 4);
    return (
        <div className={styles.card}>
            <h3 className={styles.title}>Nadchodzące działania</h3>
            <div className={styles.list}>
                {isLoading && <div className={styles.empty}>Ładowanie…</div>}
                {!isLoading && visible.length === 0 && (
                    <div className={styles.empty}>Brak zaplanowanych działań.</div>
                )}
                {visible.map((act) => {
                    const badge = dueBadge(act.activity_date);
                    return (
                        <div key={act.id} className={styles.row}>
                            <div className={styles.avatar}>
                                {initials(act.company_name)}
                            </div>
                            <div className={styles.body}>
                                <div className={styles.bodyTitle}>{act.subject}</div>
                                <div className={styles.bodySub}>
                                    {act.company_name ?? '—'}
                                </div>
                            </div>
                            <span
                                className={`${styles.dateBadge} ${badge.tone === 'soon' ? styles.dateBadgeSoon : ''
                                    }`}
                            >
                                {badge.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UpcomingActions;
