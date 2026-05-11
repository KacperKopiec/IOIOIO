import React from 'react';
import StatusBadge from './StatusBadge';
import TagBadge from './TagBadge';
import TypeBadge from './TypeBadge';
import type { FirmStatusId } from '../../constants/firmStatus';
import type { FirmTagId } from '../../constants/firmTags';
import type { FirmTypeId } from '../../constants/firmTypes';
import { mapLegacyStatus } from '../../constants/firmStatus';
import { mapLegacyTag } from '../../constants/firmTags';
import { mapLegacyType } from '../../constants/firmTypes';
import styles from './FirmRow.module.css';

interface FirmRowProps {
    id: number;
    name: string;
    city: string;
    tags: (FirmTagId | string)[];
    type: FirmTypeId | string;
    coordinator: string;
    /** Status ID from database, e.g. 'contact', 'active_partner', 'umowa' */
    status: FirmStatusId | 'Aktywny partner' | 'Kontakt' | 'Prospect';
    lastContact: string;
}

const FirmRow: React.FC<FirmRowProps> = ({
    name,
    city,
    tags,
    type,
    coordinator,
    status,
    lastContact
}) => {
    // Handle legacy string statuses for backward compatibility
    const statusId: FirmStatusId = typeof status === 'string' && !status.includes('_')
        ? mapLegacyStatus(status)
        : (status as FirmStatusId);

    // Map tags from legacy format if needed
    const tagIds = tags.map(tag => {
        if (typeof tag === 'string' && !tag.includes('_')) {
            return mapLegacyTag(tag);
        }
        return tag;
    });

    // Map type from legacy format if needed
    const typeId = typeof type === 'string' && !type.includes('_')
        ? mapLegacyType(type)
        : type;

    return (
        <div className={styles.row}>
            <div className={styles.checkboxCell}>
                <input type="checkbox" className={styles.rowCheckbox} />
            </div>

            <div className={styles.nameCell}>
                <div className={styles.companyName}>{name}</div>
                <div className={styles.cityName}>{city}</div>
            </div>

            <div className={styles.tagsCell}>
                <div className={styles.tagsList}>
                    {tagIds.map((tagId, idx) => (
                        <TagBadge key={idx} tagId={tagId} />
                    ))}
                    {type && <TypeBadge typeId={typeId} />}
                </div>
            </div>

            <div className={styles.coordinatorCell}>
                <span className={styles.coordinatorName}>{coordinator}</span>
            </div>

            <div className={styles.statusCell}>
                <StatusBadge statusId={statusId} />
            </div>

            <div className={styles.dateCell}>
                <span className={styles.dateText}>{lastContact}</span>
            </div>
        </div>
    );
};

export default FirmRow;
