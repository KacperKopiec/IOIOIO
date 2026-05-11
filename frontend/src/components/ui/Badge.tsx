import React from 'react';
import styles from './Badge.module.css';

export type BadgeTone =
    | 'brand'
    | 'brandSolid'
    | 'neutral'
    | 'success'
    | 'successSolid'
    | 'warning'
    | 'danger'
    | 'dangerSolid'
    | 'info';

interface BadgeProps {
    tone?: BadgeTone;
    size?: 'sm' | 'md' | 'lg';
    pill?: boolean;
    uppercase?: boolean;
    withDot?: boolean;
    icon?: React.ReactNode;
    children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({
    tone = 'neutral',
    size = 'md',
    pill = false,
    uppercase = false,
    withDot = false,
    icon,
    children,
}) => {
    const classes = [
        styles.badge,
        styles[size],
        styles[tone],
        pill ? styles.pill : '',
        uppercase ? styles.uppercase : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <span className={classes}>
            {withDot && <span className={styles.dot} aria-hidden />}
            {icon}
            {children}
        </span>
    );
};

export default Badge;
