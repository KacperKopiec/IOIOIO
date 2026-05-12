import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Modal from '../ui/Modal';
import TagSelector from '../ui/TagSelector';
import { companyKeys } from '../../hooks/api/companies';
import { api, toApiError } from '../../lib/api';
import type { Company } from '../../types/api';
import styles from './FormFields.module.css';

interface BulkAddTagsModalProps {
    open: boolean;
    companies: Company[];
    onClose: () => void;
    onDone?: () => void;
}

const BulkAddTagsModal: React.FC<BulkAddTagsModalProps> = ({
    open,
    companies,
    onClose,
    onDone,
}) => {
    const qc = useQueryClient();
    const [tagIds, setTagIds] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    function handleClose() {
        if (pending) return;
        setTagIds([]);
        setError(null);
        onClose();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (tagIds.length === 0) {
            setError('Wybierz co najmniej jeden tag do dodania.');
            return;
        }
        if (companies.length === 0) {
            setError('Brak zaznaczonych firm.');
            return;
        }
        setError(null);
        setPending(true);
        try {
            const newTagSet = new Set(tagIds);
            await Promise.all(
                companies.map((c) => {
                    const merged = new Set<number>(c.tags.map((t) => t.id));
                    for (const id of newTagSet) merged.add(id);
                    return api.patch(`/companies/${c.id}`, {
                        tag_ids: Array.from(merged),
                    });
                }),
            );
            await qc.invalidateQueries({ queryKey: companyKeys.all });
            setTagIds([]);
            onDone?.();
            onClose();
        } catch (err) {
            setError(toApiError(err).detail);
        } finally {
            setPending(false);
        }
    }

    const count = companies.length;
    const submitLabel = pending
        ? 'Zapisywanie…'
        : `Dodaj tagi do ${count} ${count === 1 ? 'firmy' : 'firm'}`;

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={`Dodaj tagi do ${count} ${count === 1 ? 'firmy' : 'firm'}`}
            footer={
                <>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnGhost}`}
                        onClick={handleClose}
                        disabled={pending}
                    >
                        Anuluj
                    </button>
                    <button
                        type="submit"
                        form="bulk-add-tags-form"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={pending || tagIds.length === 0}
                    >
                        {submitLabel}
                    </button>
                </>
            }
        >
            <form id="bulk-add-tags-form" onSubmit={handleSubmit}>
                <div className={styles.row}>
                    <label className={styles.label}>Tagi do dodania</label>
                    <span className={styles.helper}>
                        Wybrane tagi zostaną dopisane do istniejących, nie zastąpią ich.
                    </span>
                    <TagSelector value={tagIds} onChange={setTagIds} />
                </div>

                <div className={styles.row}>
                    <label className={styles.label}>
                        Firmy ({count})
                    </label>
                    <div className={styles.helper}>
                        {companies
                            .slice(0, 8)
                            .map((c) => c.name)
                            .join(', ')}
                        {count > 8 && ` … +${count - 8}`}
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}
            </form>
        </Modal>
    );
};

export default BulkAddTagsModal;
