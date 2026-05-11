import React, { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import EventsFilterSidebar from '../components/Events/EventsFilterSidebar';
import EventsTable from '../components/Events/EventsTable';
import type { EventRowData } from '../components/Events/EventRow';
import AddEventModal from '../components/modals/AddEventModal';
import { Button, Page, PageHeader } from '../components/ui';
import { useEvents, type EventFilters } from '../hooks/api/events';
import { usePipelineEntries } from '../hooks/api/pipeline';
import styles from './Events.module.css';

const DEFAULT_FILTERS: EventFilters = { page: 1, page_size: 25 };

const Events: React.FC = () => {
    const [filters, setFilters] = useState<EventFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [addOpen, setAddOpen] = useState(false);

    const handleSubmitSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFilters((prev) => ({ ...prev, q: searchInput || undefined, page: 1 }));
    };

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
            tags: e.tags,
            partners_count: wonCountByEvent.get(e.id) ?? 0,
            target_partners_count: e.target_partners_count,
        }));
    }, [eventsQuery.data, allEntries.data]);

    return (
        <Page width="wide">
            <PageHeader
                title="Wydarzenia"
                breadcrumb={[{ label: 'Wydarzenia' }]}
                actions={
                    <Button
                        variant="primary"
                        iconLeft={<Plus size={14} />}
                        onClick={() => setAddOpen(true)}
                    >
                        Dodaj wydarzenie
                    </Button>
                }
            />

            <form onSubmit={handleSubmitSearch} className={styles.searchRow}>
                <div className={styles.searchField}>
                    <Search size={16} className={styles.searchIcon} />
                    <input
                        type="search"
                        className={styles.searchInput}
                        placeholder="Szukaj po nazwie lub opisie wydarzenia…"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>
                <Button type="submit" variant="primary">
                    Szukaj
                </Button>
            </form>

            <div className={styles.mainSplit}>
                <aside className={styles.leftCol}>
                    <EventsFilterSidebar filters={filters} onChange={setFilters} />
                </aside>

                <section className={styles.rightCol}>
                    <EventsTable
                        events={rows}
                        meta={eventsQuery.data?.meta}
                        isLoading={eventsQuery.isLoading}
                        isError={eventsQuery.isError}
                        onPageChange={(page) =>
                            setFilters((prev) => ({ ...prev, page }))
                        }
                    />
                </section>
            </div>

            <AddEventModal open={addOpen} onClose={() => setAddOpen(false)} />
        </Page>
    );
};

export default Events;
