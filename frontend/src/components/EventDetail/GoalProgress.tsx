import React from 'react';
import CircularProgress from '../ui/CircularProgress';
import { formatPLN } from '../../lib/format';
import type { EventKpi } from '../../types/api';
import styles from './GoalProgress.module.css';

interface GoalProgressProps {
    kpi: EventKpi | undefined;
}

const GoalProgress: React.FC<GoalProgressProps> = ({ kpi }) => {
    const partners = kpi?.partners_count ?? 0;
    const target = kpi?.target_partners_count ?? 0;
    const ratio = target > 0 ? Math.min(partners / target, 1) : 0;

    const collected = kpi ? Number.parseFloat(kpi.total_value) : 0;
    const budgetTarget = kpi?.target_budget
        ? Number.parseFloat(kpi.target_budget)
        : 0;
    const remaining = Math.max(budgetTarget - collected, 0);

    return (
        <div className={styles.card}>
            <h3 className={styles.title}>Postęp do celu</h3>

            <div className={styles.dialWrap}>
                <CircularProgress
                    progress={ratio}
                    size={160}
                    strokeWidth={12}
                    fillColor="#03467B"
                    trackColor="#F1F5F9"
                >
                    <div className={styles.dialCenter}>
                        <div className={styles.dialValue}>
                            {partners}/{target || '—'}
                        </div>
                        <div className={styles.dialLabel}>Partnerów</div>
                    </div>
                </CircularProgress>
            </div>

            <div className={styles.amounts}>
                <div className={styles.amountRow}>
                    <span className={styles.amountLabel}>Wpłacono:</span>
                    <span className={styles.amountValue}>
                        {formatPLN(collected)}
                    </span>
                </div>
                <div className={styles.amountRow}>
                    <span className={styles.amountLabel}>Pozostało:</span>
                    <span className={styles.amountValue}>
                        {budgetTarget > 0 ? formatPLN(remaining) : '—'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default GoalProgress;
