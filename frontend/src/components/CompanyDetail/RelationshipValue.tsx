import React from 'react';
import { formatPLN } from '../../lib/format';
import type { CompanyEventLink } from '../../hooks/api/companies';
import styles from './RelationshipValue.module.css';

interface RelationshipValueProps {
    eventLinks: CompanyEventLink[];
    isLoading: boolean;
}

const RelationshipValue: React.FC<RelationshipValueProps> = ({
    eventLinks,
    isLoading,
}) => {
    if (isLoading) {
        return (
            <div className={styles.card}>
                <div className={styles.empty}>Ładowanie…</div>
            </div>
        );
    }

    const won = eventLinks.filter((l) => l.stage_outcome === 'won');
    const total = won.reduce(
        (acc, l) => acc + Number.parseFloat(l.agreed_amount ?? '0'),
        0,
    );

    const thisYear = new Date().getFullYear();
    const yearlyTotal = won
        .filter((l) => {
            const d = l.event_start_date ? new Date(l.event_start_date) : null;
            return d != null && d.getFullYear() === thisYear;
        })
        .reduce((acc, l) => acc + Number.parseFloat(l.agreed_amount ?? '0'), 0);

    const pendingTotal = eventLinks
        .filter((l) => l.stage_outcome === 'open')
        .reduce((acc, l) => acc + Number.parseFloat(l.expected_amount ?? '0'), 0);

    return (
        <div className={styles.card}>
            <span className={styles.label}>Wartość relacji (PLN)</span>
            <span className={styles.value}>
                {new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(
                    total,
                )}
            </span>
            <div className={styles.breakdown}>
                <div className={styles.row}>
                    <span>Sfinalizowane ({thisYear})</span>
                    <span className={styles.rowValue}>{formatPLN(yearlyTotal)}</span>
                </div>
                <div className={styles.row}>
                    <span>W lejku (oczekiwane)</span>
                    <span className={styles.rowValue}>{formatPLN(pendingTotal)}</span>
                </div>
            </div>
        </div>
    );
};

export default RelationshipValue;
