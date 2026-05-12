import React from 'react';
import { Calendar, Wallet } from 'lucide-react';
import { formatPLN } from '../../lib/format';
import type { Activity, PipelineEntry } from '../../types/api';
import styles from './EventCompanyMetrics.module.css';

interface EventCompanyMetricsProps {
    entry: PipelineEntry | null;
    activities: Activity[];
}

function formatRelative(iso: string | null): string {
    if (!iso) return 'Brak danych';
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60_000));
    if (diffDays < 0) {
        return date.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' });
    }
    if (diffDays === 0) return 'Dzisiaj';
    if (diffDays === 1) return 'Wczoraj';
    if (diffDays < 7) return `${diffDays} dni temu`;
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' });
}

const EventCompanyMetrics: React.FC<EventCompanyMetricsProps> = ({
    entry,
    activities,
}) => {
    const amount = entry?.agreed_amount ?? entry?.expected_amount ?? null;
    const isWon = entry?.stage?.outcome === 'won';

    const lastActivity = activities[0];
    const lastDate = lastActivity?.activity_date ?? entry?.updated_at ?? null;

    return (
        <div className={styles.row}>
            <div className={styles.card}>
                <div className={styles.head}>
                    <Wallet size={16} />
                    <span className={styles.label}>Kwota sponsoringu</span>
                </div>
                <div className={styles.value}>{formatPLN(amount)}</div>
                <div className={`${styles.foot} ${isWon ? styles.footWon : ''}`}>
                    {isWon
                        ? 'Umowa podpisana'
                        : amount
                            ? 'Wartość oczekiwana'
                            : 'Brak kwoty w pipeline'}
                </div>
            </div>

            <div className={styles.card}>
                <div className={styles.head}>
                    <Calendar size={16} />
                    <span className={styles.label}>Ostatni kontakt</span>
                </div>
                <div className={styles.value}>{formatRelative(lastDate)}</div>
                <div className={styles.foot}>
                    {lastActivity
                        ? lastActivity.subject
                        : 'Brak zarejestrowanych kontaktów'}
                </div>
            </div>
        </div>
    );
};

export default EventCompanyMetrics;
