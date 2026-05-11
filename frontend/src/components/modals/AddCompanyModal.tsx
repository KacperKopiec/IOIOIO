import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import TagSelector from '../ui/TagSelector';
import { useCreateCompany } from '../../hooks/api/companies';
import { useIndustries } from '../../hooks/api/reference';
import { toApiError } from '../../lib/api';
import type { CompanySize } from '../../types/api';
import styles from './FormFields.module.css';

interface AddCompanyModalProps {
    open: boolean;
    onClose: () => void;
}

const SIZE_OPTIONS: { value: CompanySize; label: string }[] = [
    { value: 'corporation', label: 'Korporacja' },
    { value: 'sme', label: 'MŚP' },
    { value: 'startup', label: 'Startup' },
    { value: 'public_institution', label: 'Sektor publiczny' },
];

const AddCompanyModal: React.FC<AddCompanyModalProps> = ({ open, onClose }) => {
    const navigate = useNavigate();
    const create = useCreateCompany();
    const industries = useIndustries();

    const [name, setName] = useState('');
    const [legalName, setLegalName] = useState('');
    const [nip, setNip] = useState('');
    const [website, setWebsite] = useState('');
    const [city, setCity] = useState('');
    const [industryId, setIndustryId] = useState<string>('');
    const [companySize, setCompanySize] = useState<CompanySize | ''>('');
    const [description, setDescription] = useState('');
    const [tagIds, setTagIds] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);

    function reset() {
        setName('');
        setLegalName('');
        setNip('');
        setWebsite('');
        setCity('');
        setIndustryId('');
        setCompanySize('');
        setDescription('');
        setTagIds([]);
        setError(null);
    }

    function handleClose() {
        reset();
        onClose();
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) {
            setError('Nazwa firmy jest wymagana.');
            return;
        }
        setError(null);
        create.mutate(
            {
                name: name.trim(),
                legal_name: legalName.trim() || null,
                nip: nip.trim() || null,
                website: website.trim() || null,
                city: city.trim() || null,
                country: 'Polska',
                industry_id: industryId ? Number.parseInt(industryId, 10) : null,
                company_size: (companySize || null) as CompanySize | null,
                description: description.trim() || null,
                tag_ids: tagIds,
            },
            {
                onSuccess: (company) => {
                    reset();
                    onClose();
                    navigate(`/companies/${company.id}`);
                },
                onError: (err) => setError(toApiError(err).detail),
            },
        );
    }

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title="Dodaj firmę"
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
                        form="add-company-form"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={create.isPending}
                    >
                        {create.isPending ? 'Zapisywanie…' : 'Dodaj firmę'}
                    </button>
                </>
            }
        >
            <form id="add-company-form" onSubmit={handleSubmit}>
                <div className={styles.row}>
                    <label className={styles.label}>
                        Nazwa <span className={styles.required}>*</span>
                    </label>
                    <input
                        className={styles.input}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                        required
                    />
                </div>

                <div className={styles.row2}>
                    <div className={styles.row}>
                        <label className={styles.label}>Pełna nazwa</label>
                        <input
                            className={styles.input}
                            value={legalName}
                            onChange={(e) => setLegalName(e.target.value)}
                        />
                    </div>
                    <div className={styles.row}>
                        <label className={styles.label}>NIP</label>
                        <input
                            className={styles.input}
                            value={nip}
                            onChange={(e) => setNip(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.row2}>
                    <div className={styles.row}>
                        <label className={styles.label}>Strona WWW</label>
                        <input
                            className={styles.input}
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            placeholder="np. comarch.pl"
                        />
                    </div>
                    <div className={styles.row}>
                        <label className={styles.label}>Miasto</label>
                        <input
                            className={styles.input}
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.row2}>
                    <div className={styles.row}>
                        <label className={styles.label}>Branża</label>
                        <select
                            className={styles.select}
                            value={industryId}
                            onChange={(e) => setIndustryId(e.target.value)}
                        >
                            <option value="">— wybierz —</option>
                            {industries.data?.map((i) => (
                                <option key={i.id} value={i.id}>
                                    {i.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.row}>
                        <label className={styles.label}>Wielkość</label>
                        <select
                            className={styles.select}
                            value={companySize}
                            onChange={(e) =>
                                setCompanySize(e.target.value as CompanySize | '')
                            }
                        >
                            <option value="">— wybierz —</option>
                            {SIZE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.row}>
                    <label className={styles.label}>Opis działalności</label>
                    <textarea
                        className={styles.textarea}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className={styles.row}>
                    <label className={styles.label}>Tagi</label>
                    <TagSelector value={tagIds} onChange={setTagIds} />
                </div>

                {error && <div className={styles.error}>{error}</div>}
            </form>
        </Modal>
    );
};

export default AddCompanyModal;
