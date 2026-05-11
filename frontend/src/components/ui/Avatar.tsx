import React from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
    initials: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    tone?: 'brand' | 'neutral' | 'info';
    square?: boolean;
    title?: string;
}

const TONE_CLASS: Record<NonNullable<AvatarProps['tone']>, string> = {
    brand: '',
    neutral: styles.toneNeutral,
    info: styles.toneInfo,
};

const Avatar: React.FC<AvatarProps> = ({
    initials,
    size = 'md',
    tone = 'brand',
    square = false,
    title,
}) => {
    return (
        <span
            className={`${styles.avatar} ${styles[size]} ${TONE_CLASS[tone]} ${square ? styles.square : ''
                }`}
            title={title}
            aria-hidden={title ? undefined : true}
        >
            {initials.slice(0, 2)}
        </span>
    );
};

export default Avatar;
