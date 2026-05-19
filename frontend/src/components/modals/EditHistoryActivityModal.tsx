import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { useUpdateActivity } from '../../hooks/api/activities';
import { toApiError } from '../../lib/api';
import type { Activity, ActivityType } from '../../types/api';
import styles from './FormFields.module.css';

interface EditHistoryActivityModalProps {
    activity: Activity | null;
    open: boolean;
    onClose: () => void;
}

interface EditHistoryActivityFormProps {
    activity: Activity;
    onClose: () => void;
}

const TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
    { value: 'note', label: 'Notatka' },
    { value: 'meeting', label: 'Spotkanie' },
    { value: 'email', label: 'E-mail' },
    { value: 'phone_call', label: 'Telefon' },
];

function toLocalInput(value: string | null) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offsetMs = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

const EditHistoryActivityForm: React.FC<EditHistoryActivityFormProps> = ({
    activity,
    onClose,
}) => {
    const update = useUpdateActivity();
    const [activityType, setActivityType] = useState<ActivityType>(activity.activity_type);
    const [subject, setSubject] = useState(activity.subject);
    const [description, setDescription] = useState(activity.description ?? '');
    const [activityDate, setActivityDate] = useState(
        toLocalInput(activity.activity_date ?? activity.created_at),
    );
    const [error, setError] = useState<string | null>(null);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!subject.trim()) {
            setError('Temat jest wymagany.');
            return;
        }
        setError(null);
        update.mutate(
            {
                id: activity.id,
                payload: {
                    activity_type: activityType,
                    subject: subject.trim(),
                    description: description.trim() || null,
                    activity_date: activityDate
                        ? new Date(activityDate).toISOString()
                        : null,
                },
            },
            {
                onSuccess: onClose,
                onError: (err) => setError(toApiError(err).detail),
            },
        );
    }

    return (
        <Modal
            open
            onClose={onClose}
            title="Edytuj wpis historii"
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
                        form="edit-history-activity-form"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={update.isPending}
                    >
                        {update.isPending ? 'Zapisywanie…' : 'Zapisz'}
                    </button>
                </>
            }
        >
            <form id="edit-history-activity-form" onSubmit={handleSubmit}>
                <div className={styles.row2}>
                    <div className={styles.row}>
                        <label className={styles.label}>Typ wpisu</label>
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
                        <label className={styles.label}>Data wpisu</label>
                        <input
                            type="datetime-local"
                            className={styles.input}
                            value={activityDate}
                            onChange={(e) => setActivityDate(e.target.value)}
                        />
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

                {error && <div className={styles.error}>{error}</div>}
            </form>
        </Modal>
    );
};

const EditHistoryActivityModal: React.FC<EditHistoryActivityModalProps> = ({
    activity,
    open,
    onClose,
}) => {
    if (!open || !activity) return null;
    return (
        <EditHistoryActivityForm
            key={activity.id}
            activity={activity}
            onClose={onClose}
        />
    );
};

export default EditHistoryActivityModal;
