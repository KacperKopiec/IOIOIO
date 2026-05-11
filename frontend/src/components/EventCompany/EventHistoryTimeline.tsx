import React from 'react';
import { Calendar, Mail, MessageSquare, Phone, UserPlus } from 'lucide-react';
import type { Activity, ActivityType } from '../../types/api';
import styles from './EventHistoryTimeline.module.css';

interface EventHistoryTimelineProps {
    eventName: string;
    activities: Activity[];
    isLoading: boolean;
}

const ICON_FOR_TYPE: Record<ActivityType, React.ComponentType<{ size?: number }>> = {
    note: MessageSquare,
    meeting: UserPlus,
    email: Mail,
    phone_call: Phone,
    follow_up: MessageSquare,
    task: Calendar,
};

function formatDateLine(activity: Activity): string {
    const iso =
        activity.activity_date ?? activity.due_date ?? activity.created_at;
    if (!iso) return '';
    const date = new Date(iso);
    return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

const EventHistoryTimeline: React.FC<EventHistoryTimelineProps> = ({
    eventName,
    activities,
    isLoading,
}) => {
    const visible = activities.slice(0, 6);

    return (
        <div className={styles.card}>
            <h3 className={styles.title}>Historia: {eventName}</h3>

            {isLoading && <div className={styles.empty}>Ładowanie historii…</div>}
            {!isLoading && visible.length === 0 && (
                <div className={styles.empty}>
                    Brak aktywności dla tej firmy w wydarzeniu.
                </div>
            )}

            {visible.length > 0 && (
                <div className={styles.timeline}>
                    {visible.map((activity, idx) => {
                        const Icon = ICON_FOR_TYPE[activity.activity_type];
                        return (
                            <div key={activity.id} className={styles.item}>
                                <span
                                    className={`${styles.icon} ${idx === 0 ? styles.iconCurrent : styles.iconPast
                                        }`}
                                >
                                    <Icon size={14} />
                                </span>
                                <div className={styles.itemTitle}>{activity.subject}</div>
                                <div className={styles.itemMeta}>{formatDateLine(activity)}</div>
                                {activity.description && (
                                    <div className={styles.itemDesc}>{activity.description}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <button type="button" className={styles.moreBtn} disabled>
                Pokaż pełną historię
            </button>
        </div>
    );
};

export default EventHistoryTimeline;
