import React from 'react';
import styles from './ActiveEvents.module.css';

const ActiveEvents: React.FC = () => {
    return (
        <div className={styles.leftPanel}>
            <div className={styles.tableHeader}>
                <div className={styles.tableHeaderLeft}>
                    <span className={styles.tableIcon} />
                    <div className={styles.tableTitle}>Aktywne Wydarzenia</div>
                </div>
                <button className={styles.tableAction}>Zobacz wszystkie</button>
            </div>

            <div className={styles.table}>
                <div className={styles.tableRow}>
                    <div className={styles.eventInfo}>
                        <div className={styles.eventTitle}>SFI 2024</div>
                        <div className={styles.eventSubtitle}>Studencki Festiwal Informatyczny</div>
                    </div>
                    <div className={styles.eventCoordinator}>AN Anna Nowak</div>
                    <div className={styles.eventDate}>14-16 Kwietnia 2024</div>
                    <div className={styles.eventProgress}>
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: '85%' }} />
                        </div>
                        <div className={styles.progressText}>85,000 PLN</div>
                    </div>
                    <div className={styles.eventPartners}>12/15</div>
                </div>

                <div className={styles.tableRowAlt}>
                    <div className={styles.eventInfo}>
                        <div className={styles.eventTitle}>KrakHack 2024</div>
                        <div className={styles.eventSubtitle}>Ogólnopolski Hackathon</div>
                    </div>
                    <div className={styles.eventCoordinator}>JK Jan Kowalski</div>
                    <div className={styles.eventDate}>22-23 Czerwca 2024</div>
                    <div className={styles.eventProgress}>
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: '24%' }} />
                        </div>
                        <div className={styles.progressText}>12,000 PLN</div>
                    </div>
                    <div className={styles.eventPartners}>4/10</div>
                </div>
            </div>
        </div>
    );
};

export default ActiveEvents;
