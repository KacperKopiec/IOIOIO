import React from 'react';
import type { FirmTagId } from '../../constants/firmTags';
import { getTagConfig } from '../../constants/firmTags';
import styles from './TagBadge.module.css';

interface TagBadgeProps {
    tagId: FirmTagId | string;
    label?: string;
}

const FALLBACK = { bgColor: '#F3F4F6', textColor: '#374151' };

const TagBadge: React.FC<TagBadgeProps> = ({ tagId, label }) => {
    const tagConfig = getTagConfig(tagId);

    const display = tagConfig?.label ?? label ?? tagId;
    const colors = tagConfig ?? FALLBACK;

    return (
        <span
            className={styles.tag}
            style={{ backgroundColor: colors.bgColor, color: colors.textColor }}
        >
            {display}
        </span>
    );
};

export default TagBadge;
