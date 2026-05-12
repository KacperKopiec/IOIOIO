import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { useCompanies } from '../../hooks/api/companies';
import { useCreatePipelineEntry } from '../../hooks/api/pipeline';
import { usePipelineStages, useUsers } from '../../hooks/api/reference';
import { toApiError } from '../../lib/api';
import styles from './FormFields.module.css';

interface AddPipelineEntryModalProps {
    open: boolean;
    eventId: number | null;
    onClose: () => void;
}

const AddPipelineEntryModal: React.FC<AddPipelineEntryModalProps> = ({
    open,
    eventId,
    onClose,
}) => {
    const create = useCreatePipelineEntry();
    const companies = useCompanies({ page: 1, page_size: 100 });
    const stages = usePipelineStages();
    const owners = useUsers('opiekun');

    const [companyId, setCompanyId] = useState<string>('');
    const [stageId, setStageId] = useState<string>('');
    const [ownerId, setOwnerId] = useState<string>('');
    const [expectedAmount, setExpectedAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);

    function reset() {
        setCompanyId('');
        setStageId('');
        setOwnerId('');
        setExpectedAmount('');
        setNotes('');
        setError(null);
    }

    function handleClose() {
        reset();
        onClose();
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (eventId == null) {
            setError('Brak wydarzenia.');
            return;
        }
        if (!companyId) {
            setError('Wybierz firmę.');
            return;
        }
        setError(null);
        create.mutate(
            {
                event_id: eventId,
                company_id: Number.parseInt(companyId, 10),
                stage_id: stageId ? Number.parseInt(stageId, 10) : null,
                owner_user_id: ownerId ? Number.parseInt(ownerId, 10) : null,
                expected_amount: expectedAmount || null,
                notes: notes.trim() || null,
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
            title="Dodaj firmę do lejka"
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
                        form="add-pipeline-form"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={create.isPending}
                    >
                        {create.isPending ? 'Zapisywanie…' : 'Dodaj do lejka'}
                    </button>
                </>
            }
        >
            <form id="add-pipeline-form" onSubmit={handleSubmit}>
                <div className={styles.row}>
                    <label className={styles.label}>
                        Firma <span className={styles.required}>*</span>
                    </label>
                    <select
                        className={styles.select}
                        value={companyId}
                        onChange={(e) => setCompanyId(e.target.value)}
                        autoFocus
                        required
                    >
                        <option value="">— wybierz —</option>
                        {companies.data?.items.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
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
                            {stages.data?.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
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
                            {owners.data?.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.first_name} {u.last_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.row}>
                    <label className={styles.label}>Oczekiwana kwota (PLN)</label>
                    <input
                        type="number"
                        min="0"
                        step="100"
                        className={styles.input}
                        value={expectedAmount}
                        onChange={(e) => setExpectedAmount(e.target.value)}
                    />
                </div>

                <div className={styles.row}>
                    <label className={styles.label}>Notatki</label>
                    <textarea
                        className={styles.textarea}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                {error && <div className={styles.error}>{error}</div>}
            </form>
        </Modal>
    );
};

export default AddPipelineEntryModal;
