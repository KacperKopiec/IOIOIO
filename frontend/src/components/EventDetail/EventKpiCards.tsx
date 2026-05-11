import React from 'react';
import CircularProgress from '../ui/CircularProgress';
import { formatPLN, formatPercent } from '../../lib/format';
import type { EventKpi } from '../../types/api';
import styles from './EventKpiCards.module.css';

interface EventKpiCardsProps {
    kpi: EventKpi | undefined;
}

const EventKpiCards: React.FC<EventKpiCardsProps> = ({ kpi }) => {
    const partners = kpi?.partners_count ?? 0;
    const targetPartners = kpi?.target_partners_count ?? 0;
    const partnersRatio =
        targetPartners > 0 ? Math.min(partners / targetPartners, 1) : 0;

    const totalValueLabel = kpi ? formatPLN(kpi.total_value) : '—';
    const budgetTarget = kpi?.target_budget;
    const budgetRatio = kpi?.progress_budget_pct ?? 0;
    const budgetPct = formatPercent(budgetRatio);

    const conversionLabel =
        kpi?.conversion_rate != null
            ? formatPercent(kpi.conversion_rate, 1)
            : '—';

    return (
        <div className={styles.row}>
            <div className={styles.card}>
                <div>
                    <div className={styles.label}>Pozyskani partnerzy</div>
                    <div className={styles.valueRow}>
                        <span className={styles.value}>{partners}</span>
                        <span className={styles.valueSub}>
                            / {targetPartners || '—'}
                        </span>
                    </div>
                </div>
                <CircularProgress progress={partnersRatio} size={48} strokeWidth={6} />
            </div>

            <div className={`${styles.card} ${styles.cardColumn}`}>
                <div className={styles.topRow}>
                    <span className={styles.label}>Budżet zebrany</span>
                    <span className={styles.target}>
                        Cel: {budgetTarget ? formatPLN(budgetTarget) : '—'}
                    </span>
                </div>
                <div className={styles.budgetRow}>
                    <span className={styles.budgetValue}>{totalValueLabel}</span>
                    <div className={styles.progressTrack}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${budgetRatio * 100}%` }}
                        />
                    </div>
                    <span className={styles.progressPct}>{budgetPct}</span>
                </div>
            </div>

            <div className={styles.card}>
                <div>
                    <div className={styles.label}>Konwersja lejka</div>
                    <div className={styles.valueRow}>
                        <span className={styles.value}>{conversionLabel}</span>
                    </div>
                </div>
                <span
                    className={`${styles.trendBadge} ${kpi?.conversion_rate == null ? styles.trendBadgeNeutral : ''
                        }`}
                >
                    {kpi?.pipeline_count ?? 0} w lejku
                </span>
            </div>
        </div>
    );
};

export default EventKpiCards;
