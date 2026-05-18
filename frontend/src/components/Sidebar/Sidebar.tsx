import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';
import logoUrl from '../../assets/logo.svg';

type Link = { to: string; label: string; icon: string };

const links: Link[] = [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/firms', label: 'Baza Firm', icon: 'domain' },
    { to: '/events', label: 'Wydarzenia', icon: 'event' },
    { to: '/reports', label: 'Raporty', icon: 'assessment' },
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
