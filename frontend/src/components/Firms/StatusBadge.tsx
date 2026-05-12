import React from 'react';
import type { FirmStatusId } from '../../constants/firmStatus';
import { getStatusConfig } from '../../constants/firmStatus';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
    statusId: FirmStatusId;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ statusId }) => {
    const statusConfig = getStatusConfig(statusId);

    if (!statusConfig) {
        return null;
    }

    return (
        <div
            className={styles.badge}
            style={{
                backgroundColor: statusConfig.bgColor,
                color: statusConfig.textColor
            }}
        >
            <span
                className={styles.dot}
                style={{ backgroundColor: statusConfig.dotColor }}
                aria-hidden="true"
            />
            <span className={styles.label}>{statusConfig.label}</span>
        </div>
    );
};

export default StatusBadge;
