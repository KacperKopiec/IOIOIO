import React, { useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import { useEvents } from '../../hooks/api/events';
import { useBulkCreatePipelineEntries } from '../../hooks/api/pipeline';
import { usePipelineStages, useUsers } from '../../hooks/api/reference';
import { toApiError } from '../../lib/api';
import type { Company } from '../../types/api';
import styles from './FormFields.module.css';

interface BulkSeedPipelineModalProps {
    open: boolean;
    companies: Company[];
    onClose: () => void;
    onDone?: () => void;
}

const BulkSeedPipelineModal: React.FC<BulkSeedPipelineModalProps> = ({
    open,
    companies,
    onClose,
    onDone,
}) => {
    const events = useEvents({ page: 1, page_size: 100 });
    const stages = usePipelineStages();
    const owners = useUsers('opiekun');
    const bulkCreate = useBulkCreatePipelineEntries();

    const [eventId, setEventId] = useState('');
    const [stageId, setStageId] = useState('');
    const [ownerId, setOwnerId] = useState('');
    const [expectedAmount, setExpectedAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<string | null>(null);

    const companyIds = useMemo(() => companies.map((c) => c.id), [companies]);

    function reset() {
        setEventId('');
        setStageId('');
        setOwnerId('');
        setExpectedAmount('');
        setNotes('');
        setError(null);
        setSummary(null);
    }

    function handleClose() {
        reset();
        onClose();
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!eventId) {
            setError('Wybierz inicjatywę.');
            return;
        }
        if (companyIds.length === 0) {
            setError('Zaznacz firmy do dodania.');
            return;
        }
        setError(null);
        setSummary(null);
        bulkCreate.mutate(
            {
                event_id: Number.parseInt(eventId, 10),
                company_ids: companyIds,
                stage_id: stageId ? Number.parseInt(stageId, 10) : null,
                owner_user_id: ownerId ? Number.parseInt(ownerId, 10) : null,
                expected_amount: expectedAmount || null,
                notes: notes.trim() || null,
            },
            {
                onSuccess: (result) => {
                    setSummary(
                        `Dodano ${result.created.length}, pominięto ${result.skipped_company_ids.length}.`,
                    );
                    onDone?.();
                },
                onError: (err) => setError(toApiError(err).detail),
            },
        );
    }

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Zasil lejek masowo"
            footer={
                <>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnGhost}`}
                        onClick={handleClose}
                        disabled={bulkCreate.isPending}
                    >
                        Zamknij
                    </button>
                    <button
                        type="submit"
                        form="bulk-seed-pipeline-form"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={bulkCreate.isPending || companies.length === 0}
                    >
                        {bulkCreate.isPending ? 'Dodawanie…' : 'Dodaj do lejka'}
                    </button>
                </>
            }
        >
            <form id="bulk-seed-pipeline-form" onSubmit={handleSubmit}>
                <div className={styles.row}>
                    <label className={styles.label}>Zaznaczone firmy</label>
                    <div className={styles.helper}>
                        {companies.length} firm zostanie dodanych do wybranej inicjatywy.
                    </div>
                </div>

                <div className={styles.row}>
                    <label className={styles.label}>
                        Inicjatywa <span className={styles.required}>*</span>
                    </label>
                    <select
                        className={styles.select}
                        value={eventId}
                        onChange={(e) => setEventId(e.target.value)}
                        required
                    >
                        <option value="">— wybierz —</option>
                        {events.data?.items.map((event) => (
                            <option key={event.id} value={event.id}>
                                {event.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.row2}>
                    <div className={styles.row}>
                        <label className={styles.label}>Etap startowy</label>
                        <select
                            className={styles.select}
                            value={stageId}
                            onChange={(e) => setStageId(e.target.value)}
                        >
                            <option value="">Pierwszy etap</option>
                            {stages.data?.map((stage) => (
                                <option key={stage.id} value={stage.id}>
                                    {stage.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.row}>
                        <label className={styles.label}>Opiekun</label>
                        <select
                            className={styles.select}
                            value={ownerId}
                            onChange={(e) => setOwnerId(e.target.value)}
                        >
                            <option value="">— wybierz —</option>
                            {owners.data?.map((owner) => (
                                <option key={owner.id} value={owner.id}>
                                    {owner.first_name} {owner.last_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.row}>
                    <label className={styles.label}>Oczekiwana kwota na firmę (PLN)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={styles.input}
                        value={expectedAmount}
                        onChange={(e) => setExpectedAmount(e.target.value)}
                    />
                </div>

                <div className={styles.row}>
                    <label className={styles.label}>Notatka</label>
                    <textarea
                        className={styles.textarea}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                {summary && <div className={styles.helper}>{summary}</div>}
                {error && <div className={styles.error}>{error}</div>}
            </form>
        </Modal>
    );
};

export default BulkSeedPipelineModal;
