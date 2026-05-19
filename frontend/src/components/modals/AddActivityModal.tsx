import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import { useCreateActivity } from '../../hooks/api/activities';
import { useUsers } from '../../hooks/api/reference';
import { toApiError } from '../../lib/api';
import type { ActivityType } from '../../types/api';
import styles from './FormFields.module.css';

interface AddActivityModalProps {
    open: boolean;
    onClose: () => void;
    defaultType?: ActivityType;
    mode?: 'all' | 'history' | 'follow_up';
    defaults?: {
        companyId?: number | null;
        eventId?: number | null;
        pipelineEntryId?: number | null;
        contactId?: number | null;
    };
}

const ALL_TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
    { value: 'meeting', label: 'Spotkanie' },
    { value: 'email', label: 'E-mail' },
    { value: 'phone_call', label: 'Telefon' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'note', label: 'Notatka' },
    { value: 'task', label: 'Zadanie' },
];

const HISTORY_TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
    { value: 'note', label: 'Notatka' },
    { value: 'meeting', label: 'Spotkanie' },
    { value: 'email', label: 'E-mail' },
    { value: 'phone_call', label: 'Telefon' },
];

const FOLLOW_UP_TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'task', label: 'Zadanie' },
];

const AddActivityModal: React.FC<AddActivityModalProps> = ({
    open,
    onClose,
    defaultType = 'meeting',
    mode = 'all',
    defaults,
}) => {
    const create = useCreateActivity();
    const users = useUsers();

    const typeOptions =
        mode === 'history'
            ? HISTORY_TYPE_OPTIONS
            : mode === 'follow_up'
                ? FOLLOW_UP_TYPE_OPTIONS
                : ALL_TYPE_OPTIONS;
    const effectiveDefaultType = typeOptions.some((opt) => opt.value === defaultType)
        ? defaultType
        : typeOptions[0].value;
    const showAssigneeAndDueDate = mode !== 'history';
    const showActivityDate = mode !== 'follow_up';
    const modalTitle =
        mode === 'history'
            ? 'Dodaj wpis do historii'
            : mode === 'follow_up'
                ? 'Dodaj follow-up'
                : 'Dodaj aktywność';
    const submitLabel =
        mode === 'history'
            ? 'Zapisz wpis'
            : mode === 'follow_up'
                ? 'Dodaj follow-up'
                : 'Dodaj wpis';
    const subjectPlaceholder =
        mode === 'history'
            ? 'np. Wysłano ofertę do kontaktu'
            : mode === 'follow_up'
                ? 'np. Zadzwonić z ponowieniem oferty'
                : undefined;

    const [activityType, setActivityType] = useState<ActivityType>(effectiveDefaultType);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [activityDate, setActivityDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [assignedUserId, setAssignedUserId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setActivityType(effectiveDefaultType);
        }
    }, [effectiveDefaultType, open]);

    function reset() {
        setActivityType(effectiveDefaultType);
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
                activity_date: showActivityDate
                    ? activityDate
                        ? new Date(activityDate).toISOString()
                        : mode === 'history'
                            ? new Date().toISOString()
                            : null
                    : null,
                due_date: showAssigneeAndDueDate && dueDate
                    ? new Date(dueDate).toISOString()
                    : null,
                assigned_user_id: showAssigneeAndDueDate && assignedUserId
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
            title={modalTitle}
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
                        {create.isPending ? 'Zapisywanie…' : submitLabel}
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
                            {typeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    {showAssigneeAndDueDate && (
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
                    )}
                </div>

                <div className={styles.row}>
                    <label className={styles.label}>
                        Temat <span className={styles.required}>*</span>
                    </label>
                    <input
                        className={styles.input}
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder={subjectPlaceholder}
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

                {(showActivityDate || showAssigneeAndDueDate) && (
                    <div className={styles.row2}>
                        {showActivityDate && (
                            <div className={styles.row}>
                                <label className={styles.label}>Data wpisu</label>
                                <input
                                    type="datetime-local"
                                    className={styles.input}
                                    value={activityDate}
                                    onChange={(e) => setActivityDate(e.target.value)}
                                />
                            </div>
                        )}
                        {showAssigneeAndDueDate && (
                            <div className={styles.row}>
                                <label className={styles.label}>Termin follow-upu</label>
                                <input
                                    type="datetime-local"
                                    className={styles.input}
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                )}

                {error && <div className={styles.error}>{error}</div>}
            </form>
        </Modal>
    );
};

export default AddActivityModal;
