import React, { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import styles from './Firms.module.css';
import FilterSidebar from '../components/Firms/FilterSidebar';
import FirmsTable from '../components/Firms/FirmsTable';
import ActionBar from '../components/Firms/ActionBar';
import AddCompanyModal from '../components/modals/AddCompanyModal';
import BulkSeedPipelineModal from '../components/modals/BulkSeedPipelineModal';
import BulkAddTagsModal from '../components/modals/BulkAddTagsModal';
import { Button, Page, PageHeader } from '../components/ui';
import { useAuth } from '../context/auth';
import {
    exportCompaniesCsv,
    useCompanies,
    type CompanyFilters,
} from '../hooks/api/companies';

const DEFAULT_FILTERS: CompanyFilters = { page: 1, page_size: 25 };

const Firms: React.FC = () => {
    const [filters, setFilters] = useState<CompanyFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [addOpen, setAddOpen] = useState(false);
    const [bulkTagOpen, setBulkTagOpen] = useState(false);
    const [bulkSeedOpen, setBulkSeedOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const { role } = useAuth();
    const canManageCompanies = role === 'opiekun';
    const canSeedPipeline = true;
    const isKoordynator = role === 'koordynator';

    const handleSubmitSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFilters((prev) => ({ ...prev, q: searchInput || undefined, page: 1 }));
    };

    const query = useCompanies(filters);
    const companies = useMemo(() => query.data?.items ?? [], [query.data]);
    const visibleIds = useMemo(() => companies.map((c) => c.id), [companies]);

    function handleToggleRow(id: number, next: boolean) {
        setSelectedIds((prev) => {
            const updated = new Set(prev);
            if (next) updated.add(id);
            else updated.delete(id);
            return updated;
        });
    }

    function handleToggleAll(next: boolean) {
        setSelectedIds((prev) => {
            const updated = new Set(prev);
            if (next) {
                for (const id of visibleIds) updated.add(id);
            } else {
                for (const id of visibleIds) updated.delete(id);
            }
            return updated;
        });
    }

    function handlePageChange(page: number) {
        setFilters((prev) => ({ ...prev, page }));
    }

    async function handleExportCsv() {
        setIsExporting(true);
        try {
            const ids = selectedIds.size > 0 ? Array.from(selectedIds) : undefined;
            const blob = await exportCompaniesCsv(filters, ids);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `firmy-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 0);
        } catch (error) {
            console.error(error);
            window.alert('Nie udało się wyeksportować firm do CSV.');
        } finally {
            setIsExporting(false);
        }
    }

    const allVisibleSelected =
        visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

    const selectedCompanies = useMemo(
        () => companies.filter((c) => selectedIds.has(c.id)),
        [companies, selectedIds],
    );

    return (
        <Page width="wide">
            <PageHeader
                title="Baza firm"
                breadcrumb={[{ label: 'Baza firm' }]}
                actions={
                    canManageCompanies ? (
                        <Button
                            variant="primary"
                            iconLeft={<Plus size={14} />}
                            onClick={() => setAddOpen(true)}
                        >
                            Dodaj firmę
                        </Button>
                    ) : undefined
                }
            />

            <form onSubmit={handleSubmitSearch} className={styles.searchRow}>
                <div className={styles.searchField}>
                    <Search size={16} className={styles.searchIcon} />
                    <input
                        type="search"
                        className={styles.searchInput}
                        placeholder="Szukaj po nazwie, NIP lub mieście…"
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
                    <FilterSidebar filters={filters} onChange={setFilters} />
                </aside>

                <section className={styles.rightCol}>
                    <ActionBar
                        selectedCount={selectedCompanies.length}
                        visibleCount={visibleIds.length}
                        allSelected={allVisibleSelected}
                        onToggleAll={handleToggleAll}
                        onAddTags={canManageCompanies ? () => setBulkTagOpen(true) : undefined}
                        onSeedPipeline={canSeedPipeline ? () => setBulkSeedOpen(true) : undefined}
                        onExportCsv={handleExportCsv}
                        isExporting={isExporting}
                    />
                    <FirmsTable
                        companies={companies}
                        meta={query.data?.meta}
                        isLoading={query.isLoading}
                        isError={query.isError}
                        onPageChange={handlePageChange}
                        selectedIds={selectedIds}
                        onToggleRow={handleToggleRow}
                    />
                </section>
            </div>

            <AddCompanyModal open={addOpen} onClose={() => setAddOpen(false)} />
            <BulkAddTagsModal
                open={bulkTagOpen}
                companies={selectedCompanies}
                onClose={() => setBulkTagOpen(false)}
                onDone={() => setSelectedIds(new Set())}
            />
            <BulkSeedPipelineModal
                open={bulkSeedOpen}
                companies={selectedCompanies}
                restricted={!isKoordynator}
                onClose={() => setBulkSeedOpen(false)}
                onDone={() => setSelectedIds(new Set())}
            />
        </Page>
    );
};

export default Firms;
