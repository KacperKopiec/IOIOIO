import React from 'react';
import styles from './Firms.module.css';
import FilterSidebar from '../components/Firms/FilterSidebar';
import FirmsTable from '../components/Firms/FirmsTable';
import ActionBar from '../components/Firms/ActionBar';

const Firms: React.FC = () => {
    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <nav className={styles.breadcrumb}>Baza Firm</nav>
                    <h1 className={styles.title}>Baza Firm</h1>
                </div>

                <div className={styles.mainSplit}>
                    <aside className={styles.leftCol}>
                        <FilterSidebar />
                    </aside>

                    <section className={styles.rightCol}>
                        <ActionBar />
                        <FirmsTable />
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Firms;
