import React, { useState } from 'react';
import Modal from '../ui/Modal';
import TagSelector from '../ui/TagSelector';
import { useUpdateEvent } from '../../hooks/api/events';
import { useUsers } from '../../hooks/api/reference';
import { toApiError } from '../../lib/api';
import type { Event, EventStatus } from '../../types/api';
import styles from './FormFields.module.css';

interface EditEventModalProps {
    open: boolean;
    event: Event;
    onClose: () => void;
}

const STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
    { value: 'draft', label: 'Wersja robocza' },
    { value: 'active', label: 'Aktywne' },
    { value: 'closed', label: 'Zakończone' },
    { value: 'cancelled', label: 'Anulowane' },
];

const EditEventModal: React.FC<EditEventModalProps> = ({
    open,
    event,
    onClose,
}) => {
    const update = useUpdateEvent(event.id);
    const coordinators = useUsers('koordynator');

    const [name, setName] = useState(event.name);
    const [description, setDescription] = useState(event.description ?? '');
    const [startDate, setStartDate] = useState(event.start_date ?? '');
    const [endDate, setEndDate] = useState(event.end_date ?? '');
    const [status, setStatus] = useState<EventStatus>(event.status);
    const [ownerId, setOwnerId] = useState<string>(
        event.owner_user_id != null ? String(event.owner_user_id) : '',
    );
    const [targetPartners, setTargetPartners] = useState(
        event.target_partners_count != null
            ? String(event.target_partners_count)
            : '',
    );
    const [targetBudget, setTargetBudget] = useState(event.target_budget ?? '');
    const [tagIds, setTagIds] = useState<number[]>(event.tags.map((t) => t.id));
    const [error, setError] = useState<string | null>(null);
    const [prevOpen, setPrevOpen] = useState(open);

    if (open !== prevOpen) {
        setPrevOpen(open);
        if (open) {
            setName(event.name);
            setDescription(event.description ?? '');
            setStartDate(event.start_date ?? '');
            setEndDate(event.end_date ?? '');
            setStatus(event.status);
            setOwnerId(
                event.owner_user_id != null ? String(event.owner_user_id) : '',
            );
            setTargetPartners(
                event.target_partners_count != null
                    ? String(event.target_partners_count)
                    : '',
            );
            setTargetBudget(event.target_budget ?? '');
            setTagIds(event.tags.map((t) => t.id));
            setError(null);
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) {
            setError('Nazwa wydarzenia jest wymagana.');
            return;
        }
        setError(null);
        update.mutate(
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
                tag_ids: tagIds,
            },
            {
                onSuccess: () => onClose(),
                onError: (err) => setError(toApiError(err).detail),
            },
        );
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Edytuj wydarzenie"
            footer={
                <>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnGhost}`}
                        onClick={onClose}
                        disabled={update.isPending}
                    >
                        Anuluj
                    </button>
                    <button
                        type="submit"
                        form="edit-event-form"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={update.isPending}
                    >
                        {update.isPending ? 'Zapisywanie…' : 'Zapisz zmiany'}
                    </button>
                </>
            }
        >
            <form id="edit-event-form" onSubmit={handleSubmit}>
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

                <div className={styles.row}>
                    <label className={styles.label}>Tagi</label>
                    <TagSelector value={tagIds} onChange={setTagIds} />
                </div>

                {error && <div className={styles.error}>{error}</div>}
            </form>
        </Modal>
    );
};

export default EditEventModal;
