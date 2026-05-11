import React, { useEffect, useState } from 'react';
import { useUpdateCompany } from '../../hooks/api/companies';
import { toApiError } from '../../lib/api';
import styles from './CompanyNotes.module.css';

interface CompanyNotesProps {
    companyId: number;
    notes: string | null;
    editing: boolean;
    onCancel: () => void;
    onSaved: () => void;
}

const CompanyNotes: React.FC<CompanyNotesProps> = ({
    companyId,
    notes,
    editing,
    onCancel,
    onSaved,
}) => {
    const [draft, setDraft] = useState(notes ?? '');
    const [error, setError] = useState<string | null>(null);
    const update = useUpdateCompany(companyId);

    useEffect(() => {
        if (editing) setDraft(notes ?? '');
    }, [editing, notes]);

    if (!editing) {
        if (!notes) {
            return (
                <div className={styles.box}>
                    <span className={styles.empty}>Brak notatek dla tej firmy.</span>
                </div>
            );
        }
        return <div className={styles.box}>{notes}</div>;
    }

    function handleSave() {
        setError(null);
        update.mutate(
            { notes: draft },
            {
                onSuccess: () => onSaved(),
                onError: (err) => setError(toApiError(err).detail),
            },
        );
    }

    return (
        <div>
            <textarea
                className={styles.editor}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Dodaj notatkę…"
            />
            {error && <div className={styles.errorRow}>{error}</div>}
            <div className={styles.actions}>
                <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionBtnGhost}`}
                    onClick={onCancel}
                    disabled={update.isPending}
                >
                    Anuluj
                </button>
                <button
                    type="button"
                    className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                    onClick={handleSave}
                    disabled={update.isPending}
                >
                    {update.isPending ? 'Zapisywanie…' : 'Zapisz'}
                </button>
            </div>
        </div>
    );
};

export default CompanyNotes;
