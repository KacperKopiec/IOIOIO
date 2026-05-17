import React from 'react';
import Modal from '../ui/Modal';
import { Phone, Mail, ExternalLink, FileText } from 'lucide-react';
import type { Contact } from '../../types/api';
import styles from './ContactDetailModal.module.css';

interface ContactDetailModalProps {
    open: boolean;
    contact: Contact | null;
    onClose: () => void;
}

const ContactDetailModal: React.FC<ContactDetailModalProps> = ({
    open,
    contact,
    onClose,
}) => {
    if (!contact) return null;

    return (
        <Modal open={open} onClose={onClose} title="Szczegóły kontaktu">
            <div className={styles.content}>
                <div className={styles.header}>
                    <div className={styles.avatar}>
                        {contact.first_name[0]}
                        {contact.last_name[0]}
                    </div>
                    <div className={styles.nameRow}>
                        <span className={styles.name}>
                            {contact.first_name} {contact.last_name}
                        </span>
                        {contact.position && (
                            <span className={styles.position}>{contact.position}</span>
                        )}
                    </div>
                </div>

                <div className={styles.fields}>
                    {contact.email && (
                        <a href={`mailto:${contact.email}`} className={styles.field}>
                            <Mail size={16} />
                            <span>{contact.email}</span>
                        </a>
                    )}

                    {contact.phone && (
                        <a href={`tel:${contact.phone}`} className={styles.field}>
                            <Phone size={16} />
                            <span>{contact.phone}</span>
                        </a>
                    )}

                    {contact.linkedin_url && (
                        <a
                            href={contact.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.field}
                        >
                            <ExternalLink size={16} />
                            <span>LinkedIn</span>
                        </a>
                    )}

                    {contact.notes && (
                        <div className={styles.notes}>
                            <FileText size={16} />
                            <div className={styles.notesContent}>
                                <span className={styles.notesLabel}>Notatki</span>
                                <p className={styles.notesText}>{contact.notes}</p>
                            </div>
                        </div>
                    )}

                    {!contact.email &&
                        !contact.phone &&
                        !contact.linkedin_url &&
                        !contact.notes && (
                            <div className={styles.empty}>
                                Brak danych kontaktowych.
                            </div>
                        )}
                </div>
            </div>
        </Modal>
    );
};

export default ContactDetailModal;