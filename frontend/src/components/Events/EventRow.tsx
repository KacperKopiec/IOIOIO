import React from 'react';
import { Link } from 'react-router-dom';
import TagBadge from '../Firms/TagBadge';
import { getEventStatusConfig } from '../../constants/eventStatuses';
import { eventStatusToDisplayId, formatDateRange } from '../../lib/format';
import type { EventStatus, Tag } from '../../types/api';
import styles from './EventRow.module.css';

export interface EventRowData {
    id: number;
    name: string;
    start_date: string | null;
    end_date: string | null;
    status: EventStatus;
    owner_name: string | null;
    tags: Tag[];
    partners_count: number;
    target_partners_count: number | null;
}

interface EventRowProps {
    event: EventRowData;
}

const EventRow: React.FC<EventRowProps> = ({ event }) => {
    const statusConfig = getEventStatusConfig(eventStatusToDisplayId(event.status));
    const dateLabel = formatDateRange(event.start_date, event.end_date);
    const partnersLabel = event.target_partners_count
        ? `${event.partners_count} / ${event.target_partners_count}`
        : `${event.partners_count}`;

    return (
        <div className={styles.row}>
            <div className={styles.checkboxCell}>
                <input type="checkbox" className={styles.rowCheckbox} />
            </div>

            <Link
                to={`/events/${event.id}`}
                className={styles.nameCell}
                style={{ textDecoration: 'none', color: 'inherit' }}
            >
                <div className={styles.eventName}>{event.name}</div>
                <div className={styles.eventDate}>{dateLabel}</div>
            </Link>

            <div className={styles.tagsCell}>
                <div className={styles.tagsList}>
                    {event.tags.length === 0 ? (
                        <span className={styles.emptyValue}>—</span>
                    ) : (
                        event.tags.map((tag) => (
                            <TagBadge key={tag.id} tagId={tag.name} />
                        ))
                    )}
                </div>
            </div>

            <div className={styles.coordinatorCell}>
                <span className={styles.coordinatorName}>
                    {event.owner_name ?? '—'}
                </span>
            </div>

            <div className={styles.statusCell}>
                {statusConfig && (
                    <span
                        className={styles.statusBadge}
                        style={{
                            backgroundColor: statusConfig.bgColor,
                            color: statusConfig.textColor,
                        }}
                    >
                        {statusConfig.label}
                    </span>
                )}
            </div>

            <div className={styles.partnersCell}>
                <span className={styles.partnersValue}>{partnersLabel}</span>
            </div>
        </div>
    );
};

export default EventRow;
