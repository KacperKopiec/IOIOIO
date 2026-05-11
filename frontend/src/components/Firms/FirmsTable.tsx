import React from 'react';
import FirmRow from './FirmRow';
import type { Company, PageMeta } from '../../types/api';
import styles from './FirmsTable.module.css';

interface FirmsTableProps {
    companies: Company[];
    meta: PageMeta | undefined;
    isLoading: boolean;
    isError: boolean;
    onPageChange: (page: number) => void;
}

const FirmsTable: React.FC<FirmsTableProps> = ({
    companies,
    meta,
    isLoading,
    isError,
    onPageChange,
}) => {
    const totalShown = companies.length;
    const startIdx = meta ? (meta.page - 1) * meta.page_size + 1 : 0;
    const endIdx = meta ? startIdx + totalShown - 1 : 0;
    const canPrev = meta ? meta.page > 1 : false;
    const canNext = meta ? meta.page < meta.pages : false;

    return (
        <div className={styles.card}>
            <div className={styles.headerRow}>
                <div className={styles.checkboxHeader}></div>
                <div className={styles.nameHeader}>Nazwa firmy / Miasto</div>
                <div className={styles.tagsHeader}>Tagi & Typ</div>
                <div className={styles.coordinatorHeader}>Koordynator</div>
                <div className={styles.statusHeader}>Status</div>
                <div className={styles.dateHeader}>Ostatni kontakt</div>
            </div>

            <div className={styles.body}>
                {isLoading && (
                    <div className={styles.emptyState}>Ładowanie firm…</div>
                )}
                {isError && !isLoading && (
                    <div className={styles.emptyState}>
                        Nie udało się pobrać firm. Spróbuj odświeżyć stronę.
                    </div>
                )}
                {!isLoading && !isError && companies.length === 0 && (
                    <div className={styles.emptyState}>
                        Brak firm spełniających wybrane filtry.
                    </div>
                )}
                {!isLoading &&
                    !isError &&
                    companies.map((company) => (
                        <FirmRow key={company.id} company={company} />
                    ))}
            </div>

            <div className={styles.pagination}>
                {meta && totalShown > 0 ? (
                    <span>
                        Pokazano {startIdx}-{endIdx} z {meta.total} firm
                    </span>
                ) : (
                    <span>—</span>
                )}
                <div className={styles.paginationControls}>
                    <button
                        type="button"
                        className={styles.paginationBtn}
                        disabled={!canPrev}
                        onClick={() => meta && onPageChange(meta.page - 1)}
                    >
                        ‹
                    </button>
                    <span className={styles.paginationCurrent}>
                        {meta ? `${meta.page} / ${meta.pages}` : '—'}
                    </span>
                    <button
                        type="button"
                        className={styles.paginationBtn}
                        disabled={!canNext}
                        onClick={() => meta && onPageChange(meta.page + 1)}
                    >
                        ›
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FirmsTable;
