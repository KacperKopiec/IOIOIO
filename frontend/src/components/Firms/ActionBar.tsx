import React from 'react';
import { FileText, Mail, Tag } from 'lucide-react';
import styles from './ActionBar.module.css';

const ActionBar: React.FC = () => {
    return (
        <div className={styles.bar}>
            <div className={styles.leftGroup}>
                <label className={styles.checkLabel}>
                    <input type="checkbox" className={styles.checkbox} />
                    <span className={styles.labelText}>Zaznacz wszystko</span>
                </label>

                <div className={styles.divider} />

                <div className={styles.actionsGroup}>
                    <button className={styles.actionButton} type="button">
                        <Mail className={styles.iconSmall} aria-hidden="true" />
                        <span className={styles.actionText}>Wyślij email</span>
                    </button>

                    <button className={styles.actionButton} type="button">
                        <Tag className={styles.iconSmall} aria-hidden="true" />
                        <span className={styles.actionText}>Dodaj tag</span>
                    </button>
                </div>
            </div>

            <div className={styles.rightGroup}>
                <button className={styles.reportButton} type="button">
                    <FileText className={styles.reportIcon} aria-hidden="true" />
                    <span className={styles.reportText}>Generuj raport</span>
                </button>
            </div>
        </div>
    );
};

export default ActionBar;
