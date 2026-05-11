import React, { useMemo, useState } from 'react';
import {
    DndContext,
    type DragEndEvent,
    DragOverlay,
    type DragStartEvent,
    MouseSensor,
    TouchSensor,
    closestCorners,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { useQueryClient } from '@tanstack/react-query';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import { eventKeys } from '../../hooks/api/events';
import { useMovePipelineEntry } from '../../hooks/api/pipeline';
import { toApiError } from '../../lib/api';
import type { PipelineEntry, PipelineStage } from '../../types/api';
import styles from './KanbanBoard.module.css';

interface KanbanBoardProps {
    eventId: number;
    stages: PipelineStage[];
    entries: PipelineEntry[];
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
    eventId,
    stages,
    entries,
}) => {
    const queryClient = useQueryClient();
    const move = useMovePipelineEntry();

    const [activeEntry, setActiveEntry] = useState<PipelineEntry | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 150, tolerance: 5 },
        }),
    );

    const grouped = useMemo(() => {
        const map = new Map<number, PipelineEntry[]>();
        for (const stage of stages) map.set(stage.id, []);
        for (const entry of entries) {
            const bucket = map.get(entry.stage_id);
            if (bucket) bucket.push(entry);
        }
        return map;
    }, [entries, stages]);

    function handleDragStart(event: DragStartEvent) {
        const entry = event.active.data.current?.entry as PipelineEntry | undefined;
        if (entry) setActiveEntry(entry);
    }

    function handleDragEnd(event: DragEndEvent) {
        setActiveEntry(null);
        const { active, over } = event;
        if (!over) return;

        const entry = active.data.current?.entry as PipelineEntry | undefined;
        const targetStageId = over.data.current?.stageId as number | undefined;
        if (!entry || targetStageId == null || entry.stage_id === targetStageId) {
            return;
        }

        const targetStage = stages.find((s) => s.id === targetStageId);
        if (!targetStage) return;

        const queryKey = eventKeys.pipeline(eventId);
        const snapshot = queryClient.getQueryData<PipelineEntry[]>(queryKey);
        const optimistic = (snapshot ?? entries).map((e) =>
            e.id === entry.id ? { ...e, stage_id: targetStageId, stage: targetStage } : e,
        );
        queryClient.setQueryData(queryKey, optimistic);

        move.mutate(
            { id: entry.id, payload: { stage_id: targetStageId } },
            {
                onError: (err) => {
                    queryClient.setQueryData(queryKey, snapshot);
                    setErrorMsg(toApiError(err).detail);
                },
                onSuccess: () => {
                    setErrorMsg(null);
                },
            },
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveEntry(null)}
        >
            {errorMsg && <div className={styles.errorBanner}>{errorMsg}</div>}
            <div className={styles.board}>
                {stages.map((stage) => (
                    <KanbanColumn
                        key={stage.id}
                        stage={stage}
                        entries={grouped.get(stage.id) ?? []}
                    />
                ))}
            </div>
            <DragOverlay>
                {activeEntry && (
                    <div className={styles.dragOverlay}>
                        <KanbanCard entry={activeEntry} />
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
};

export default KanbanBoard;
