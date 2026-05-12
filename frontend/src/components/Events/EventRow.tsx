import React from 'react';
import type { EventTypeId } from '../../constants/eventTypes';
import type { EventStatusId } from '../../constants/eventStatuses';
import { getEventTypeConfig } from '../../constants/eventTypes';
import { getEventStatusConfig } from '../../constants/eventStatuses';
import styles from './EventRow.module.css';

interface EventRowProps {
    id: number;
    name: string;
    date: string;
    type: EventTypeId;
    coordinator: string;
    partners: number;
    status: EventStatusId;
}

const EventRow: React.FC<EventRowProps> = ({
    name,
    date,
    type,
    coordinator,
    partners,
    status
}) => {
    const typeConfig = getEventTypeConfig(type);
    const statusConfig = getEventStatusConfig(status);

    return (
        <div className={styles.row}>
            <div className={styles.checkboxCell}>
                <input type="checkbox" className={styles.checkbox} />
            </div>

            <div className={styles.nameCell}>
                <div className={styles.initial}>A</div>
                <div className={styles.nameInfo}>
                    <div className={styles.eventName}>{name}</div>
                    <div className={styles.eventDate}>{date}</div>
                </div>
            </div>

            <div className={styles.typeCell}>
                {typeConfig && (
                    <span
                        className={styles.typeBadge}
                        style={{
                            backgroundColor: typeConfig.bgColor,
                            color: typeConfig.textColor
                        }}
                    >
                        {typeConfig.label}
                    </span>
                )}
            </div>

            <div className={styles.coordinatorCell}>
                <div className={styles.coordinatorAvatar}>
                    <span className={styles.avatarInitial}>K</span>
                </div>
                <span className={styles.coordinatorName}>{coordinator}</span>
            </div>

            <div className={styles.partnersCell}>
                <div className={styles.partnerAvatars}>
                    {Array.from({ length: Math.min(partners, 3) }).map((_, i) => (
                        <div
                            key={i}
                            className={styles.partnerAvatar}
                            style={{
                                marginLeft: i > 0 ? '-8px' : '0'
                            }}
                        >
                            <span className={styles.partnerInitial}>
                                {String.fromCharCode(65 + i)}
                            </span>
                        </div>
                    ))}
                    {partners > 3 && (
                        <div className={styles.partnerAvatar} style={{ marginLeft: '-8px' }}>
                            <span className={styles.partnerInitial}>+{partners - 3}</span>
                        </div>
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
                            border: `1px solid ${statusConfig.textColor}`
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
