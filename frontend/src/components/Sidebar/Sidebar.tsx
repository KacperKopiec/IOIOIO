import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/firms', label: 'Baza Firm' },
    { to: '/events', label: 'Wydarzenia' },
    { to: '/reports', label: 'Raporty' },
    { to: '/settings', label: 'Ustawienia' },
];

const Sidebar: React.FC = () => {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.logoArea}>
                <div className={styles.logoMark} />
                <div className={styles.logoText}>INFORMATYKA</div>
            </div>

            <nav className={styles.nav}>
                {links.map((l) => (
                    <NavLink
                        key={l.to}
                        to={l.to}
                        className={({ isActive }) =>
                            isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
                        }
                    >
                        <div className={styles.icon} />
                        <div className={styles.label}>{l.label}</div>
                    </NavLink>
                ))}
            </nav>

            <div className={styles.footer}>
                <NavLink to="/help" className={styles.navItem}>
                    <div className={styles.icon} />
                    <div className={styles.label}>Pomoc</div>
                </NavLink>
            </div>
        </aside>
    );
};

export default Sidebar;
