import React from 'react';
import styles from './Pagination.module.css';

interface PaginationProps {
    page: number;
    pageCount: number;
    total: number;
    pageSize: number;
    itemsShown: number;
    onPageChange: (page: number) => void;
    label?: string;
}

const Pagination: React.FC<PaginationProps> = ({
    page,
    pageCount,
    total,
    pageSize,
    itemsShown,
    onPageChange,
    label = 'wpisów',
}) => {
    const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = start + itemsShown - 1;
    const canPrev = page > 1;
    const canNext = page < pageCount;

    return (
        <div className={styles.wrap}>
            <span>
                {total === 0
                    ? `Brak ${label}`
                    : `Pokazano ${start}–${end} z ${total} ${label}`}
            </span>
            <div className={styles.controls}>
                <button
                    type="button"
                    className={styles.btn}
                    disabled={!canPrev}
                    onClick={() => onPageChange(page - 1)}
                    aria-label="Poprzednia strona"
                >
                    ‹
                </button>
                <span className={styles.current}>
                    {pageCount > 0 ? `${page} / ${pageCount}` : '—'}
                </span>
                <button
                    type="button"
                    className={styles.btn}
                    disabled={!canNext}
                    onClick={() => onPageChange(page + 1)}
                    aria-label="Następna strona"
                >
                    ›
                </button>
            </div>
        </div>
    );
};

export default Pagination;
