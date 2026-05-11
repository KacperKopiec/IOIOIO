import React from 'react';
import { Check, Mail, MessageSquare, Phone, UserPlus } from 'lucide-react';
import type { ActivityType, RecentActivityBrief } from '../../types/api';
import styles from './ActivityFeed.module.css';

interface ActivityFeedProps {
    activities: RecentActivityBrief[];
    isLoading: boolean;
}

const ICON_BY_TYPE: Record<
    ActivityType,
    { icon: React.ComponentType<{ size?: number }>; tone: 'green' | 'blue' | 'slate' }
> = {
    note: { icon: MessageSquare, tone: 'slate' },
    meeting: { icon: UserPlus, tone: 'blue' },
    email: { icon: Mail, tone: 'blue' },
    phone_call: { icon: Phone, tone: 'green' },
    follow_up: { icon: MessageSquare, tone: 'blue' },
    task: { icon: Check, tone: 'green' },
};

function formatWhen(iso: string | null): string {
    if (!iso) return '—';
    const date = new Date(iso);
    const now = new Date();
    const sameDay =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
        date.getFullYear() === yesterday.getFullYear() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getDate() === yesterday.getDate();

    const hhmm = date.toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
    });
    if (sameDay) return `Dzisiaj, ${hhmm}`;
    if (isYesterday) return `Wczoraj, ${hhmm}`;
    return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, isLoading }) => {
    const visible = activities.slice(0, 5);
    return (
        <div className={styles.card}>
            <h3 className={styles.title}>Ostatnia aktywność</h3>
            <div className={styles.timeline}>
                {isLoading && <div className={styles.empty}>Ładowanie…</div>}
                {!isLoading && visible.length === 0 && (
                    <div className={styles.empty}>Brak ostatnich aktywności.</div>
                )}
                {visible.map((act) => {
                    const config = ICON_BY_TYPE[act.activity_type];
                    const Icon = config.icon;
                    const toneClass =
                        config.tone === 'green'
                            ? styles.iconGreen
                            : config.tone === 'blue'
                                ? styles.iconBlue
                                : styles.iconSlate;
                    return (
                        <div key={act.id} className={styles.item}>
                            <span className={`${styles.iconWrap} ${toneClass}`}>
                                <Icon size={12} />
                            </span>
                            <div className={styles.body}>
                                <div className={styles.itemTitle}>
                                    {act.subject}
                                    {act.company_name ? ` – ${act.company_name}` : ''}
                                </div>
                                <div className={styles.itemSub}>
                                    {formatWhen(act.activity_date)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ActivityFeed;
