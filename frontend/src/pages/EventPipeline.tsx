import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Filter, Plus, SortAsc } from 'lucide-react';
import { useAuth } from '../context/auth';
import { useEvent, useEventKpi, useEventPipeline } from '../hooks/api/events';
import { useIndustries, usePipelineStages, useTags, useUsers } from '../hooks/api/reference';
import PipelineStats from '../components/EventPipeline/PipelineStats';
import KanbanBoard from '../components/EventPipeline/KanbanBoard';
import AddPipelineEntryModal from '../components/modals/AddPipelineEntryModal';
import { formatPLN } from '../lib/format';
import {
    Button,
    Card,
    EmptyState,
    Page,
    PageHeader,
} from '../components/ui';
import type { PipelineEntry } from '../types/api';
import styles from './EventPipeline.module.css';

type SortMode = 'stage_order' | 'company_asc' | 'amount_desc' | 'amount_asc' | 'updated_desc' | 'owner_asc';

interface PipelineFilters {
    q: string;
    ownerUserId: string;
    industryId: string;
    tagId: string;
    minAmount: string;
    maxAmount: string;
}

const DEFAULT_FILTERS: PipelineFilters = {
    q: '',
    ownerUserId: '',
    industryId: '',
    tagId: '',
    minAmount: '',
    maxAmount: '',
};

function amountOf(entry: PipelineEntry): number {
    return Number.parseFloat(entry.agreed_amount ?? entry.expected_amount ?? '0') || 0;
}

function ownerName(entry: PipelineEntry): string {
    if (!entry.owner) return '';
    return `${entry.owner.last_name} ${entry.owner.first_name}`.toLocaleLowerCase('pl-PL');
}

function applyFilters(entries: PipelineEntry[], filters: PipelineFilters) {
    const q = filters.q.trim().toLocaleLowerCase('pl-PL');
    const ownerUserId = filters.ownerUserId ? Number.parseInt(filters.ownerUserId, 10) : null;
    const industryId = filters.industryId ? Number.parseInt(filters.industryId, 10) : null;
    const tagId = filters.tagId ? Number.parseInt(filters.tagId, 10) : null;
    const minAmount = filters.minAmount ? Number.parseFloat(filters.minAmount) : null;
    const maxAmount = filters.maxAmount ? Number.parseFloat(filters.maxAmount) : null;

    return entries.filter((entry) => {
        const company = entry.company;
        if (q) {
            const haystack = [
                company?.name,
                company?.legal_name,
                company?.city,
                company?.industry?.name,
                entry.owner ? `${entry.owner.first_name} ${entry.owner.last_name}` : null,
            ]
                .filter(Boolean)
                .join(' ')
                .toLocaleLowerCase('pl-PL');
            if (!haystack.includes(q)) return false;
        }
        if (ownerUserId != null && entry.owner_user_id !== ownerUserId) return false;
        if (industryId != null && company?.industry_id !== industryId) return false;
        if (tagId != null && !company?.tags?.some((tag) => tag.id === tagId)) return false;
        const amount = amountOf(entry);
        if (minAmount != null && amount < minAmount) return false;
        if (maxAmount != null && amount > maxAmount) return false;
        return true;
    });
}

function applySort(entries: PipelineEntry[], sortMode: SortMode) {
    const sorted = [...entries];
    switch (sortMode) {
        case 'company_asc':
            sorted.sort((a, b) =>
                (a.company?.name ?? '').localeCompare(b.company?.name ?? '', 'pl'),
            );
            break;
        case 'amount_desc':
            sorted.sort((a, b) => amountOf(b) - amountOf(a));
            break;
        case 'amount_asc':
            sorted.sort((a, b) => amountOf(a) - amountOf(b));
            break;
        case 'updated_desc':
            sorted.sort(
                (a, b) =>
                    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
            );
            break;
        case 'owner_asc':
            sorted.sort((a, b) => ownerName(a).localeCompare(ownerName(b), 'pl'));
            break;
        default:
            break;
    }
    return sorted;
}

