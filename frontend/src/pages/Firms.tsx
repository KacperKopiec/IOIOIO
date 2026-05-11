import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import styles from './Firms.module.css';
import FilterSidebar from '../components/Firms/FilterSidebar';
import FirmsTable from '../components/Firms/FirmsTable';
import ActionBar from '../components/Firms/ActionBar';
import AddCompanyModal from '../components/modals/AddCompanyModal';
import { Button, Page, PageHeader } from '../components/ui';
import { useCompanies, type CompanyFilters } from '../hooks/api/companies';

const DEFAULT_FILTERS: CompanyFilters = { page: 1, page_size: 25 };

const Firms: React.FC = () => {
    const [filters, setFilters] = useState<CompanyFilters>(DEFAULT_FILTERS);
    const [searchInput, setSearchInput] = useState('');
    const [addOpen, setAddOpen] = useState(false);

    const handleSubmitSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFilters((prev) => ({ ...prev, q: searchInput || undefined, page: 1 }));
    };

    const query = useCompanies(filters);

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
                    <ActionBar />
                    <FirmsTable
                        companies={query.data?.items ?? []}
                        meta={query.data?.meta}
                        isLoading={query.isLoading}
                        isError={query.isError}
                        onPageChange={(page) =>
                            setFilters((prev) => ({ ...prev, page }))
                        }
                    />
                </section>
            </div>

            <AddCompanyModal open={addOpen} onClose={() => setAddOpen(false)} />
        </Page>
    );
};

export default Firms;
