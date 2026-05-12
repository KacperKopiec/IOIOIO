import React from 'react';
import { FileText, Mail, Tag } from 'lucide-react';
import styles from './ActionBar.module.css';

interface ActionBarProps {
    selectedCount: number;
    visibleCount: number;
    allSelected: boolean;
    onToggleAll: (next: boolean) => void;
    onAddTags: () => void;
    onSendEmail?: () => void;
    onGenerateReport?: () => void;
}

const ActionBar: React.FC<ActionBarProps> = ({
    selectedCount,
    visibleCount,
    allSelected,
    onToggleAll,
    onAddTags,
    onSendEmail,
    onGenerateReport,
}) => {
    const disabled = selectedCount === 0;

    return (
        <div className={styles.bar}>
            <div className={styles.leftGroup}>
                <label className={styles.checkLabel}>
                    <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={visibleCount > 0 && allSelected}
                        ref={(input) => {
                            if (input) {
                                input.indeterminate =
                                    selectedCount > 0 && !allSelected;
                            }
                        }}
                        onChange={(e) => onToggleAll(e.target.checked)}
                        disabled={visibleCount === 0}
                        aria-label="Zaznacz wszystkie firmy na stronie"
                    />
                    <span className={styles.labelText}>
                        {selectedCount > 0
                            ? `Zaznaczono ${selectedCount}`
                            : 'Zaznacz wszystko'}
                    </span>
                </label>

                <div className={styles.divider} />

                <div className={styles.actionsGroup}>
                    <button
                        className={styles.actionButton}
                        type="button"
                        onClick={onSendEmail}
                        disabled={disabled || !onSendEmail}
                        title={
                            !onSendEmail
                                ? 'Wysyłka maili nie jest jeszcze zaimplementowana'
                                : undefined
                        }
                    >
                        <Mail className={styles.iconSmall} aria-hidden="true" />
                        <span className={styles.actionText}>Wyślij email</span>
                    </button>

                    <button
                        className={styles.actionButton}
                        type="button"
                        onClick={onAddTags}
                        disabled={disabled}
                    >
                        <Tag className={styles.iconSmall} aria-hidden="true" />
                        <span className={styles.actionText}>Dodaj tag</span>
                    </button>
                </div>
            </div>

            <div className={styles.rightGroup}>
                <button
                    className={styles.reportButton}
                    type="button"
                    onClick={onGenerateReport}
                    disabled={!onGenerateReport}
                    title={
                        !onGenerateReport
                            ? 'Generowanie raportu nie jest jeszcze zaimplementowane'
                            : undefined
                    }
                >
                    <FileText className={styles.reportIcon} aria-hidden="true" />
                    <span className={styles.reportText}>Generuj raport</span>
                </button>
            </div>
        </div>
    );
};

export default ActionBar;
