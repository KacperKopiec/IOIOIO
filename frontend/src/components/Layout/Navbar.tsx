import { useAuth } from '../../context/AuthContext';
import styles from './Layout.module.css';

interface NavbarProps {
    onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
    const { userName } = useAuth();

    return (
        <header className={styles.navbar}>
            <button className={styles.hamburger} onClick={onMenuClick} aria-label="Menu">
                ☰
            </button>
            <div className={styles.logo}>AGH Partner CRM</div>
            <div className={styles.search}>
                <input type="text" placeholder="Szukaj firm, wydarzeń..." />
            </div>
            <div className={styles.user}>
                <span className={styles.userName}>{userName}</span>
                <div className={styles.avatar} />  {/* placeholder awatar */}
            </div>
            <div className={styles.notifications}>
                🔔 <span className={styles.badge}>3</span>
            </div>
        </header>
    );
};

export default Navbar;