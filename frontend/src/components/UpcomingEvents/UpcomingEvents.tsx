import React from 'react';
import styles from './UpcomingEvents.module.css';

const UpcomingEvents: React.FC = () => {
    return (
        <div className={styles.card}>
            <h3 className={styles.heading}>Nadchodzące wydarzenia</h3>
            <div className={styles.eventItem}><strong>LIS 14</strong> Career Expo 2023</div>
            <div className={styles.eventItem}><strong>LIS 21</strong> Spotkanie Rady Biznesu</div>
        </div>
    );
};

export default UpcomingEvents;
