import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth, type UserRole } from '../../context/auth';
import styles from './Sidebar.module.css';
import logoUrl from '../../assets/logo.svg';

interface SidebarLink {
    to: string;
    label: string;
    icon: string;
    roles: UserRole[];
}

const links: SidebarLink[] = [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['koordynator', 'opiekun', 'promocja'] },
    { to: '/firms', label: 'Baza Firm', icon: 'domain', roles: ['koordynator', 'opiekun', 'promocja'] },
    { to: '/events', label: 'Wydarzenia', icon: 'event', roles: ['koordynator', 'opiekun', 'promocja'] },
    { to: '/invoices', label: 'Faktury', icon: 'receipt_long', roles: ['koordynator', 'opiekun'] },
    { to: '/reports', label: 'Raporty', icon: 'bar_chart', roles: ['koordynator', 'opiekun'] },
];

const Sidebar: React.FC = () => {
    const { role } = useAuth();
    const visibleLinks = links.filter((link) => link.roles.includes(role));
    return (
        <aside className={styles.sidebar}>
            <div className={styles.logoArea}>
                <img src={logoUrl} alt="NFORMATYKA" className={styles.logo} />
            </div>
            <nav className={styles.nav}>
                {visibleLinks.map((l) => (
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
