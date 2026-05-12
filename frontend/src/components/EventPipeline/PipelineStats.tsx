import React from 'react';
import { TrendingUp, Users, Wallet } from 'lucide-react';
import { formatPercent } from '../../lib/format';
import type { EventKpi } from '../../types/api';
import styles from './PipelineStats.module.css';

interface PipelineStatsProps {
    kpi: EventKpi | undefined;
}

function shortPLN(value: string | number | null | undefined): string {
    if (value == null) return '0';
    const numeric = typeof value === 'string' ? Number.parseFloat(value) : value;
    if (Number.isNaN(numeric)) return '0';
    if (numeric >= 1_000_000) return `${(numeric / 1_000_000).toFixed(1)}M`;
    if (numeric >= 1_000) return `${Math.round(numeric / 1_000)}k`;
    return numeric.toFixed(0);
}

const PipelineStats: React.FC<PipelineStatsProps> = ({ kpi }) => {
    const partners = kpi?.partners_count ?? 0;
    const target = kpi?.target_partners_count ?? 0;
    const partnersPct =
        target > 0 ? Math.min(partners / target, 1) : 0;

    const collected = kpi ? Number.parseFloat(kpi.total_value) : 0;
    const budget = kpi?.target_budget ? Number.parseFloat(kpi.target_budget) : 0;
    const budgetPct = budget > 0 ? Math.min(collected / budget, 1) : 0;

    const conversion = kpi?.conversion_rate;

    return (
        <div className={styles.row}>
            <div className={styles.card}>
                <div className={`${styles.iconCircle} ${styles.iconBlue}`}>
                    <Users size={20} />
                </div>
                <div className={styles.content}>
                    <div className={styles.label}>Partnerzy</div>
                    <div className={styles.value}>
                        {partners} / {target || '—'}
                    </div>
                    <div className={styles.progressTrack}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${partnersPct * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.card}>
                <div className={`${styles.iconCircle} ${styles.iconGreen}`}>
                    <Wallet size={20} />
                </div>
                <div className={styles.content}>
                    <div className={styles.label}>Zebrana kwota</div>
                    <div className={styles.value}>
                        {shortPLN(collected)} / {shortPLN(budget)}
                        <span className={styles.valueUnit}>PLN</span>
                    </div>
                    <div className={styles.progressTrack}>
                        <div
                            className={`${styles.progressFill} ${styles.progressFillGreen}`}
                            style={{ width: `${budgetPct * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.card}>
                <div className={`${styles.iconCircle} ${styles.iconIndigo}`}>
                    <TrendingUp size={20} />
                </div>
                <div className={styles.content}>
                    <div className={styles.label}>Konwersja lejka</div>
                    <div className={styles.value}>
                        {conversion != null ? formatPercent(conversion, 1) : '—'}
                    </div>
                    <div className={styles.trendRow}>
                        <span>{kpi?.pipeline_count ?? 0} firm w lejku</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PipelineStats;
