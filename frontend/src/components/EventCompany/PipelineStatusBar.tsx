import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Edit3, Loader2 } from 'lucide-react';
import { useUpdatePipelineEntry } from '../../hooks/api/pipeline';
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
    const [notesExpanded, setNotesExpanded] = useState(false);
    const [notesEditing, setNotesEditing] = useState(false);
    const [notesText, setNotesText] = useState('');
    const updateNotes = useUpdatePipelineEntry();

    const startEdit = () => {
        setNotesText(entry?.notes ?? '');
        setNotesEditing(true);
        setNotesExpanded(true);
    };

    const saveNotes = () => {
        if (entry) {
            updateNotes.mutate(
                { id: entry.id, payload: { notes: notesText || null } },
                {
                    onSuccess: () => {
                        setNotesEditing(false);
                    },
                },
            );
        }
    };

    const cancelEdit = () => {
        setNotesEditing(false);
    };

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
            {entry && (entry.notes || notesEditing) && (
                <div className={styles.notesSection}>
                    <button
                        type="button"
                        className={styles.notesToggle}
                        onClick={() => {
                            setNotesExpanded(!notesExpanded);
                            if (!notesExpanded && !notesEditing) startEdit();
                        }}
                    >
                        <Edit3 size={14} />
                        <span>Notatka</span>
                        {notesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {notesExpanded && (
                        <div className={styles.notesContent}>
                            {notesEditing ? (
                                <div className={styles.notesEdit}>
                                    <textarea
                                        className={styles.notesTextarea}
                                        value={notesText}
                                        onChange={(e) => setNotesText(e.target.value)}
                                        placeholder="Wpisz notatkę..."
                                        rows={4}
                                    />
                                    <div className={styles.notesActions}>
                                        <button
                                            type="button"
                                            className={styles.notesCancel}
                                            onClick={cancelEdit}
                                            disabled={updateNotes.isPending}
                                        >
                                            Anuluj
                                        </button>
                                        <button
                                            type="button"
                                            className={styles.notesSave}
                                            onClick={saveNotes}
                                            disabled={updateNotes.isPending}
                                        >
                                            {updateNotes.isPending ? (
                                                <Loader2 size={14} className={styles.spinner} />
                                            ) : (
                                                'Zapisz'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div onClick={startEdit} className={styles.notesDisplay}>
                                    {entry.notes}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
            {entry && !entry.notes && !notesEditing && (
                <div className={styles.notesSection}>
                    <button
                        type="button"
                        className={styles.notesToggle}
                        onClick={startEdit}
                    >
                        <Edit3 size={14} />
                        <span>Dodaj notatkę</span>
                    </button>
                </div>
            )}
        </section>
    );
};

export default PipelineStatusBar;
