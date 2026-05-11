import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRelationshipManagerDashboard } from '../../hooks/api/dashboard';
import styles from './Dashboards.module.css';

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pl-PL');
}

const DashboardRelationshipManager: React.FC = () => {
    const { userId } = useAuth();
    const dashboard = useRelationshipManagerDashboard(userId);

    return (
        <div className={styles.page}>
            <nav className={styles.breadcrumb}>Dashboard / Opiekun partnerów</nav>
            <h1 className={styles.title}>Opiekun partnerów</h1>

            {dashboard.isLoading && (
                <div className={styles.emptyState}>Ładowanie dashboardu…</div>
            )}

            {dashboard.data && (
                <>
                    <div className={styles.kpiRow}>
                        <div className={`${styles.kpiCard} ${styles.kpiHighlight}`}>
                            <div className={styles.kpiLabel}>Moje firmy w lejku</div>
                            <div className={styles.kpiValue}>
                                {dashboard.data.my_pipeline_count}
                            </div>
                            <div className={styles.kpiSub}>łącznie</div>
                        </div>
                        <div className={styles.kpiCard}>
                            <div className={styles.kpiLabel}>Moje pozyskane partnerstwa</div>
                            <div className={styles.kpiValue}>
                                {dashboard.data.my_won_count}
                            </div>
                            <div className={styles.kpiSub}>łącznie</div>
                        </div>
                        <div className={styles.kpiCard}>
                            <div className={styles.kpiLabel}>Zaległe zadania</div>
                            <div className={styles.kpiValue}>
                                {dashboard.data.overdue_activities.length}
                            </div>
                            <div className={styles.kpiSub}>do wykonania</div>
                        </div>
                    </div>

                    <div className={styles.sectionGrid}>
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Zaległe</h2>
                            <div className={styles.list}>
                                {dashboard.data.overdue_activities.length === 0 && (
                                    <div className={styles.emptyState}>
                                        Brak zaległych zadań.
                                    </div>
                                )}
                                {dashboard.data.overdue_activities.map((act) => (
                                    <div
                                        key={act.id}
                                        className={`${styles.listItem} ${styles.overdueItem}`}
                                    >
                                        <div className={styles.listItemTitle}>
                                            {act.subject}
                                        </div>
                                        <div className={styles.listItemSub}>
                                            {act.company_name ?? '—'} ·{' '}
                                            {formatDate(act.activity_date)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Moje ostatnie aktywności</h2>
                            <div className={styles.list}>
                                {dashboard.data.my_recent_activities.length === 0 && (
                                    <div className={styles.emptyState}>
                                        Brak aktywności.
                                    </div>
                                )}
                                {dashboard.data.my_recent_activities.map((act) => (
                                    <div key={act.id} className={styles.listItem}>
                                        <div className={styles.listItemTitle}>
                                            {act.subject}
                                        </div>
                                        <div className={styles.listItemSub}>
                                            {act.company_name ?? '—'} ·{' '}
                                            {formatDate(act.activity_date)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </>
            )}
        </div>
    );
};

export default DashboardRelationshipManager;
