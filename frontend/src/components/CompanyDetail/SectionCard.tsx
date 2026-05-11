import React from 'react';
import styles from './SectionCard.module.css';

interface SectionCardProps {
    title: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({
    title,
    icon,
    action,
    children,
}) => {
    return (
        <section className={styles.card}>
            <header className={styles.header}>
                <div className={styles.titleGroup}>
                    {icon && <span className={styles.titleIcon}>{icon}</span>}
                    <h2 className={styles.title}>{title}</h2>
                </div>
                {action}
            </header>
            {children}
        </section>
    );
};

export default SectionCard;
