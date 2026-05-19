import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Send, Trash2 } from 'lucide-react';
import { useCreateActivity, useDeleteActivity } from '../../hooks/api/activities';
import { toApiError } from '../../lib/api';
import type { Activity } from '../../types/api';
import EditHistoryActivityModal from '../modals/EditHistoryActivityModal';
import styles from './CompanyActivities.module.css';

interface CompanyActivitiesProps {
    companyId: number;
    activities: Activity[];
    isLoading: boolean;
}

const HISTORY_TYPES = new Set(['note', 'meeting', 'email', 'phone_call']);

const TYPE_LABEL: Record<string, string> = {
    note: 'Notatka',
    meeting: 'Spotkanie',
    email: 'E-mail',
    phone_call: 'Telefon',
};

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
    const [edited, setEdited] = useState<Activity | null>(null);
    const create = useCreateActivity();
    const deleteActivity = useDeleteActivity();

    const history = activities
        .filter((a) => HISTORY_TYPES.has(a.activity_type))
        .sort((a, b) => {
            const aDate = new Date(a.activity_date ?? a.created_at).getTime();
            const bDate = new Date(b.activity_date ?? b.created_at).getTime();
            return bDate - aDate;
        });

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

    function handleDelete(activity: Activity) {
        const confirmed = window.confirm('Usunąć ten wpis z historii kontaktu?');
        if (!confirmed) return;
        setError(null);
        deleteActivity.mutate(activity.id, {
            onError: (err) => setError(toApiError(err).detail),
        });
    }

    if (isLoading) {
        return (
            <div className={styles.card}>
                <h3 className={styles.title}>Historia kontaktu</h3>
                <div className={styles.loading}>Ładowanie…</div>
            </div>
        );
    }

    return (
        <div className={styles.card}>
            <h3 className={styles.title}>Historia kontaktu</h3>

            {history.length > 0 ? (
                <div className={styles.list}>
                    {history.map((activity) => (
                        <div key={activity.id} className={styles.note}>
                            <div className={styles.noteHeader}>
                                <div className={styles.noteBody}>
                                    {activity.description || activity.subject}
                                </div>
                                <div className={styles.noteActions}>
                                    <button
                                        type="button"
                                        className={styles.iconBtn}
                                        onClick={() => setEdited(activity)}
                                        aria-label="Edytuj wpis"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.iconBtn}
                                        onClick={() => handleDelete(activity)}
                                        disabled={deleteActivity.isPending}
                                        aria-label="Usuń wpis"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className={styles.noteMeta}>
                                <span>{TYPE_LABEL[activity.activity_type] ?? activity.activity_type}</span>
                                <span>{formatRelative(activity.activity_date ?? activity.created_at)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.empty}>Brak historii kontaktu dla tej firmy.</div>
            )}

            <form onSubmit={handleSubmit} className={styles.editorWrap}>
                <textarea
                    className={styles.editor}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Dodaj szybką notatkę…"
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

            <EditHistoryActivityModal
                open={edited != null}
                activity={edited}
                onClose={() => setEdited(null)}
            />
        </div>
    );
};

export default CompanyActivities;
