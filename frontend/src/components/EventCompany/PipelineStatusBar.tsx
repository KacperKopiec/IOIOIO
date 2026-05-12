import React from 'react';
import { Check } from 'lucide-react';
import type { PipelineEntry, PipelineStage } from '../../types/api';
import styles from './PipelineStatusBar.module.css';

interface PipelineStatusBarProps {
    stages: PipelineStage[];
    entry: PipelineEntry | null;
}

const PipelineStatusBar: React.FC<PipelineStatusBarProps> = ({
    stages,
    entry,
}) => {
    const ordered = [...stages].sort((a, b) => a.order_number - b.order_number);
    const currentStage = entry?.stage ?? null;
    const currentOrder = currentStage?.order_number ?? 0;
    const isLost = currentStage?.outcome === 'lost';

    return (
        <section className={styles.section}>
            <h2 className={styles.title}>Status procesu partnerskiego</h2>
            <div className={styles.stepper}>
                <span className={styles.track} aria-hidden />
                {ordered.map((stage) => {
                    let circleClass = styles.circlePending;
                    let labelClass = styles.labelPending;
                    let content: React.ReactNode = <span className={styles.dot} />;

                    if (stage.outcome === 'lost' && isLost) {
                        circleClass = styles.circleLost;
                        labelClass = styles.labelLost;
                        content = <span className={styles.dot} style={{ background: '#FFFFFF' }} />;
                    } else if (stage.order_number < currentOrder) {
                        circleClass = styles.circleDone;
                        labelClass = '';
                        content = <Check size={14} strokeWidth={3} />;
                    } else if (stage.order_number === currentOrder) {
                        circleClass = styles.circleCurrent;
                        labelClass = '';
                    }

                    return (
                        <div key={stage.id} className={styles.step}>
                            <span className={`${styles.circle} ${circleClass}`}>
                                {content}
                            </span>
                            <span className={`${styles.label} ${labelClass}`}>
                                {stage.name}
                            </span>
                        </div>
                    );
                })}
            </div>
            {!entry && (
                <div className={`${styles.summary} ${styles.summaryError}`}>
                    Ta firma nie jest w lejku tego wydarzenia.
                </div>
            )}
            {entry && currentStage && (
                <div className={styles.summary}>
                    Etap: <strong>{currentStage.name}</strong>
                    {entry.owner
                        ? ` · Opiekun: ${entry.owner.first_name} ${entry.owner.last_name}`
                        : ''}
                </div>
            )}
        </section>
    );
};

export default PipelineStatusBar;
