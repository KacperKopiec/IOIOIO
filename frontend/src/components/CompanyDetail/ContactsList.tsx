import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { ownerInitials } from '../../lib/format';
import type { Contact } from '../../types/api';
import ContactDetailModal from '../modals/ContactDetailModal';
import styles from './ContactsList.module.css';

interface ContactsListProps {
    contacts: Contact[];
    isLoading: boolean;
}

const ContactsList: React.FC<ContactsListProps> = ({ contacts, isLoading }) => {
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    if (isLoading) {
        return <div className={styles.empty}>Ładowanie kontaktów…</div>;
    }
    if (contacts.length === 0) {
        return <div className={styles.empty}>Brak osób kontaktowych.</div>;
    }
    return (
        <>
            <div className={styles.list}>
                {contacts.map((contact) => (
                    <div
                        key={contact.id}
                        className={styles.row}
                        onClick={() => setSelectedContact(contact)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                setSelectedContact(contact);
                            }
                        }}
                    >
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
            <ContactDetailModal
                open={selectedContact !== null}
                contact={selectedContact}
                onClose={() => setSelectedContact(null)}
            />
        </>
    );
};

export default ContactsList;
