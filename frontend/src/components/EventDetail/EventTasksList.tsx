import React, { useState } from 'react';
import { CheckCircle, Circle, Plus } from 'lucide-react';
import type { Activity } from '../../types/api';
import { useUpdateActivity } from '../../hooks/api/activities';
import AddActivityModal from '../modals/AddActivityModal';
import EditActivityModal from '../modals/EditActivityModal';
import styles from './EventTasksList.module.css';

interface EventTasksListProps {
    activities: Activity[];
    isLoading: boolean;
    eventId?: number;
    title?: string;
    emptyText?: string;
    defaults?: {
        companyId?: number | null;
        eventId?: number | null;
        pipelineEntryId?: number | null;
        contactId?: number | null;
    };
}

const ACTION_TYPES = new Set(['task', 'follow_up']);

const TYPE_LABEL: Record<string, string> = {
    task: 'zadanie',
    follow_up: 'follow-up',
};

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

const EventTasksList: React.FC<EventTasksListProps> = ({
    activities,
    isLoading,
    eventId,
    title = 'Moje zadania',
    emptyText = 'Brak zadań przypisanych do tego wydarzenia.',
    defaults,
}) => {
    const [addOpen, setAddOpen] = useState(false);
    const [edited, setEdited] = useState<Activity | null>(null);

    const updateActivity = useUpdateActivity();
    const addDefaults = defaults ?? { eventId };
    const canAdd = Object.values(addDefaults).some((value) => value != null);
    const visible = activities
        .filter((activity) => ACTION_TYPES.has(activity.activity_type))
        .sort((a, b) => {
            if (a.completed_at && !b.completed_at) return 1;
            if (!a.completed_at && b.completed_at) return -1;
            const aDue = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
            const bDue = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
            return aDue - bDue;
        })
        .slice(0, 8);

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
                <h2 className={styles.title}>{title}</h2>
                {canAdd && (
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
                        {emptyText}
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
                                    <button
                                        type="button"
                                        className={`${styles.taskTitle} ${done ? styles.taskTitleDone : ''
                                            }`}
                                        onClick={() => setEdited(activity)}
                                    >
                                        {activity.subject}
                                    </button>
                                    <div className={`${styles.taskMeta} ${done ? styles.taskMetaDone : ''}`}>
                                        {TYPE_LABEL[activity.activity_type] ?? activity.activity_type}
                                        {activity.description ? ` · ${activity.description}` : ''}
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

            {canAdd && (
                <AddActivityModal
                    open={addOpen}
                    onClose={() => setAddOpen(false)}
                    defaultType="follow_up"
                    mode="follow_up"
                    defaults={addDefaults}
                />
            )}
            <EditActivityModal
                open={edited != null}
                activity={edited}
                onClose={() => setEdited(null)}
            />
        </section>
    );
};

export default EventTasksList;
