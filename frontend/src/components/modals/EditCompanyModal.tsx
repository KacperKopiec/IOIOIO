import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import { useUpdateCompany } from '../../hooks/api/companies';
import { useIndustries } from '../../hooks/api/reference';
import { toApiError } from '../../lib/api';
import type { Company, CompanySize } from '../../types/api';
import styles from './FormFields.module.css';

interface EditCompanyModalProps {
    open: boolean;
    company: Company;
    onClose: () => void;
}

const SIZE_OPTIONS: { value: CompanySize; label: string }[] = [
    { value: 'corporation', label: 'Korporacja' },
    { value: 'sme', label: 'MŚP' },
    { value: 'startup', label: 'Startup' },
    { value: 'public_institution', label: 'Sektor publiczny' },
];

const EditCompanyModal: React.FC<EditCompanyModalProps> = ({
    open,
    company,
    onClose,
}) => {
    const update = useUpdateCompany(company.id);
    const industries = useIndustries();

    const [name, setName] = useState(company.name);
    const [legalName, setLegalName] = useState(company.legal_name ?? '');
    const [nip, setNip] = useState(company.nip ?? '');
    const [website, setWebsite] = useState(company.website ?? '');
    const [city, setCity] = useState(company.city ?? '');
    const [country, setCountry] = useState(company.country ?? 'Polska');
    const [industryId, setIndustryId] = useState<string>(
        company.industry_id != null ? String(company.industry_id) : '',
    );
    const [companySize, setCompanySize] = useState<CompanySize | ''>(
        company.company_size ?? '',
    );
    const [description, setDescription] = useState(company.description ?? '');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setName(company.name);
        setLegalName(company.legal_name ?? '');
        setNip(company.nip ?? '');
        setWebsite(company.website ?? '');
        setCity(company.city ?? '');
        setCountry(company.country ?? 'Polska');
        setIndustryId(
            company.industry_id != null ? String(company.industry_id) : '',
        );
        setCompanySize(company.company_size ?? '');
        setDescription(company.description ?? '');
        setError(null);
    }, [open, company]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) {
            setError('Nazwa firmy jest wymagana.');
            return;
        }
        setError(null);
        update.mutate(
            {
                name: name.trim(),
                legal_name: legalName.trim() || null,
                nip: nip.trim() || null,
                website: website.trim() || null,
                city: city.trim() || null,
                country: country.trim() || null,
                industry_id: industryId ? Number.parseInt(industryId, 10) : null,
                company_size: (companySize || null) as CompanySize | null,
                description: description.trim() || null,
            },
            {
                onSuccess: () => onClose(),
                onError: (err) => setError(toApiError(err).detail),
            },
        );
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Edytuj firmę"
            footer={
                <>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnGhost}`}
                        onClick={onClose}
                        disabled={update.isPending}
                    >
                        Anuluj
                    </button>
                    <button
                        type="submit"
                        form="edit-company-form"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={update.isPending}
                    >
                        {update.isPending ? 'Zapisywanie…' : 'Zapisz zmiany'}
                    </button>
                </>
            }
        >
            <form id="edit-company-form" onSubmit={handleSubmit}>
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

                {error && <div className={styles.error}>{error}</div>}
            </form>
        </Modal>
    );
};

export default EditCompanyModal;
