import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';
import { formatPLN } from '../../lib/format';
import type { PipelineEntry, PipelineStage } from '../../types/api';
import styles from './PipelineSummary.module.css';

function groupByReason(entries: PipelineEntry[]) {
    const map = new Map<string, PipelineEntry[]>();
    for (const entry of entries) {
        const reason = entry.rejection_reason ?? 'Inny powód';
        const list = map.get(reason) ?? [];
        list.push(entry);
        map.set(reason, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
}

interface PipelineSummaryProps {
    eventId: number;
    entries: PipelineEntry[];
    stages: PipelineStage[];
    isLoading: boolean;
}

const MAX_VISIBLE = 10;

const PipelineSummary: React.FC<PipelineSummaryProps> = ({
    eventId,
    entries,
    stages,
    isLoading,
}) => {
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    const byStage = useMemo(() => {
        const map = new Map<number, PipelineEntry[]>();
        for (const stage of stages) map.set(stage.id, []);
        for (const entry of entries) {
            const bucket = map.get(entry.stage_id);
            if (bucket) bucket.push(entry);
        }
        return map;
    }, [entries, stages]);

    const toggleExpand = (stageId: number) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(stageId)) {
                next.delete(stageId);
            } else {
                next.add(stageId);
            }
            return next;
        });
    };

    const activeStages = stages.filter((s) => s.outcome !== 'lost');
    const lostStage = stages.find((s) => s.outcome === 'lost');

    return (
        <section className={styles.section}>
            <header className={styles.header}>
                <h2 className={styles.title}>Pipeline partnerów</h2>
                <Link to={`/events/${eventId}/pipeline`} className={styles.viewAll}>
                    Pełen widok lejka
                </Link>
            </header>

            <div className={styles.columns}>
                {activeStages.map((stage) => {
                    const isWon = stage.outcome === 'won';
                    const items = byStage.get(stage.id) ?? [];
                    const isExpanded = expanded.has(stage.id);
                    const visible = isExpanded ? items : items.slice(0, MAX_VISIBLE);
                    const hiddenCount = items.length - MAX_VISIBLE;

                    return (
                        <div
                            key={stage.id}
                            className={`${styles.column} ${isWon ? styles.columnWon : ''}`}
                        >
                            <div className={styles.columnHeader}>
                                <span
                                    className={`${styles.columnTitle} ${isWon ? styles.columnTitleWon : ''}`}
                                >
                                    {stage.name}
                                </span>
                                <span className={styles.countBadge}>{items.length}</span>
                            </div>
                            {isLoading && items.length === 0 ? (
                                <div className={styles.emptyCard}>…</div>
                            ) : visible.length === 0 ? (
                                <div className={styles.emptyCard}>brak firm</div>
                            ) : (
                                <>
                                    {visible.map((entry) => (
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
                                            </div>
                                        </div>
                                    ))}
                                    {hiddenCount > 0 && (
                                        <button
                                            type="button"
                                            className={styles.expandBtn}
                                            onClick={() => toggleExpand(stage.id)}
                                        >
                                            {isExpanded ? (
                                                <>
                                                    <ChevronUp size={14} />
                                                    <span>Zwiń</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className={styles.expandBadge}>+{hiddenCount}</span>
                                                    <span>więcej</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {lostStage && (
                <div className={styles.lostSection}>
                    {(() => {
                        const items = byStage.get(lostStage.id) ?? [];
                        const reasonGroups = groupByReason(items);

                        return (
                            <>
                                <div className={styles.lostHeader}>
                                    <span className={styles.lostTitle}>Odrzucone ({items.length})</span>
                                </div>
                                {reasonGroups.length > 0 && (
                                    <div className={styles.lostStats}>
                                        {reasonGroups.slice(0, 3).map(([reason, reasonItems]) => (
                                            <div key={reason} className={styles.lostStat}>
                                                <span className={styles.lostStatCount}>
                                                    {reasonItems.length}
                                                </span>
                                                <span className={styles.lostStatReason}>{reason}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className={styles.lostColumns}>
                                    <div className={styles.column}>
                                        {items.length === 0 ? (
                                            <div className={styles.emptyCard}>brak firm</div>
                                        ) : (
                                            <>
                                                {items.slice(0, MAX_VISIBLE).map((entry) => (
                                                    <div key={entry.id} className={styles.card}>
                                                        <div className={styles.cardTitle}>
                                                            {entry.company?.name ??
                                                                `Firma #${entry.company_id}`}
                                                        </div>
                                                        <div className={styles.cardMeta}>
                                                            <span className={styles.cardAmount}>
                                                                {formatPLN(entry.expected_amount)}
                                                            </span>
                                                        </div>
                                                        {entry.rejection_reason && (
                                                            <div className={styles.cardMeta}>
                                                                <span className={styles.cardReason}>
                                                                    {entry.rejection_reason}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {items.length > MAX_VISIBLE && (
                                                    <button
                                                        type="button"
                                                        className={styles.expandBtn}
                                                        onClick={() => toggleExpand(lostStage.id)}
                                                    >
                                                        {expanded.has(lostStage.id) ? (
                                                            <>
                                                                <ChevronUp size={14} />
                                                                <span>Zwiń</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className={styles.expandBadge}>
                                                                    +{items.length - MAX_VISIBLE}
                                                                </span>
                                                                <span>więcej</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
        </section>
    );
};

export default PipelineSummary;