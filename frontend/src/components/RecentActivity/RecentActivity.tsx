import React from 'react';
import styles from './RecentActivity.module.css';

const RecentActivity: React.FC = () => {
    return (
        <div className={styles.activityCard}>
            <h3 className={styles.heading}>Ostatnie aktywności</h3>
            <div className={styles.activityItem}>
                <div className={styles.activityTitle}>Contract Signed</div>
                <div className={styles.activitySub}>2 hours ago • TechNova Inc.</div>
            </div>
            <div className={styles.activityItem}>
                <div className={styles.activityTitle}>Proposal Sent</div>
                <div className={styles.activitySub}>5 hours ago • GreenEnergy Co.</div>
            </div>
        </div>
    );
};

export default RecentActivity;
