import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';
import logoUrl from '../../assets/logo.svg';

const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/firms', label: 'Baza Firm' },
    { to: '/events', label: 'Wydarzenia' },
    { to: '/invoices', label: 'Faktury' },
    { to: '/reports', label: 'Raporty' },
];

const Sidebar: React.FC = () => {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.logoArea}>
                <img src={logoUrl} alt="NFORMATYKA" className={styles.logo} />
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
                        <span className={`material-symbols-outlined ${styles.icon}`} aria-hidden="true">
                            {l.icon}
                        </span>
                        <div className={styles.label}>{l.label}</div>
                    </NavLink>
                ))}
            </nav>

            <div className={styles.footer}>
                <NavLink to="/help" className={styles.navItem}>
                    <span className={`material-symbols-outlined ${styles.icon}`} aria-hidden="true">
                        help
                    </span>
                    <div className={styles.label}>Pomoc</div>
                </NavLink>
            </div>
        </aside>
    );
};

export default Sidebar;
