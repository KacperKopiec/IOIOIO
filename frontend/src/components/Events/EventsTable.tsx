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
            <div className={styles.headerRow}>
                <div className={styles.checkboxHeader}></div>
                <div className={styles.nameHeader}>Nazwa wydarzenia / Data</div>
                <div className={styles.tagsHeader}>Tagi</div>
                <div className={styles.coordinatorHeader}>Koordynator</div>
                <div className={styles.statusHeader}>Status</div>
                <div className={styles.partnersHeader}>Partnerzy</div>
            </div>

            <div className={styles.body}>
                {isLoading && (
                    <div className={styles.emptyState}>Ładowanie wydarzeń…</div>
                )}
                {isError && !isLoading && (
                    <div className={styles.emptyState}>
                        Nie udało się pobrać wydarzeń. Spróbuj odświeżyć stronę.
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

            <div className={styles.pagination}>
                {meta && totalShown > 0 ? (
                    <span>
                        Pokazano {startIdx}-{endIdx} z {meta.total} wydarzeń
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

export default EventsTable;
