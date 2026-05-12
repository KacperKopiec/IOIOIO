import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { useCreateContact } from '../../hooks/api/contacts';
import { toApiError } from '../../lib/api';
import styles from './FormFields.module.css';

interface AddContactModalProps {
    open: boolean;
    companyId: number | null;
    onClose: () => void;
}

const AddContactModal: React.FC<AddContactModalProps> = ({
    open,
    companyId,
    onClose,
}) => {
    const create = useCreateContact();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [position, setPosition] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState<string | null>(null);

    function reset() {
        setFirstName('');
        setLastName('');
        setPosition('');
        setEmail('');
        setPhone('');
        setError(null);
    }

    function handleClose() {
        reset();
        onClose();
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (companyId == null) {
            setError('Brak firmy.');
            return;
        }
        if (!firstName.trim() || !lastName.trim()) {
            setError('Imię i nazwisko są wymagane.');
            return;
        }
        setError(null);
        create.mutate(
            {
                company_id: companyId,
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                position: position.trim() || null,
                email: email.trim() || null,
                phone: phone.trim() || null,
            },
            {
                onSuccess: () => {
                    reset();
                    onClose();
                },
                onError: (err) => setError(toApiError(err).detail),
            },
        );
    }

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Dodaj osobę kontaktową"
            footer={
                <>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnGhost}`}
                        onClick={handleClose}
                        disabled={create.isPending}
                    >
                        Anuluj
                    </button>
                    <button
                        type="submit"
                        form="add-contact-form"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={create.isPending}
                    >
                        {create.isPending ? 'Zapisywanie…' : 'Dodaj kontakt'}
                    </button>
                </>
            }
        >
            <form id="add-contact-form" onSubmit={handleSubmit}>
                <div className={styles.row2}>
                    <div className={styles.row}>
                        <label className={styles.label}>
                            Imię <span className={styles.required}>*</span>
                        </label>
                        <input
                            className={styles.input}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            autoFocus
                            required
                        />
                    </div>
                    <div className={styles.row}>
                        <label className={styles.label}>
                            Nazwisko <span className={styles.required}>*</span>
                        </label>
                        <input
                            className={styles.input}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className={styles.row}>
                    <label className={styles.label}>Stanowisko</label>
                    <input
                        className={styles.input}
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                    />
                </div>

                <div className={styles.row2}>
                    <div className={styles.row}>
                        <label className={styles.label}>E-mail</label>
                        <input
                            type="email"
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className={styles.row}>
                        <label className={styles.label}>Telefon</label>
                        <input
                            className={styles.input}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}
            </form>
        </Modal>
    );
};

export default AddContactModal;
