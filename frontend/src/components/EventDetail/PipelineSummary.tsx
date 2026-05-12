import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatPLN } from '../../lib/format';
import type { PipelineEntry, PipelineStage } from '../../types/api';
import styles from './PipelineSummary.module.css';

interface PipelineSummaryProps {
    eventId: number;
    entries: PipelineEntry[];
    stages: PipelineStage[];
    isLoading: boolean;
}

const PipelineSummary: React.FC<PipelineSummaryProps> = ({
    eventId,
    entries,
    stages,
    isLoading,
}) => {
    const byStage = useMemo(() => {
        const map = new Map<number, PipelineEntry[]>();
        for (const stage of stages) map.set(stage.id, []);
        for (const entry of entries) {
            const bucket = map.get(entry.stage_id);
            if (bucket) bucket.push(entry);
        }
        return map;
    }, [entries, stages]);

    return (
        <section className={styles.section}>
            <header className={styles.header}>
                <h2 className={styles.title}>Pipeline partnerów</h2>
                <Link to={`/events/${eventId}/pipeline`} className={styles.viewAll}>
                    Pełen widok lejka
                </Link>
            </header>

            <div className={styles.columns}>
                {stages.map((stage) => {
                    const isWon = stage.outcome === 'won';
                    const items = byStage.get(stage.id) ?? [];
                    const top = items.slice(0, 2);
                    return (
                        <div
                            key={stage.id}
                            className={`${styles.column} ${isWon ? styles.columnWon : ''
                                }`}
                        >
                            <div className={styles.columnHeader}>
                                <span
                                    className={`${styles.columnTitle} ${isWon ? styles.columnTitleWon : ''
                                        }`}
                                >
                                    {stage.name}
                                </span>
                                <span className={styles.countBadge}>{items.length}</span>
                            </div>
                            {isLoading && items.length === 0 ? (
                                <div className={styles.emptyCard}>…</div>
                            ) : top.length === 0 ? (
                                <div className={styles.emptyCard}>brak firm</div>
                            ) : (
                                top.map((entry) => (
                                    <div key={entry.id} className={styles.card}>
                                        <div className={styles.cardTitle}>
                                            {entry.company?.name ?? `Firma #${entry.company_id}`}
                                        </div>
                                        <div className={styles.cardMeta}>
                                            <span className={styles.cardAmount}>
                                                {formatPLN(
                                                    entry.agreed_amount ?? entry.expected_amount,
                                                )}
                                            </span>
                                            {items.length > 2 && top.at(-1) === entry && (
                                                <span className={styles.cardOwner}>
                                                    +{items.length - 2} więcej
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default PipelineSummary;
