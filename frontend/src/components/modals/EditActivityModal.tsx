import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { useDeleteActivity, useUpdateActivity } from '../../hooks/api/activities';
import { useUsers } from '../../hooks/api/reference';
import { toApiError } from '../../lib/api';
import type { Activity, ActivityType } from '../../types/api';
import styles from './FormFields.module.css';

interface EditActivityModalProps {
    activity: Activity | null;
    open: boolean;
    onClose: () => void;
}

interface EditActivityFormProps {
    activity: Activity;
    onClose: () => void;
}

const TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
    { value: 'task', label: 'Zadanie' },
    { value: 'follow_up', label: 'Follow-up' },
];

function toLocalInput(value: string | null) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offsetMs = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

const EditActivityForm: React.FC<EditActivityFormProps> = ({ activity, onClose }) => {
    const users = useUsers();
    const update = useUpdateActivity();
    const deleteActivity = useDeleteActivity();

    const [activityType, setActivityType] = useState<ActivityType>(activity.activity_type);
    const [subject, setSubject] = useState(activity.subject);
    const [description, setDescription] = useState(activity.description ?? '');
    const [dueDate, setDueDate] = useState(toLocalInput(activity.due_date));
    const [assignedUserId, setAssignedUserId] = useState(
        activity.assigned_user_id ? String(activity.assigned_user_id) : '',
    );
    const [completed, setCompleted] = useState(activity.completed_at != null);
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
                    due_date: dueDate ? new Date(dueDate).toISOString() : null,
                    assigned_user_id: assignedUserId
                        ? Number.parseInt(assignedUserId, 10)
                        : null,
                    completed_at: completed
                        ? activity.completed_at ?? new Date().toISOString()
                        : null,
                },
            },
            {
                onSuccess: onClose,
                onError: (err) => setError(toApiError(err).detail),
            },
        );
    }

    function handleDelete() {
        const confirmed = window.confirm('Usunąć ten follow-up?');
        if (!confirmed) return;
        setError(null);
        deleteActivity.mutate(activity.id, {
            onSuccess: onClose,
            onError: (err) => setError(toApiError(err).detail),
        });
    }

    return (
        <Modal
            open
            onClose={onClose}
            title="Edytuj follow-up"
            footer={
                <>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnDanger}`}
                        onClick={handleDelete}
                        disabled={update.isPending || deleteActivity.isPending}
                    >
                        {deleteActivity.isPending ? 'Usuwanie…' : 'Usuń'}
                    </button>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnGhost}`}
                        onClick={onClose}
                        disabled={update.isPending || deleteActivity.isPending}
                    >
                        Anuluj
                    </button>
                    <button
                        type="submit"
                        form="edit-activity-form"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={update.isPending || deleteActivity.isPending}
                    >
                        {update.isPending ? 'Zapisywanie…' : 'Zapisz'}
                    </button>
                </>
            }
        >
            <form id="edit-activity-form" onSubmit={handleSubmit}>
                <div className={styles.row2}>
                    <div className={styles.row}>
                        <label className={styles.label}>Typ następnego kroku</label>
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
                        <label className={styles.label}>Termin follow-upu</label>
                        <input
                            type="datetime-local"
                            className={styles.input}
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>
                    <label className={styles.row}>
                        <span className={styles.label}>Status</span>
                        <select
                            className={styles.select}
                            value={completed ? 'done' : 'open'}
                            onChange={(e) => setCompleted(e.target.value === 'done')}
                        >
                            <option value="open">Do zrobienia</option>
                            <option value="done">Zakończone</option>
                        </select>
                    </label>
                </div>

                {error && <div className={styles.error}>{error}</div>}
            </form>
        </Modal>
    );
};

const EditActivityModal: React.FC<EditActivityModalProps> = ({
    activity,
    open,
    onClose,
}) => {
    if (!open || !activity) return null;
    return <EditActivityForm key={activity.id} activity={activity} onClose={onClose} />;
};

export default EditActivityModal;
