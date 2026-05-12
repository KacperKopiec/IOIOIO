import React from 'react';
import styles from './TopBar.module.css';

const TopBar: React.FC = () => {
    return (
        <header className={styles.topbar}>
            <div className={styles.leftArea}>
                <div className={styles.searchIcon} aria-hidden />
                <input className={styles.searchInput} placeholder="Szukaj firm, inicjatyw..." />
            </div>

            <div className={styles.rightArea}>
                <div className={styles.userName}>User</div>
                <div className={styles.userRole}>KADRA ZARZĄDZAJĄCA</div>
            </div>
        </header>
    );
};

export default TopBar;
