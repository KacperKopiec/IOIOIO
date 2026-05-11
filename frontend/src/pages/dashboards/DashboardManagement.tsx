import React from 'react';
import styles from '../Dashboard.module.css';
import Stats from '../../components/Stats/Stats';
import ActiveEvents from '../../components/ActiveEvents/ActiveEvents';
import UpcomingEvents from '../../components/UpcomingEvents/UpcomingEvents';
import RecentActivity from '../../components/RecentActivity/RecentActivity';

const DashboardManagement: React.FC = () => {
    return (
        <>
            <nav className={styles.breadcrumb}>Dashboard / Kadra zarządzająca</nav>
            <h1 className={styles.title}>Dashboard</h1>

            <Stats />

            <div className={styles.contentGrid}>
                <ActiveEvents />

                <aside className={styles.rightColumn}>
                    <UpcomingEvents />
                    <RecentActivity />
                </aside>
            </div>
        </>
    );
};

export default DashboardManagement;