const EventPipeline: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const eventId = id ? Number.parseInt(id, 10) : null;
    const { role } = useAuth();
    const canManagePipeline = role === 'koordynator';

    const event = useEvent(eventId);
    const kpi = useEventKpi(eventId);
    const pipeline = useEventPipeline(eventId);
    const stages = usePipelineStages();
    const owners = useUsers('opiekun');
    const industries = useIndustries();
    const tags = useTags();

    const [addOpen, setAddOpen] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);
    const [filters, setFilters] = useState<PipelineFilters>(DEFAULT_FILTERS);
    const [sortMode, setSortMode] = useState<SortMode>('stage_order');

    const allEntries = useMemo(() => pipeline.data ?? [], [pipeline.data]);
    const filteredEntries = useMemo(
        () => applySort(applyFilters(allEntries, filters), sortMode),
        [allEntries, filters, sortMode],
    );
    const activeFilterCount = Object.values(filters).filter(Boolean).length;
    const filteredValue = filteredEntries.reduce((sum, entry) => sum + amountOf(entry), 0);

    function patchFilters(next: Partial<PipelineFilters>) {
        setFilters((prev) => ({ ...prev, ...next }));
    }

    function resetFilters() {
        setFilters(DEFAULT_FILTERS);
    }

    if (event.isLoading) {
        return (
            <Page width="full">
                <Card>
                    <EmptyState>Ładowanie lejka…</EmptyState>
                </Card>
            </Page>
        );
    }

    if (event.isError || !event.data) {
        return (
            <Page width="full">
                <Card>
                    <EmptyState title="Błąd">
                        Nie udało się załadować wydarzenia. Wróć do{' '}
                        <Link to="/events">listy wydarzeń</Link>.
                    </EmptyState>
                </Card>
            </Page>
        );
    }

    const ev = event.data;

    return (
        <Page width="full">
            <PageHeader
                title={`Lejek: ${ev.name}`}
                breadcrumb={[
                    { label: 'Wydarzenia', to: '/events' },
                    { label: ev.name, to: `/events/${ev.id}` },
                    { label: 'Lejek' },
                ]}
                subtitle={ev.description ?? undefined}
                actions={
                    <>
                        <Button
                            variant="ghost"
                            size="md"
                            iconLeft={<Filter size={14} />}
                            onClick={() => setFiltersOpen((open) => !open)}
                        >
                            Filtruj{activeFilterCount ? ` (${activeFilterCount})` : ''}
                        </Button>
                        <Button
                            variant="ghost"
                            size="md"
                            iconLeft={<SortAsc size={14} />}
                            onClick={() => setSortOpen((open) => !open)}
                        >
                            Sortuj
                        </Button>
                        <Button
                            variant="primary"
                            iconLeft={<Plus size={14} />}
                            onClick={() => setAddOpen(true)}
                            disabled={!canManagePipeline}
                            title={
                                canManagePipeline
                                    ? undefined
                                    : 'Tylko koordynator może zarządzać lejkiem'
                            }
                        >
                            Dodaj firmę
                        </Button>
                    </>
                }
            />

            <PipelineStats kpi={kpi.data} />

            {(filtersOpen || sortOpen) && (
                <Card padding="compact">
                    <div className={styles.controls}>
                        {filtersOpen && (
                            <div className={styles.controlGroup}>
                                <div className={styles.controlHeader}>
                                    <h2 className={styles.controlTitle}>Filtry lejka</h2>
                                    <button
                                        type="button"
                                        className={styles.linkButton}
                                        onClick={resetFilters}
                                    >
                                        Resetuj
                                    </button>
                                </div>
                                <div className={styles.filterGrid}>
                                    <label className={styles.field}>
                                        <span>Szukaj</span>
                                        <input
                                            className={styles.input}
                                            value={filters.q}
                                            onChange={(e) => patchFilters({ q: e.target.value })}
                                            placeholder="Firma, miasto, opiekun"
                                        />
                                    </label>
                                    <label className={styles.field}>
                                        <span>Opiekun</span>
                                        <select
                                            className={styles.input}
                                            value={filters.ownerUserId}
                                            onChange={(e) =>
                                                patchFilters({ ownerUserId: e.target.value })
                                            }
                                        >
                                            <option value="">Wszyscy</option>
                                            {owners.data?.map((owner) => (
                                                <option key={owner.id} value={owner.id}>
                                                    {owner.first_name} {owner.last_name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className={styles.field}>
                                        <span>Branża</span>
                                        <select
                                            className={styles.input}
                                            value={filters.industryId}
                                            onChange={(e) =>
                                                patchFilters({ industryId: e.target.value })
                                            }
                                        >
                                            <option value="">Wszystkie</option>
                                            {industries.data?.map((industry) => (
                                                <option key={industry.id} value={industry.id}>
                                                    {industry.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className={styles.field}>
                                        <span>Tag</span>
                                        <select
                                            className={styles.input}
                                            value={filters.tagId}
                                            onChange={(e) => patchFilters({ tagId: e.target.value })}
                                        >
                                            <option value="">Wszystkie</option>
                                            {tags.data?.map((tag) => (
                                                <option key={tag.id} value={tag.id}>
                                                    {tag.name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className={styles.field}>
                                        <span>Kwota od</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className={styles.input}
                                            value={filters.minAmount}
                                            onChange={(e) =>
                                                patchFilters({ minAmount: e.target.value })
                                            }
                                        />
                                    </label>
                                    <label className={styles.field}>
                                        <span>Kwota do</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className={styles.input}
                                            value={filters.maxAmount}
                                            onChange={(e) =>
                                                patchFilters({ maxAmount: e.target.value })
                                            }
                                        />
                                    </label>
                                </div>
                            </div>
                        )}

                        {sortOpen && (
                            <div className={styles.controlGroup}>
                                <h2 className={styles.controlTitle}>Sortowanie kart</h2>
                                <label className={styles.field}>
                                    <span>Kolejność w kolumnach</span>
                                    <select
                                        className={styles.input}
                                        value={sortMode}
                                        onChange={(e) => setSortMode(e.target.value as SortMode)}
                                    >
                                        <option value="stage_order">Domyślna kolejność</option>
                                        <option value="company_asc">Nazwa firmy A-Z</option>
                                        <option value="amount_desc">Kwota malejąco</option>
                                        <option value="amount_asc">Kwota rosnąco</option>
                                        <option value="updated_desc">Ostatnia aktualizacja</option>
                                        <option value="owner_asc">Opiekun A-Z</option>
                                    </select>
                                </label>
                            </div>
                        )}

                        <div className={styles.summary}>
                            <strong>{filteredEntries.length}</strong> z {allEntries.length} firm
                            <span>{formatPLN(filteredValue)}</span>
                        </div>
                    </div>
                </Card>
            )}

            {pipeline.isLoading || stages.isLoading ? (
                <Card>
                    <EmptyState>Ładowanie kart…</EmptyState>
                </Card>
            ) : (
                <KanbanBoard
                    eventId={ev.id}
                    stages={stages.data ?? []}
                    entries={filteredEntries}
                    readOnly={!canManagePipeline}
                />
            )}

            <AddPipelineEntryModal
                open={addOpen}
                eventId={ev.id}
                onClose={() => setAddOpen(false)}
            />
        </Page>
    );
};

export default EventPipeline;
