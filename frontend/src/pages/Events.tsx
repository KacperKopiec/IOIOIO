import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import EventsFilterSidebar from '../components/Events/EventsFilterSidebar';
import EventsTable from '../components/Events/EventsTable';
import type { EventRowData } from '../components/Events/EventRow';
import AddEventModal from '../components/modals/AddEventModal';
import { useEvents, type EventFilters } from '../hooks/api/events';
import { usePipelineEntries } from '../hooks/api/pipeline';
import { ownerInitials } from '../lib/format';
import styles from './Events.module.css';

const DEFAULT_FILTERS: EventFilters = { page: 1, page_size: 25 };

const Events: React.FC = () => {
    const [filters, setFilters] = useState<EventFilters>(DEFAULT_FILTERS);
    const [addOpen, setAddOpen] = useState(false);
    const eventsQuery = useEvents(filters);
    const allEntries = usePipelineEntries({});

    const rows: EventRowData[] = useMemo(() => {
        const events = eventsQuery.data?.items ?? [];
        const wonCountByEvent = new Map<number, number>();
        for (const entry of allEntries.data ?? []) {
            if (entry.stage?.outcome === 'won') {
                wonCountByEvent.set(
                    entry.event_id,
                    (wonCountByEvent.get(entry.event_id) ?? 0) + 1,
                );
            }
        }
        return events.map((e) => ({
            id: e.id,
            name: e.name,
            start_date: e.start_date,
            end_date: e.end_date,
            status: e.status,
            owner_name: e.owner
                ? `${e.owner.first_name} ${e.owner.last_name}`
                : null,
            owner_initials: e.owner
                ? ownerInitials(e.owner.first_name, e.owner.last_name)
                : '?',
            partners_count: wonCountByEvent.get(e.id) ?? 0,
        }));
    }, [eventsQuery.data, allEntries.data]);

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <nav className={styles.breadcrumb}>
                        <span className={styles.breadcrumbItem}>Panel</span>
                        <span className={styles.breadcrumbSeparator}>/</span>
                        <span className={styles.breadcrumbItem}>Wydarzenia</span>
                    </nav>
                    <h1 className={styles.title}>Wydarzenia</h1>
                </div>
                <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={() => setAddOpen(true)}
                >
                    <Plus size={14} /> Dodaj wydarzenie
                </button>
            </div>

            <div className={styles.mainContent}>
                <div className={styles.filterColumn}>
                    <EventsFilterSidebar filters={filters} onChange={setFilters} />
                </div>
                <div className={styles.tableColumn}>
                    <EventsTable
                        events={rows}
                        meta={eventsQuery.data?.meta}
                        isLoading={eventsQuery.isLoading}
                        isError={eventsQuery.isError}
                        onPageChange={(page) =>
                            setFilters((prev) => ({ ...prev, page }))
                        }
                    />
                </div>
            </div>

            <AddEventModal open={addOpen} onClose={() => setAddOpen(false)} />
        </div>
    );
};

export default Events;
