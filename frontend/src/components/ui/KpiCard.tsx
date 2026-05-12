import React from 'react';
import styles from './KpiCard.module.css';

export type KpiTone =
    | 'brand'
    | 'success'
    | 'warning'
    | 'danger'
    | 'indigo';

interface KpiCardProps {
    icon?: React.ReactNode;
    tone?: KpiTone;
    label: React.ReactNode;
    value: React.ReactNode;
    sub?: React.ReactNode;
    subAccent?: boolean;
}

const TONE_CLASS: Record<KpiTone, string> = {
    brand: styles.toneBrand,
    success: styles.toneSuccess,
    warning: styles.toneWarning,
    danger: styles.toneDanger,
    indigo: styles.toneIndigo,
};

const KpiCard: React.FC<KpiCardProps> = ({
    icon,
    tone = 'brand',
    label,
    value,
    sub,
    subAccent = false,
}) => {
    return (
        <div className={styles.card}>
            {icon && (
                <span className={`${styles.iconWrap} ${TONE_CLASS[tone]}`}>
                    {icon}
                </span>
            )}
            <div className={styles.body}>
                <span className={styles.label}>{label}</span>
                <span className={styles.value}>{value}</span>
                {sub && (
                    <span
                        className={`${styles.sub} ${subAccent ? styles.subAccent : ''
                            }`}
                    >
                        {sub}
                    </span>
                )}
            </div>
        </div>
    );
};

export default KpiCard;
