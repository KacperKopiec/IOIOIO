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
import { useMovePipelineEntry, useUpdatePipelineEntry } from '../../hooks/api/pipeline';
import { toApiError } from '../../lib/api';
import type { PipelineEntry, PipelineStage } from '../../types/api';
import Modal from '../ui/Modal';
import styles from './KanbanBoard.module.css';

interface KanbanBoardProps {
    eventId: number;
    stages: PipelineStage[];
    entries: PipelineEntry[];
    readOnly?: boolean;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
    eventId,
    stages,
    entries,
    readOnly = false,
}) => {
    const queryClient = useQueryClient();
    const move = useMovePipelineEntry();
    const updateEntry = useUpdatePipelineEntry();

    const [activeEntry, setActiveEntry] = useState<PipelineEntry | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [rejectPrompt, setRejectPrompt] = useState<{
        entry: PipelineEntry;
        targetStage: PipelineStage;
    } | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [editRejection, setEditRejection] = useState<PipelineEntry | null>(null);
    const [editReason, setEditReason] = useState('');

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
        if (readOnly) return;
        const entry = event.active.data.current?.entry as PipelineEntry | undefined;
        if (entry) setActiveEntry(entry);
    }

    function performMove(
        entry: PipelineEntry,
        targetStage: PipelineStage,
        rejectionReason?: string | null,
    ) {
        const queryKey = eventKeys.pipeline(eventId);
        const snapshot = queryClient.getQueryData<PipelineEntry[]>(queryKey);
        const optimistic = (snapshot ?? entries).map((e) =>
            e.id === entry.id
                ? {
                      ...e,
                      stage_id: targetStage.id,
                      stage: targetStage,
                      rejection_reason:
                          rejectionReason !== undefined && rejectionReason !== null
                              ? rejectionReason
                              : e.rejection_reason,
                  }
                : e,
        );
        queryClient.setQueryData(queryKey, optimistic);

        move.mutate(
            {
                id: entry.id,
                payload: {
                    stage_id: targetStage.id,
                    ...(rejectionReason ? { rejection_reason: rejectionReason } : {}),
                },
            },
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

    function handleDragEnd(event: DragEndEvent) {
        setActiveEntry(null);
        if (readOnly) return;
        const { active, over } = event;
        if (!over) return;

        const entry = active.data.current?.entry as PipelineEntry | undefined;
        const targetStageId = over.data.current?.stageId as number | undefined;
        if (!entry || targetStageId == null || entry.stage_id === targetStageId) {
            return;
        }

        const targetStage = stages.find((s) => s.id === targetStageId);
        if (!targetStage) return;

        if (targetStage.outcome === 'lost') {
            setRejectReason(entry.rejection_reason ?? '');
            setRejectPrompt({ entry, targetStage });
            return;
        }

        performMove(entry, targetStage);
    }

    function confirmReject() {
        if (!rejectPrompt) return;
        performMove(
            rejectPrompt.entry,
            rejectPrompt.targetStage,
            rejectReason.trim() || null,
        );
        setRejectPrompt(null);
        setRejectReason('');
    }

    function cancelReject() {
        setRejectPrompt(null);
        setRejectReason('');
    }

    function openEditRejection(entry: PipelineEntry) {
        setEditRejection(entry);
        setEditReason(entry.rejection_reason ?? '');
    }

    function cancelEditRejection() {
        setEditRejection(null);
        setEditReason('');
    }

    function saveEditRejection() {
        if (!editRejection) return;
        const value = editReason.trim();
        const queryKey = eventKeys.pipeline(eventId);
        const snapshot = queryClient.getQueryData<PipelineEntry[]>(queryKey);
        const optimistic = (snapshot ?? entries).map((e) =>
            e.id === editRejection.id ? { ...e, rejection_reason: value || null } : e,
        );
        queryClient.setQueryData(queryKey, optimistic);

        updateEntry.mutate(
            {
                id: editRejection.id,
                payload: { rejection_reason: value || null },
            },
            {
                onError: (err) => {
                    queryClient.setQueryData(queryKey, snapshot);
                    setErrorMsg(toApiError(err).detail);
                },
                onSuccess: () => setErrorMsg(null),
            },
        );
        cancelEditRejection();
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
            {readOnly && (
                <div className={styles.errorBanner}>
                    Podgląd tylko do odczytu. Lejkiem zarządza koordynator.
                </div>
            )}
            <div className={styles.board}>
                {stages.map((stage) => (
                    <KanbanColumn
                        key={stage.id}
                        stage={stage}
                        entries={grouped.get(stage.id) ?? []}
                        onEditRejection={readOnly ? undefined : openEditRejection}
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
            <Modal
                open={editRejection != null}
                title="Edytuj powód odrzucenia"
                onClose={cancelEditRejection}
                footer={
                    <div className={styles.rejectActions}>
                        <button
                            type="button"
                            className={styles.rejectCancel}
                            onClick={cancelEditRejection}
                        >
                            Anuluj
                        </button>
                        <button
                            type="button"
                            className={styles.rejectConfirm}
                            onClick={saveEditRejection}
                        >
                            Zapisz
                        </button>
                    </div>
                }
            >
                <div className={styles.rejectBody}>
                    <p className={styles.rejectHint}>
                        Firma: <strong>{editRejection?.company?.name ?? ''}</strong>.
                        Zaktualizuj powód odrzucenia — wartość trafia od razu do raportów
                        i karty firmy.
                    </p>
                    <textarea
                        className={styles.rejectTextarea}
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        placeholder="Brak budżetu, decyzja przesunięta na kolejną edycję, …"
                        rows={4}
                        autoFocus
                    />
                </div>
            </Modal>
            <Modal
                open={rejectPrompt != null}
                title="Powód odrzucenia"
                onClose={cancelReject}
                footer={
                    <div className={styles.rejectActions}>
                        <button
                            type="button"
                            className={styles.rejectCancel}
                            onClick={cancelReject}
                        >
                            Anuluj
                        </button>
                        <button
                            type="button"
                            className={styles.rejectConfirm}
                            onClick={confirmReject}
                        >
                            Zatwierdź
                        </button>
                    </div>
                }
            >
                <div className={styles.rejectBody}>
                    <p className={styles.rejectHint}>
                        Firma: <strong>{rejectPrompt?.entry.company?.name ?? ''}</strong>.
                        Krótko opisz, dlaczego nie doszło do współpracy — zostanie to
                        zapisane w lejku i pojawi się w raportach.
                    </p>
                    <textarea
                        className={styles.rejectTextarea}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="np. Brak budżetu na tę edycję, decyzja przesunięta na 2027."
                        rows={4}
                        autoFocus
                    />
                </div>
            </Modal>
        </DndContext>
    );
};

export default KanbanBoard;
