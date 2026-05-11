import React from 'react';
import { ROLES, roleLabel, useAuth, type UserRole } from '../../context/AuthContext';
import styles from './TopBar.module.css';

const TopBar: React.FC = () => {
    const { role, setRole, userName, userRoleName } = useAuth();
    const isDev = import.meta.env.DEV;

    return (
        <header className={styles.topbar}>
            <div className={styles.leftArea} aria-hidden />

            <div className={styles.rightArea}>
                {isDev && (
                    <div className={styles.roleSwitcher}>
                        <label className={styles.roleSwitcherLabel}>
                            Tryb dev — rola:
                        </label>
                        <select
                            className={styles.roleSwitcherSelect}
                            value={role}
                            onChange={(e) => setRole(e.target.value as UserRole)}
                        >
                            {ROLES.map((r) => (
                                <option key={r} value={r}>
                                    {roleLabel(r)}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <div className={styles.userBlock}>
                    <div className={styles.userName}>{userName}</div>
                    <div className={styles.userRole}>{userRoleName}</div>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
