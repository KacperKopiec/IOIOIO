import React from 'react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
    title?: React.ReactNode;
    children: React.ReactNode;
    compact?: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    children,
    compact = false,
}) => {
    return (
        <div className={`${styles.wrap} ${compact ? styles.compact : ''}`}>
            {title && <div className={styles.title}>{title}</div>}
            <div>{children}</div>
        </div>
    );
};

export default EmptyState;
