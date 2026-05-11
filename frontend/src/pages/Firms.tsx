import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import styles from './Firms.module.css';
import FilterSidebar from '../components/Firms/FilterSidebar';
import FirmsTable from '../components/Firms/FirmsTable';
import ActionBar from '../components/Firms/ActionBar';
import AddCompanyModal from '../components/modals/AddCompanyModal';
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
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <nav className={styles.breadcrumb}>Baza Firm</nav>
                        <h1 className={styles.title}>Baza Firm</h1>
                    </div>
                    <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={() => setAddOpen(true)}
                    >
                        <Plus size={14} /> Dodaj firmę
                    </button>
                </div>

                <form onSubmit={handleSubmitSearch} className={styles.searchRow}>
                    <input
                        type="search"
                        className={styles.searchInput}
                        placeholder="Szukaj po nazwie, NIP lub mieście…"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <button type="submit" className={styles.searchBtn}>
                        Szukaj
                    </button>
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
            </div>
            <AddCompanyModal open={addOpen} onClose={() => setAddOpen(false)} />
        </div>
    );
};

export default Firms;
