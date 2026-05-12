import React from 'react';
import { Mail } from 'lucide-react';
import { ownerInitials } from '../../lib/format';
import type { Contact } from '../../types/api';
import styles from './ContactsList.module.css';

interface ContactsListProps {
    contacts: Contact[];
    isLoading: boolean;
}

const ContactsList: React.FC<ContactsListProps> = ({ contacts, isLoading }) => {
    if (isLoading) {
        return <div className={styles.empty}>Ładowanie kontaktów…</div>;
    }
    if (contacts.length === 0) {
        return <div className={styles.empty}>Brak osób kontaktowych.</div>;
    }
    return (
        <div className={styles.list}>
            {contacts.map((contact) => (
                <div key={contact.id} className={styles.row}>
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
                    {contact.email ? (
                        <a
                            href={`mailto:${contact.email}`}
                            className={styles.iconLink}
                            aria-label={`Wyślij email do ${contact.first_name} ${contact.last_name}`}
                        >
                            <Mail size={14} />
                        </a>
                    ) : (
                        <span className={`${styles.iconLink} ${styles.iconLinkDisabled}`}>
                            <Mail size={14} />
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ContactsList;
