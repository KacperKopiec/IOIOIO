import React from 'react';
import styles from './Stats.module.css';

const Stats: React.FC = () => {
    return (
        <div className={styles.statsRow}>
            <div className={styles.statCard}>
                <div className={styles.statLabel}>AKTYWNE PARTNERSTWA</div>
                <div className={styles.statMainRow}>
                    <div className={styles.statValue}>142</div>
                    <div className={styles.statSub}>+12% w tym roku</div>
                </div>
            </div>

            <div className={`${styles.statCard} ${styles.statHighlight}`}>
                <div className={styles.statLabelWhite}>CAŁKOWITA WARTOŚĆ WSPÓŁPRAC</div>
                <div className={styles.statMainRow}>
                    <div className={styles.statValueWhite}>12 580 000</div>
                    <div className={styles.statSubWhite}>PLN</div>
                </div>
            </div>

            <div className={styles.statCard}>
                <div className={styles.statLabel}>PROCENT KONWERSJA KONTAKTÓW</div>
                <div className={styles.statMainRow}>
                    <div className={styles.statValue}>8.64 %</div>
                    <div className={styles.statSub}>+0.43 pp. w tym roku</div>
                </div>
            </div>
        </div>
    );
};

export default Stats;
