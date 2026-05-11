import React from 'react';
import { Mail, MoreHorizontal, Phone } from 'lucide-react';
import { ownerInitials } from '../../lib/format';
import type { Contact } from '../../types/api';
import styles from './EventContactsCard.module.css';

interface EventContactsCardProps {
    contacts: Contact[];
    isLoading: boolean;
}

const EventContactsCard: React.FC<EventContactsCardProps> = ({
    contacts,
    isLoading,
}) => {
    return (
        <div className={styles.card}>
            <header className={styles.header}>
                <h2 className={styles.title}>Osoby kontaktowe</h2>
                <button type="button" className={styles.addBtn} disabled>
                    Dodaj osobę
                </button>
            </header>

            {isLoading && <div className={styles.empty}>Ładowanie kontaktów…</div>}
            {!isLoading && contacts.length === 0 && (
                <div className={styles.empty}>Brak osób kontaktowych.</div>
            )}

            {contacts.slice(0, 6).map((contact) => (
                <div key={contact.id} className={styles.row}>
                    <div className={styles.left}>
                        <span className={styles.avatar}>
                            {ownerInitials(contact.first_name, contact.last_name)}
                        </span>
                        <div className={styles.body}>
                            <span className={styles.name}>
                                {contact.first_name} {contact.last_name}
                            </span>
                            <span className={styles.position}>
                                {contact.position ?? 'Brak stanowiska'}
                            </span>
                        </div>
                    </div>
                    <div className={styles.actions}>
                        {contact.email ? (
                            <a
                                href={`mailto:${contact.email}`}
                                className={styles.iconBtn}
                                aria-label={`Email do ${contact.first_name}`}
                            >
                                <Mail size={14} />
                            </a>
                        ) : (
                            <span
                                className={`${styles.iconBtn} ${styles.iconBtnDisabled}`}
                            >
                                <Mail size={14} />
                            </span>
                        )}
                        {contact.phone ? (
                            <a
                                href={`tel:${contact.phone}`}
                                className={styles.iconBtn}
                                aria-label={`Zadzwoń do ${contact.first_name}`}
                            >
                                <Phone size={14} />
                            </a>
                        ) : (
                            <span
                                className={`${styles.iconBtn} ${styles.iconBtnDisabled}`}
                            >
                                <Phone size={14} />
                            </span>
                        )}
                        <button
                            type="button"
                            className={styles.iconBtn}
                            disabled
                            aria-label="Więcej akcji"
                        >
                            <MoreHorizontal size={14} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default EventContactsCard;
