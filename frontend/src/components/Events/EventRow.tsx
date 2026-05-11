import React from 'react';
import { Link } from 'react-router-dom';
import { getEventStatusConfig } from '../../constants/eventStatuses';
import { eventStatusToDisplayId, formatDateRange } from '../../lib/format';
import type { EventStatus } from '../../types/api';
import styles from './EventRow.module.css';

export interface EventRowData {
    id: number;
    name: string;
    start_date: string | null;
    end_date: string | null;
    status: EventStatus;
    owner_name: string | null;
    owner_initials: string;
    partners_count: number | null;
}

interface EventRowProps {
    event: EventRowData;
}

const EventRow: React.FC<EventRowProps> = ({ event }) => {
    const statusConfig = getEventStatusConfig(eventStatusToDisplayId(event.status));
    const dateLabel = formatDateRange(event.start_date, event.end_date);
    const partners = event.partners_count ?? 0;

    return (
        <div className={styles.row}>
            <div className={styles.checkboxCell}>
                <input type="checkbox" className={styles.checkbox} />
            </div>

            <Link
                to={`/events/${event.id}`}
                className={styles.nameCell}
                style={{ textDecoration: 'none', color: 'inherit' }}
            >
                <div className={styles.initial}>
                    {event.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.nameInfo}>
                    <div className={styles.eventName}>{event.name}</div>
                    <div className={styles.eventDate}>{dateLabel}</div>
                </div>
            </Link>

            <div className={styles.typeCell}>
                <span className={styles.eventDate}>{dateLabel}</span>
            </div>

            <div className={styles.coordinatorCell}>
                <div className={styles.coordinatorAvatar}>
                    <span className={styles.avatarInitial}>
                        {event.owner_initials || '?'}
                    </span>
                </div>
                <span className={styles.coordinatorName}>
                    {event.owner_name ?? '—'}
                </span>
            </div>

            <div className={styles.partnersCell}>
                <div className={styles.partnerAvatars}>
                    {partners === 0 ? (
                        <span className={styles.coordinatorName}>0</span>
                    ) : (
                        <>
                            {Array.from({ length: Math.min(partners, 3) }).map((_, i) => (
                                <div
                                    key={i}
                                    className={styles.partnerAvatar}
                                    style={{ marginLeft: i > 0 ? '-8px' : '0' }}
                                >
                                    <span className={styles.partnerInitial}>
                                        {String.fromCharCode(65 + i)}
                                    </span>
                                </div>
                            ))}
                            {partners > 3 && (
                                <div
                                    className={styles.partnerAvatar}
                                    style={{ marginLeft: '-8px' }}
                                >
                                    <span className={styles.partnerInitial}>
                                        +{partners - 3}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className={styles.statusCell}>
                {statusConfig && (
                    <span
                        className={styles.statusBadge}
                        style={{
                            backgroundColor: statusConfig.bgColor,
                            color: statusConfig.textColor,
                            border: `1px solid ${statusConfig.textColor}`,
                        }}
                    >
                        {statusConfig.label}
                    </span>
                )}
            </div>
        </div>
    );
};

export default EventRow;
