import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    padding?: 'default' | 'compact' | 'none';
    flat?: boolean;
}

export const Card: React.FC<CardProps> = ({
    padding = 'default',
    flat = false,
    className,
    children,
    ...rest
}) => {
    const classes = [
        styles.card,
        padding === 'default' ? styles.padded : '',
        padding === 'compact' ? styles.paddedCompact : '',
        flat ? styles.flat : '',
        className ?? '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classes} {...rest}>
            {children}
        </div>
    );
};

interface CardHeaderProps {
    title: string;
    icon?: React.ReactNode;
    subtitle?: React.ReactNode;
    action?: React.ReactNode;
    border?: boolean;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
    title,
    icon,
    subtitle,
    action,
    border = true,
}) => {
    return (
        <header
            className={`${styles.header} ${border ? '' : styles.headerNoBorder}`}
        >
            <div className={styles.titleGroup}>
                {icon && <span className={styles.titleIcon}>{icon}</span>}
                <div>
                    <h2 className={styles.title}>{title}</h2>
                    {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
                </div>
            </div>
            {action}
        </header>
    );
};

export default Card;
