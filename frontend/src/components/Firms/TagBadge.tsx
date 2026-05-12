import React from 'react';
import type { FirmTagId } from '../../constants/firmTags';
import { getTagConfig } from '../../constants/firmTags';
import styles from './TagBadge.module.css';

interface TagBadgeProps {
    tagId: FirmTagId | string;
}

const TagBadge: React.FC<TagBadgeProps> = ({ tagId }) => {
    const tagConfig = getTagConfig(tagId);

    if (!tagConfig) {
        return null;
    }

    return (
        <span
            className={styles.tag}
            style={{
                backgroundColor: tagConfig.bgColor,
                color: tagConfig.textColor
            }}
        >
            {tagConfig.label}
        </span>
    );
};

export default TagBadge;
