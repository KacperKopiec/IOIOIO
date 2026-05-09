import { NavLink } from 'react-router-dom';
import { useAuth, type UserRole } from '../../context/AuthContext';
import styles from './Layout.module.css';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const sidebarLinks: Record<UserRole, { label: string; path: string; icon: string }[]> = {
    koordynator: [
        { label: 'Dashboard', path: '/dashboard', icon: '📊' },
        { label: 'Moje wydarzenia', path: '/events', icon: '📅' },
        { label: 'Lejek (wydarzenie)', path: '/events/1/pipeline', icon: '🔄' }, // demo
        { label: 'Baza firm', path: '/firms', icon: '🏢' },
    ],
    opiekun: [
        { label: 'Dashboard relacji', path: '/dashboard', icon: '📊' },
        { label: 'Baza firm', path: '/firms', icon: '🏢' },
        { label: 'Wydarzenia', path: '/events', icon: '📅' },
    ],
    promocja: [
        { label: 'Dashboard promocji', path: '/dashboard', icon: '📊' },
        { label: 'Baza firm', path: '/firms', icon: '🏢' },
        { label: 'Wysyłka masowa', path: '/mass-mail', icon: '✉️' },
    ],
    zarzad: [
        { label: 'Dashboard KPI', path: '/dashboard', icon: '📊' },
        { label: 'Raporty', path: '/reports', icon: '📄' },
        { label: 'Baza firm', path: '/firms', icon: '🏢' },
    ],
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { role } = useAuth();
    const links = sidebarLinks[role];

    return (
        <>
            {/* Overlay na mobile */}
            {isOpen && <div className={styles.overlay} onClick={onClose} />}
            <nav className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
                <ul>
                    {links.map((link) => (
                        <li key={link.path}>
                            <NavLink
                                to={link.path}
                                className={({ isActive }: { isActive: boolean }) => isActive ? styles.active : ''}
                                onClick={onClose}  // zamyka sidebar po kliknięciu na mobilnym
                            >
                                <span className={styles.icon}>{link.icon}</span>
                                {link.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </>
    );
};

export default Sidebar;