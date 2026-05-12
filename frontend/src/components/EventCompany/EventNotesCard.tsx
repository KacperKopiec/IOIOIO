import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useCreateActivity } from '../../hooks/api/activities';
import { toApiError } from '../../lib/api';
import type { Activity } from '../../types/api';
import styles from './EventNotesCard.module.css';

interface EventNotesCardProps {
    companyId: number;
    eventId: number;
    notes: Activity[];
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

const EventNotesCard: React.FC<EventNotesCardProps> = ({
    companyId,
    eventId,
    notes,
}) => {
    const [draft, setDraft] = useState('');
    const [error, setError] = useState<string | null>(null);
    const create = useCreateActivity();

    const latest = notes[0];

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
                event_id: eventId,
                activity_date: new Date().toISOString(),
            },
            {
                onSuccess: () => setDraft(''),
                onError: (err) => setError(toApiError(err).detail),
            },
        );
    }

    return (
        <div className={styles.card}>
            <h3 className={styles.title}>Notatki</h3>

            {latest ? (
                <div className={styles.latest}>
                    <div className={styles.latestBody}>
                        {latest.description || latest.subject}
                    </div>
                    <div className={styles.latestMeta}>
                        {formatRelative(latest.activity_date ?? latest.created_at)}
                    </div>
                </div>
            ) : (
                <div className={styles.empty}>Brak notatek dla tej firmy w wydarzeniu.</div>
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

export default EventNotesCard;
