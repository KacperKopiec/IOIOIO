import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import { useCreateEvent } from '../../hooks/api/events';
import { useUsers } from '../../hooks/api/reference';
import { toApiError } from '../../lib/api';
import type { EventStatus } from '../../types/api';
import styles from './FormFields.module.css';

interface AddEventModalProps {
    open: boolean;
    onClose: () => void;
}

const STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
    { value: 'draft', label: 'Wersja robocza' },
    { value: 'active', label: 'Aktywne' },
    { value: 'closed', label: 'Zakończone' },
    { value: 'cancelled', label: 'Anulowane' },
];

const AddEventModal: React.FC<AddEventModalProps> = ({ open, onClose }) => {
    const navigate = useNavigate();
    const create = useCreateEvent();
    const coordinators = useUsers('koordynator');

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState<EventStatus>('draft');
    const [ownerId, setOwnerId] = useState<string>('');
    const [targetPartners, setTargetPartners] = useState('');
    const [targetBudget, setTargetBudget] = useState('');
    const [error, setError] = useState<string | null>(null);

    function reset() {
        setName('');
        setDescription('');
        setStartDate('');
        setEndDate('');
        setStatus('draft');
        setOwnerId('');
        setTargetPartners('');
        setTargetBudget('');
        setError(null);
    }

    function handleClose() {
        reset();
        onClose();
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) {
            setError('Nazwa wydarzenia jest wymagana.');
            return;
        }
        setError(null);
        create.mutate(
            {
                name: name.trim(),
                description: description.trim() || null,
                start_date: startDate || null,
                end_date: endDate || null,
                status,
                owner_user_id: ownerId ? Number.parseInt(ownerId, 10) : null,
                target_partners_count: targetPartners
                    ? Number.parseInt(targetPartners, 10)
                    : null,
                target_budget: targetBudget || null,
            },
            {
                onSuccess: (event) => {
                    reset();
                    onClose();
                    navigate(`/events/${event.id}`);
                },
                onError: (err) => setError(toApiError(err).detail),
            },
        );
    }

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Dodaj wydarzenie"
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
                        form="add-event-form"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={create.isPending}
                    >
                        {create.isPending ? 'Zapisywanie…' : 'Dodaj wydarzenie'}
                    </button>
                </>
            }
        >
            <form id="add-event-form" onSubmit={handleSubmit}>
                <div className={styles.row}>
                    <label className={styles.label}>
                        Nazwa <span className={styles.required}>*</span>
                    </label>
                    <input
                        className={styles.input}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                        required
                    />
                </div>

                <div className={styles.row}>
                    <label className={styles.label}>Opis</label>
                    <textarea
                        className={styles.textarea}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className={styles.row2}>
                    <div className={styles.row}>
                        <label className={styles.label}>Data rozpoczęcia</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className={styles.row}>
                        <label className={styles.label}>Data zakończenia</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.row2}>
                    <div className={styles.row}>
                        <label className={styles.label}>Status</label>
                        <select
                            className={styles.select}
                            value={status}
                            onChange={(e) => setStatus(e.target.value as EventStatus)}
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.row}>
                        <label className={styles.label}>Koordynator</label>
                        <select
                            className={styles.select}
                            value={ownerId}
                            onChange={(e) => setOwnerId(e.target.value)}
                        >
                            <option value="">— wybierz —</option>
                            {coordinators.data?.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.first_name} {u.last_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.row2}>
                    <div className={styles.row}>
                        <label className={styles.label}>Cel partnerów</label>
                        <input
                            type="number"
                            min="0"
                            className={styles.input}
                            value={targetPartners}
                            onChange={(e) => setTargetPartners(e.target.value)}
                        />
                    </div>
                    <div className={styles.row}>
                        <label className={styles.label}>Cel budżetu (PLN)</label>
                        <input
                            type="number"
                            min="0"
                            step="100"
                            className={styles.input}
                            value={targetBudget}
                            onChange={(e) => setTargetBudget(e.target.value)}
                        />
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}
            </form>
        </Modal>
    );
};

export default AddEventModal;
