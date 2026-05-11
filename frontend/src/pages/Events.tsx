import React from 'react';
import EventsFilterSidebar from '../components/Events/EventsFilterSidebar';
import EventsTable from '../components/Events/EventsTable';
import styles from './Events.module.css';

const Events: React.FC = () => {
    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <nav className={styles.breadcrumb}>
                        <span className={styles.breadcrumbItem}>Panel</span>
                        <span className={styles.breadcrumbSeparator}>/</span>
                        <span className={styles.breadcrumbItem}>Wydarzenia</span>
                    </nav>
                    <h1 className={styles.title}>Wydarzenia</h1>
                </div>
            </div>

            <div className={styles.mainContent}>
                <div className={styles.filterColumn}>
                    <EventsFilterSidebar />
                </div>
                <div className={styles.tableColumn}>
                    <EventsTable />
                </div>
            </div>
        </div>
    );
};

export default Events;