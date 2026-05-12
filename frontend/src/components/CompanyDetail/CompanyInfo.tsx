import React from 'react';
import type { Company } from '../../types/api';
import styles from './CompanyInfo.module.css';

const COMPANY_SIZE_LABEL: Record<NonNullable<Company['company_size']>, string> = {
    startup: 'Startup',
    sme: 'MŚP',
    corporation: 'Korporacja',
    public_institution: 'Sektor publiczny',
};

interface CompanyInfoProps {
    company: Company;
}

const CompanyInfo: React.FC<CompanyInfoProps> = ({ company }) => {
    const addressLines = [company.city, company.country]
        .filter(Boolean)
        .join(', ');
    const websiteUrl = company.website
        ? company.website.startsWith('http')
            ? company.website
            : `https://${company.website}`
        : null;

    return (
        <div className={styles.grid}>
            <div className={styles.field}>
                <span className={styles.label}>Pełna nazwa</span>
                <span className={styles.value}>
                    {company.legal_name || company.name}
                </span>
            </div>
            <div className={styles.field}>
                <span className={styles.label}>NIP</span>
                <span className={styles.value}>{company.nip || '—'}</span>
            </div>
            <div className={styles.field}>
                <span className={styles.label}>Adres siedziby</span>
                <span className={styles.value}>{addressLines || '—'}</span>
            </div>
            <div className={styles.field}>
                <span className={styles.label}>Strona WWW</span>
                {websiteUrl ? (
                    <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`${styles.value} ${styles.link}`}
                    >
                        {company.website}
                    </a>
                ) : (
                    <span className={styles.value}>—</span>
                )}
            </div>
            <div className={styles.field}>
                <span className={styles.label}>Opis działalności</span>
                <span className={`${styles.value} ${styles.valueDescription}`}>
                    {company.description || 'Brak opisu działalności.'}
                </span>
            </div>
            <div className={styles.field}>
                <span className={styles.label}>Profil działalności</span>
                <div className={styles.tagRow}>
                    {company.industry && (
                        <span className={styles.tag}>{company.industry.name}</span>
                    )}
                    {company.company_size && (
                        <span className={styles.tag}>
                            {COMPANY_SIZE_LABEL[company.company_size]}
                        </span>
                    )}
                    {company.tags.map((t) => (
                        <span key={t.id} className={styles.tag}>
                            {t.name}
                        </span>
                    ))}
                    {!company.industry &&
                        !company.company_size &&
                        company.tags.length === 0 && (
                            <span className={styles.tag}>Brak tagów</span>
                        )}
                </div>
            </div>
        </div>
    );
};

export default CompanyInfo;
