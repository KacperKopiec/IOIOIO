import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { useCreateActivity } from '../../hooks/api/activities';
import { toApiError } from '../../lib/api';
import type { Activity } from '../../types/api';
import styles from './CompanyActivities.module.css';

interface CompanyActivitiesProps {
    companyId: number;
    activities: Activity[];
    isLoading: boolean;
}

function formatRelative(iso: string | null): string {
    if (!iso) return '';
    const date = new Date(iso);
    const now = new Date();
    const sameDay =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
        date.getFullYear() === yesterday.getFullYear() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getDate() === yesterday.getDate();
    const hhmm = date.toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
    });
    if (sameDay) return `DZISIAJ, ${hhmm}`;
    if (isYesterday) return `WCZORAJ, ${hhmm}`;
    return date
        .toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
        .toUpperCase();
}

const CompanyActivities: React.FC<CompanyActivitiesProps> = ({
    companyId,
    activities,
    isLoading,
}) => {
    const queryClient = useQueryClient();
    const [draft, setDraft] = useState('');
    const [error, setError] = useState<string | null>(null);
    const create = useCreateActivity();

    const notes = activities.filter((a) => a.activity_type === 'note');

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!draft.trim()) return;
        setError(null);
        create.mutate(
            {
                activity_type: 'note',
                subject: draft.trim().slice(0, 200),
                description: draft.trim(),
                company_id: companyId,
                activity_date: new Date().toISOString(),
            },
            {
                onSuccess: () => {
                    setDraft('');
                    queryClient.invalidateQueries({ queryKey: ['companies', companyId, 'activities'] });
                },
                onError: (err) => setError(toApiError(err).detail),
            },
        );
    }

    if (isLoading) {
        return (
            <div className={styles.card}>
                <h3 className={styles.title}>Notatki</h3>
                <div className={styles.loading}>Ładowanie…</div>
            </div>
        );
    }

    return (
        <div className={styles.card}>
            <h3 className={styles.title}>Notatki</h3>

            {notes.length > 0 ? (
                <div className={styles.list}>
                    {notes.map((note) => (
                        <div key={note.id} className={styles.note}>
                            <div className={styles.noteBody}>
                                {note.description || note.subject}
                            </div>
                            <div className={styles.noteMeta}>
                                {formatRelative(note.activity_date ?? note.created_at)}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.empty}>Brak notatek dla tej firmy.</div>
            )}

            <form onSubmit={handleSubmit} className={styles.editorWrap}>
                <textarea
                    className={styles.editor}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Dodaj notatkę…"
                />
                <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={create.isPending || draft.trim().length === 0}
                    aria-label="Zapisz notatkę"
                >
                    <Send size={14} />
                </button>
            </form>

            {error && <div className={styles.errorRow}>{error}</div>}
        </div>
    );
};

export default CompanyActivities;