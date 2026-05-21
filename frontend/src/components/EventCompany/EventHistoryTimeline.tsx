import React, { useState } from 'react';
import { Calendar, Mail, MessageSquare, Phone, Plus, UserPlus } from 'lucide-react';
import type { Activity, ActivityType } from '../../types/api';
import AddActivityModal from '../modals/AddActivityModal';
import EditActivityModal from '../modals/EditActivityModal';
import Modal from '../ui/Modal';
import styles from './EventHistoryTimeline.module.css';

interface EventHistoryTimelineProps {
    eventName: string;
    activities: Activity[];
    isLoading: boolean;
    companyId: number;
    eventId: number;
    pipelineEntryId?: number | null;
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
    companyId,
    eventId,
    pipelineEntryId,
}) => {
    const [fullOpen, setFullOpen] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [edited, setEdited] = useState<Activity | null>(null);
    const visible = activities.slice(0, 6);

    const renderItem = (activity: Activity, idx: number, isFull: boolean) => {
        const Icon = ICON_FOR_TYPE[activity.activity_type];
        const className = isFull ? styles.fullItem : styles.item;
        const iconClass = `${styles.icon} ${
            !isFull && idx === 0 ? styles.iconCurrent : styles.iconPast
        }`;
        return (
            <button
                key={activity.id}
                type="button"
                className={`${className} ${styles.itemBtn}`}
                onClick={() => setEdited(activity)}
                title="Edytuj wpis"
            >
                <span className={iconClass}>
                    <Icon size={14} />
                </span>
                <div className={isFull ? styles.fullBody : styles.itemBody}>
                    <div className={styles.itemTitle}>{activity.subject}</div>
                    <div className={styles.itemMeta}>{formatDateLine(activity)}</div>
                    {activity.description && (
                        <div className={styles.itemDesc}>{activity.description}</div>
                    )}
                </div>
            </button>
        );
    };

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.title}>Historia: {eventName}</h3>
                <button
                    type="button"
                    className={styles.addBtn}
                    onClick={() => setAddOpen(true)}
                >
                    <Plus size={14} />
                    <span>Dodaj</span>
                </button>
            </div>

            {isLoading && <div className={styles.empty}>Ładowanie historii…</div>}
            {!isLoading && visible.length === 0 && (
                <div className={styles.empty}>
                    Brak aktywności dla tej firmy w wydarzeniu.
                </div>
            )}

            {visible.length > 0 && (
                <div className={styles.timeline}>
                    {visible.map((activity, idx) => renderItem(activity, idx, false))}
                </div>
            )}

            <button
                type="button"
                className={styles.moreBtn}
                onClick={() => setFullOpen(true)}
                disabled={activities.length === 0}
            >
                Pokaż pełną historię
            </button>
            <Modal
                open={fullOpen}
                onClose={() => setFullOpen(false)}
                title={`Pełna historia: ${eventName}`}
                size="large"
            >
                <div className={styles.fullList}>
                    {activities.length === 0 ? (
                        <div className={styles.empty}>Brak aktywności.</div>
                    ) : (
                        activities.map((activity, idx) => renderItem(activity, idx, true))
                    )}
                </div>
            </Modal>

            <AddActivityModal
                open={addOpen}
                onClose={() => setAddOpen(false)}
                mode="history"
                defaultType="meeting"
                defaults={{
                    companyId,
                    eventId,
                    pipelineEntryId: pipelineEntryId ?? null,
                }}
            />
            <EditActivityModal
                open={edited != null}
                activity={edited}
                onClose={() => setEdited(null)}
            />
        </div>
    );
};

export default EventHistoryTimeline;
