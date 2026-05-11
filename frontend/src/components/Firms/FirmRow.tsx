import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import TagBadge from './TagBadge';
import TypeBadge from './TypeBadge';
import { companySizeToTypeId, formatDate } from '../../lib/format';
import type { Company } from '../../types/api';
import styles from './FirmRow.module.css';

interface FirmRowProps {
    company: Company;
}

const FirmRow: React.FC<FirmRowProps> = ({ company }) => {
    const typeId = companySizeToTypeId(company.company_size);
    const statusId = company.is_partner ? 'active_partner' : 'contact';

    return (
        <div className={styles.row}>
            <div className={styles.checkboxCell}>
                <input type="checkbox" className={styles.rowCheckbox} />
            </div>

            <Link
                to={`/companies/${company.id}`}
                className={styles.nameCell}
                style={{ textDecoration: 'none', color: 'inherit' }}
            >
                <div className={styles.companyName}>{company.name}</div>
                <div className={styles.cityName}>{company.city ?? '—'}</div>
            </Link>

            <div className={styles.tagsCell}>
                <div className={styles.tagsList}>
                    {company.tags.map((tag) => (
                        <TagBadge key={tag.id} tagId={tag.name} />
                    ))}
                    {typeId && <TypeBadge typeId={typeId} />}
                </div>
            </div>

            <div className={styles.coordinatorCell}>
                <span className={styles.coordinatorName}>—</span>
            </div>

            <div className={styles.statusCell}>
                <StatusBadge statusId={statusId} />
            </div>

            <div className={styles.dateCell}>
                <span className={styles.dateText}>
                    {formatDate(company.last_contact_at)}
                </span>
            </div>
        </div>
    );
};

export default FirmRow;
