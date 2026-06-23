import React from 'react';
import { Mail } from 'lucide-react';
import { useAuth } from '../../context/auth';
import { useSendReminderEmail } from '../../hooks/api/dashboard';
import styles from './TopBar.module.css';

const TopBar: React.FC = () => {
    const { userId, userName, userRoleName } = useAuth();
    const sendReminder = useSendReminderEmail();

    const handleSendReminder = async () => {
        if (userId == null) {
            window.alert('Brak przypisanego użytkownika dla bieżącej roli.');
            return;
        }
        try {
            const result = await sendReminder.mutateAsync(userId);
            const summary =
                `Zaległe: ${result.overdue_count} · Nadchodzące: ${result.upcoming_count}`;
            if (result.sent) {
                window.alert(`Wysłano przypomnienie na ${result.to}. ${summary}`);
            } else if (result.transport === 'log') {
                window.alert(
                    `SMTP nie jest skonfigurowany — treść maila zapisana w logu kontenera. ${summary}`,
                );
            } else {
                window.alert(
                    `Nie udało się wysłać maila${result.detail ? ` (${result.detail})` : ''}.`,
                );
            }
        } catch (error) {
            console.error(error);
            window.alert('Nie udało się wysłać maila — sprawdź konsolę.');
        }
    };

    return (
        <header className={styles.topbar}>
            <div className={styles.leftArea} aria-hidden />

            <div className={styles.rightArea}>
                <button
                    type="button"
                    className={styles.reminderButton}
                    onClick={handleSendReminder}
                    disabled={sendReminder.isPending || userId == null}
                    title="Wyślij mail z przypomnieniami do bieżącego użytkownika"
                >
                    <Mail size={14} />
                    {sendReminder.isPending ? 'Wysyłanie…' : 'Wyślij przypomnienie'}
                </button>
                <div className={styles.userBlock}>
                    <div className={styles.userName}>{userName}</div>
                    <div className={styles.userRole}>{userRoleName}</div>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
