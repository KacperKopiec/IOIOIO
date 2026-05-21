import React from 'react';
import { FileText, GitBranchPlus, Mail, Tag, Download } from 'lucide-react';
import styles from './ActionBar.module.css';

interface ActionBarProps {
    selectedCount: number;
    visibleCount: number;
    allSelected: boolean;
    onToggleAll: (next: boolean) => void;
    onAddTags?: () => void;
    onSeedPipeline?: () => void;
    onSendEmail?: () => void;
    onExportCsv?: () => void;
    isExporting?: boolean;
    onGenerateReport?: () => void;
}

const ActionBar: React.FC<ActionBarProps> = ({
    selectedCount,
    visibleCount,
    allSelected,
    onToggleAll,
    onAddTags,
    onSeedPipeline,
    onSendEmail,
    onExportCsv,
    isExporting = false,
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
                        disabled={disabled || !onAddTags}
                        title={
                            !onAddTags
                                ? 'Tylko opiekun relacji może zmieniać tagi'
                                : undefined
                        }
                    >
                        <Tag className={styles.iconSmall} aria-hidden="true" />
                        <span className={styles.actionText}>Dodaj tag</span>
                    </button>
                    <button
                        className={styles.actionButton}
                        type="button"
                        onClick={onSeedPipeline}
                        disabled={disabled || !onSeedPipeline}
                    >
                        <GitBranchPlus className={styles.iconSmall} aria-hidden="true" />
                        <span className={styles.actionText}>Zasil lejek</span>
                    </button>
                </div>
            </div>

            <div className={styles.rightGroup}>
                <button
                    className={styles.reportButton}
                    type="button"
                    onClick={onExportCsv}
                    disabled={!onExportCsv || isExporting}
                >
                    <Download className={styles.reportIcon} aria-hidden="true" />
                    <span className={styles.reportText}>
                        {isExporting ? 'Eksportowanie' : 'Eksport CSV'}
                    </span>
                </button>

                {onGenerateReport && (
                    <button
                        className={styles.reportButton}
                        type="button"
                        onClick={onGenerateReport}
                    >
                        <FileText className={styles.reportIcon} aria-hidden="true" />
                        <span className={styles.reportText}>Generuj raport</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ActionBar;
