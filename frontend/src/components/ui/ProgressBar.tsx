import React from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
    value: number;
    tone?: 'brand' | 'success' | 'warning' | 'danger';
    leftLabel?: React.ReactNode;
    rightLabel?: React.ReactNode;
}

const TONE_CLASS: Record<NonNullable<ProgressBarProps['tone']>, string> = {
    brand: '',
    success: styles.toneSuccess,
    warning: styles.toneWarning,
    danger: styles.toneDanger,
};

const ProgressBar: React.FC<ProgressBarProps> = ({
    value,
    tone = 'brand',
    leftLabel,
    rightLabel,
}) => {
    const clamped = Math.max(0, Math.min(value, 1));
    return (
        <div className={styles.wrap}>
            <div className={styles.track}>
                <div
                    className={`${styles.fill} ${TONE_CLASS[tone]}`}
                    style={{ width: `${clamped * 100}%` }}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={1}
                    aria-valuenow={clamped}
                />
            </div>
            {(leftLabel || rightLabel) && (
                <div className={styles.label}>
                    <span>{leftLabel}</span>
                    <span>{rightLabel}</span>
                </div>
            )}
        </div>
    );
};

export default ProgressBar;
