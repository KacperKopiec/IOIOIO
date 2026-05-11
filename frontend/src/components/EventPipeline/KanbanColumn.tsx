import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import KanbanCard from './KanbanCard';
import { getStageTone } from './stageStyle';
import type { PipelineEntry, PipelineStage } from '../../types/api';
import styles from './KanbanColumn.module.css';

interface KanbanColumnProps {
    stage: PipelineStage;
    entries: PipelineEntry[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ stage, entries }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: `stage-${stage.id}`,
        data: { stageId: stage.id },
    });

    const tone = getStageTone(stage);

    return (
        <div className={styles.column}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <span
                        className={styles.dot}
                        style={{ background: tone.dot }}
                        aria-hidden
                    />
                    <span className={styles.title}>{stage.name}</span>
                    <span className={styles.countBadge}>{entries.length}</span>
                </div>
            </div>

            <div
                ref={setNodeRef}
                className={`${styles.dropZone} ${isOver ? styles.dropZoneActive : ''
                    }`}
            >
                {entries.length === 0 ? (
                    <div className={styles.empty}>Upuść tutaj firmę</div>
                ) : (
                    entries.map((entry) => <KanbanCard key={entry.id} entry={entry} />)
                )}
            </div>
        </div>
    );
};

export default KanbanColumn;
