import React from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import type { Company } from '../../types/api';
import styles from './CompanySummary.module.css';

interface CompanySummaryProps {
    company: Company;
}

const CompanySummary: React.FC<CompanySummaryProps> = ({ company }) => {
    const initial = company.name.charAt(0).toUpperCase();
    const location = [company.city, company.country].filter(Boolean).join(', ');
    const websiteUrl = company.website
        ? company.website.startsWith('http')
            ? company.website
            : `https://${company.website}`
        : null;

    return (
        <div className={styles.card}>
            <div className={styles.logoBox}>
                <span className={styles.logoInitial}>{initial}</span>
            </div>

            <div className={styles.fields}>
                <div className={styles.field}>
                    <span className={styles.label}>Branża</span>
                    <span className={styles.value}>
                        {company.industry?.name ?? 'Brak danych'}
                    </span>
                </div>

                <div className={styles.field}>
                    <span className={styles.label}>Status</span>
                    <span
                        className={`${styles.statusBadge} ${company.is_partner ? styles.statusActive : styles.statusContact
                            }`}
                    >
                        {company.is_partner ? 'Aktywny partner' : 'Kontakt'}
                    </span>
                </div>

                <div className={styles.field}>
                    <span className={styles.label}>Lokalizacja</span>
                    <span className={styles.locationRow}>
                        <MapPin size={14} />
                        {location || 'Brak danych'}
                    </span>
                </div>

                <div className={styles.field}>
                    <span className={styles.label}>WWW</span>
                    {websiteUrl ? (
                        <a
                            href={websiteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.link}
                        >
                            {company.website}
                            <ExternalLink size={12} />
                        </a>
                    ) : (
                        <span className={styles.value}>—</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompanySummary;
