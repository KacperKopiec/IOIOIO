import React, { useState } from 'react';
import { CheckCircle, Circle, Plus } from 'lucide-react';
import type { Activity } from '../../types/api';
import { useUpdateActivity } from '../../hooks/api/activities';
import AddActivityModal from '../modals/AddActivityModal';
import styles from './EventTasksList.module.css';

interface EventTasksListProps {
    activities: Activity[];
    isLoading: boolean;
    eventId?: number;
}

function badgeFor(activity: Activity) {
    if (activity.completed_at) {
        return { kind: 'done' as const, label: 'gotowe' };
    }
    if (!activity.due_date) {
        return { kind: 'upcoming' as const, label: 'do zaplanowania' };
    }
    const due = new Date(activity.due_date);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (24 * 60 * 60_000));

    if (diffMs < 0) {
        return {
            kind: 'overdue' as const,
            label:
                diffDays === 0
                    ? 'dzisiaj'
                    : `zaległe ${Math.abs(diffDays)}d`,
        };
    }
    if (diffDays === 0) return { kind: 'upcoming' as const, label: 'dzisiaj' };
    if (diffDays === 1) return { kind: 'upcoming' as const, label: 'jutro' };
    if (diffDays <= 7) {
        return { kind: 'upcoming' as const, label: `za ${diffDays}d` };
    }
    return {
        kind: 'upcoming' as const,
        label: due.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' }),
    };
}

const EventTasksList: React.FC<EventTasksListProps> = ({ activities, isLoading, eventId }) => {
    const [addOpen, setAddOpen] = useState(false);

    const updateActivity = useUpdateActivity();
    const visible = activities.slice(0, 8);

    const toggleDone = (activity: Activity) => {
        const newCompletedAt = activity.completed_at ? null : new Date().toISOString();
        updateActivity.mutate({
            id: activity.id,
            payload: { completed_at: newCompletedAt },
        });
    };

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>Moje zadania</h2>
                {eventId && (
                    <button type="button" className={styles.addBtn} onClick={() => setAddOpen(true)}>
                        <Plus size={14} />
                        <span>Dodaj</span>
                    </button>
                )}
            </div>

            <div className={styles.card}>
                {isLoading && (
                    <div className={styles.empty}>Ładowanie zadań…</div>
                )}
                {!isLoading && visible.length === 0 && (
                    <div className={styles.empty}>
                        Brak zadań przypisanych do tego wydarzenia.
                    </div>
                )}
                {visible.map((activity) => {
                    const done = activity.completed_at != null;
                    const badge = badgeFor(activity);
                    const badgeClass =
                        badge.kind === 'overdue'
                            ? styles.badgeOverdue
                            : badge.kind === 'done'
                                ? styles.badgeDone
                                : styles.badgeUpcoming;
                    return (
                        <div key={activity.id} className={styles.row}>
                            <div className={styles.left}>
                                <button
                                    type="button"
                                    className={styles.checkBtn}
                                    onClick={() => toggleDone(activity)}
                                    disabled={updateActivity.isPending}
                                >
                                    {done ? (
                                        <CheckCircle size={20} className={styles.checkIconDone} />
                                    ) : (
                                        <Circle size={20} className={styles.checkIcon} />
                                    )}
                                </button>
                                <div>
                                    <div
                                        className={`${styles.taskTitle} ${done ? styles.taskTitleDone : ''
                                            }`}
                                    >
                                        {activity.subject}
                                    </div>
                                </div>
                            </div>
                            <span className={`${styles.badge} ${badgeClass}`}>
                                {badge.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {eventId && (
                <AddActivityModal
                    open={addOpen}
                    onClose={() => setAddOpen(false)}
                    defaults={{ eventId }}
                />
            )}
        </section>
    );
};

export default EventTasksList;