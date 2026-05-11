import React from 'react';
import type { FirmTypeId } from '../../constants/firmTypes';
import { getTypeConfig } from '../../constants/firmTypes';
import styles from './TypeBadge.module.css';

interface TypeBadgeProps {
    typeId: FirmTypeId | string;
}

const TypeBadge: React.FC<TypeBadgeProps> = ({ typeId }) => {
    const typeConfig = getTypeConfig(typeId);

    if (!typeConfig) {
        return null;
    }

    return (
        <span
            className={styles.type}
            style={{
                backgroundColor: typeConfig.bgColor,
                color: typeConfig.textColor
            }}
        >
            {typeConfig.label}
        </span>
    );
};

export default TypeBadge;
