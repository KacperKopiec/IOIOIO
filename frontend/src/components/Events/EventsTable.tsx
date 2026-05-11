import React from 'react';
import EventRow, { type EventRowData } from './EventRow';
import type { PageMeta } from '../../types/api';
import styles from './EventsTable.module.css';

interface EventsTableProps {
    events: EventRowData[];
    meta: PageMeta | undefined;
    isLoading: boolean;
    isError: boolean;
    onPageChange: (page: number) => void;
}

const EventsTable: React.FC<EventsTableProps> = ({
    events,
    meta,
    isLoading,
    isError,
    onPageChange,
}) => {
    const totalShown = events.length;
    const startIdx = meta ? (meta.page - 1) * meta.page_size + 1 : 0;
    const endIdx = meta ? startIdx + totalShown - 1 : 0;
    const canPrev = meta ? meta.page > 1 : false;
    const canNext = meta ? meta.page < meta.pages : false;

    return (
        <div className={styles.card}>
            <div className={styles.table}>
                <div className={styles.headerRow}>
                    <div className={styles.headerCell} style={{ width: '64px' }}>
                        <input type="checkbox" className={styles.headerCheckbox} />
                    </div>
                    <div className={styles.headerCell} style={{ width: '310px' }}>
                        NAZWA
                    </div>
                    <div className={styles.headerCell} style={{ width: '125px' }}>
                        DATA
                    </div>
                    <div className={styles.headerCell} style={{ width: '190px' }}>
                        KOORDYNATOR
                    </div>
                    <div className={styles.headerCell} style={{ width: '125px' }}>
                        PARTNERZY
                    </div>
                    <div className={styles.headerCell} style={{ width: '153px' }}>
                        STATUS
                    </div>
                </div>

                <div className={styles.body}>
                    {isLoading && (
                        <div className={styles.emptyState}>Ładowanie wydarzeń…</div>
                    )}
                    {isError && !isLoading && (
                        <div className={styles.emptyState}>
                            Nie udało się pobrać wydarzeń.
                        </div>
                    )}
                    {!isLoading && !isError && events.length === 0 && (
                        <div className={styles.emptyState}>
                            Brak wydarzeń spełniających wybrane filtry.
                        </div>
                    )}
                    {!isLoading &&
                        !isError &&
                        events.map((event) => <EventRow key={event.id} event={event} />)}
                </div>
            </div>

            <div className={styles.pagination}>
                <span className={styles.paginationText}>
                    {meta && totalShown > 0
                        ? `Pokazano ${startIdx}-${endIdx} z ${meta.total} wydarzeń`
                        : '—'}
                </span>
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

export default EventsTable;
