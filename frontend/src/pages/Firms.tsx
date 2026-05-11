import React, { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import styles from './Firms.module.css';
import FilterSidebar from '../components/Firms/FilterSidebar';
import FirmsTable from '../components/Firms/FirmsTable';
import ActionBar from '../components/Firms/ActionBar';
import AddCompanyModal from '../components/modals/AddCompanyModal';
import BulkAddTagsModal from '../components/modals/BulkAddTagsModal';
import { Button, Page, PageHeader } from '../components/ui';
import { useCompanies, type CompanyFilters } from '../hooks/api/companies';

const DEFAULT_FILTERS: CompanyFilters = { page: 1, page_size: 25 };

const Firms: React.FC = () => {
    const [filters, setFilters] = useState<CompanyFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [addOpen, setAddOpen] = useState(false);
    const [bulkTagOpen, setBulkTagOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

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
                    <Button
                        variant="primary"
                        iconLeft={<Plus size={14} />}
                        onClick={() => setAddOpen(true)}
                    >
                        Dodaj firmę
                    </Button>
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
                        onAddTags={() => setBulkTagOpen(true)}
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
        </Page>
    );
};

export default Firms;
