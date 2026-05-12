import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { useCreateActivity } from '../../hooks/api/activities';
import { useUsers } from '../../hooks/api/reference';
import { toApiError } from '../../lib/api';
import type { ActivityType } from '../../types/api';
import styles from './FormFields.module.css';

interface AddActivityModalProps {
    open: boolean;
    onClose: () => void;
    defaults?: {
        companyId?: number | null;
        eventId?: number | null;
        pipelineEntryId?: number | null;
        contactId?: number | null;
    };
}

const TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
    { value: 'meeting', label: 'Spotkanie' },
    { value: 'email', label: 'E-mail' },
    { value: 'phone_call', label: 'Telefon' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'note', label: 'Notatka' },
    { value: 'task', label: 'Zadanie' },
];

const AddActivityModal: React.FC<AddActivityModalProps> = ({
    open,
    onClose,
    defaults,
}) => {
    const create = useCreateActivity();
    const users = useUsers();

    const [activityType, setActivityType] = useState<ActivityType>('meeting');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [activityDate, setActivityDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [assignedUserId, setAssignedUserId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    function reset() {
        setActivityType('meeting');
        setSubject('');
        setDescription('');
        setActivityDate('');
        setDueDate('');
        setAssignedUserId('');
        setError(null);
    }

    function handleClose() {
        reset();
        onClose();
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!subject.trim()) {
            setError('Temat jest wymagany.');
            return;
        }
        setError(null);
        create.mutate(
            {
                activity_type: activityType,
                subject: subject.trim(),
                description: description.trim() || null,
                activity_date: activityDate
                    ? new Date(activityDate).toISOString()
                    : null,
                due_date: dueDate ? new Date(dueDate).toISOString() : null,
                assigned_user_id: assignedUserId
                    ? Number.parseInt(assignedUserId, 10)
                    : null,
                company_id: defaults?.companyId ?? null,
                event_id: defaults?.eventId ?? null,
                pipeline_entry_id: defaults?.pipelineEntryId ?? null,
                contact_id: defaults?.contactId ?? null,
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
            title="Dodaj aktywność"
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
                        form="add-activity-form"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={create.isPending}
                    >
                        {create.isPending ? 'Zapisywanie…' : 'Dodaj wpis'}
                    </button>
                </>
            }
        >
            <form id="add-activity-form" onSubmit={handleSubmit}>
                <div className={styles.row2}>
                    <div className={styles.row}>
                        <label className={styles.label}>Typ</label>
                        <select
                            className={styles.select}
                            value={activityType}
                            onChange={(e) => setActivityType(e.target.value as ActivityType)}
                        >
                            {TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.row}>
                        <label className={styles.label}>Przypisany do</label>
                        <select
                            className={styles.select}
                            value={assignedUserId}
                            onChange={(e) => setAssignedUserId(e.target.value)}
                        >
                            <option value="">— nikt —</option>
                            {users.data?.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.first_name} {u.last_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.row}>
                    <label className={styles.label}>
                        Temat <span className={styles.required}>*</span>
                    </label>
                    <input
                        className={styles.input}
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
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
                        <label className={styles.label}>Data aktywności</label>
                        <input
                            type="datetime-local"
                            className={styles.input}
                            value={activityDate}
                            onChange={(e) => setActivityDate(e.target.value)}
                        />
                    </div>
                    <div className={styles.row}>
                        <label className={styles.label}>Termin</label>
                        <input
                            type="datetime-local"
                            className={styles.input}
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}
            </form>
        </Modal>
    );
};

export default AddActivityModal;
