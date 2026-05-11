import React from 'react';
import type { Activity } from '../../types/api';
import styles from './EventTasksList.module.css';

interface EventTasksListProps {
    activities: Activity[];
    isLoading: boolean;
}

const ACTIVITY_TYPE_LABELS: Record<Activity['activity_type'], string> = {
    note: 'Notatka',
    meeting: 'Spotkanie',
    email: 'E-mail',
    phone_call: 'Telefon',
    follow_up: 'Follow-up',
    task: 'Zadanie',
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

const EventTasksList: React.FC<EventTasksListProps> = ({ activities, isLoading }) => {
    const visible = activities.slice(0, 8);
    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>Moje zadania</h2>
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
                                <input
                                    type="checkbox"
                                    className={styles.checkbox}
                                    checked={done}
                                    readOnly
                                />
                                <div>
                                    <div
                                        className={`${styles.taskTitle} ${done ? styles.taskTitleDone : ''
                                            }`}
                                    >
                                        {activity.subject}
                                    </div>
                                    <div
                                        className={`${styles.taskMeta} ${done ? styles.taskMetaDone : ''
                                            }`}
                                    >
                                        Kategoria: {ACTIVITY_TYPE_LABELS[activity.activity_type]}
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
        </section>
    );
};

export default EventTasksList;
