import React, { useEffect, useState } from 'react';
import { useEvents } from '../../hooks/api/events';
import { useCoordinatorDashboard } from '../../hooks/api/dashboard';
import { formatDateRange, formatPLN, formatPercent } from '../../lib/format';
import styles from './Dashboards.module.css';

const DashboardCoordinator: React.FC = () => {
    const events = useEvents({ status: 'active', page: 1, page_size: 50 });
    const [eventId, setEventId] = useState<number | null>(null);

    useEffect(() => {
        if (eventId == null && events.data && events.data.items.length > 0) {
            setEventId(events.data.items[0].id);
        }
    }, [events.data, eventId]);

    const dashboard = useCoordinatorDashboard(eventId);

    return (
        <div className={styles.page}>
            <nav className={styles.breadcrumb}>Dashboard / Koordynator wydarzenia</nav>
            <h1 className={styles.title}>Koordynator wydarzenia</h1>

            <div className={styles.toolbar}>
                <span className={styles.label}>Wydarzenie:</span>
                <select
                    className={styles.select}
                    value={eventId ?? ''}
                    onChange={(e) =>
                        setEventId(
                            e.target.value ? Number.parseInt(e.target.value, 10) : null,
                        )
                    }
                >
                    <option value="">— wybierz —</option>
                    {events.data?.items.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                            {ev.name}{' '}
                            {ev.start_date ? `(${formatDateRange(ev.start_date, ev.end_date)})` : ''}
                        </option>
                    ))}
                </select>
            </div>

            {eventId == null && (
                <div className={styles.emptyState}>
                    Wybierz aktywne wydarzenie, aby zobaczyć metryki.
                </div>
            )}

            {dashboard.isLoading && (
                <div className={styles.emptyState}>Ładowanie dashboardu…</div>
            )}

            {dashboard.data && (
                <>
                    <div className={styles.kpiRow}>
                        <div className={`${styles.kpiCard} ${styles.kpiHighlight}`}>
                            <div className={styles.kpiLabel}>Aktywne partnerstwa</div>
                            <div className={styles.kpiValue}>
                                {dashboard.data.kpi_partners_count}
                            </div>
                            <div className={styles.kpiSub}>
                                {formatPercent(dashboard.data.kpi_progress_partners_pct)} celu
                            </div>
                        </div>
                        <div className={styles.kpiCard}>
                            <div className={styles.kpiLabel}>Wartość współpracy</div>
                            <div className={styles.kpiValue}>
                                {formatPLN(dashboard.data.kpi_total_value)}
                            </div>
                            <div className={styles.kpiSub}>
                                {formatPercent(dashboard.data.kpi_progress_budget_pct)} budżetu
                            </div>
                        </div>
                        <div className={styles.kpiCard}>
                            <div className={styles.kpiLabel}>W lejku</div>
                            <div className={styles.kpiValue}>
                                {dashboard.data.kpi_pipeline_count}
                            </div>
                            <div className={styles.kpiSub}>firm w pipeline</div>
                        </div>
                    </div>

                    <div className={styles.sectionGrid}>
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Nadchodzące zadania</h2>
                            <div className={styles.list}>
                                {dashboard.data.upcoming_tasks.length === 0 && (
                                    <div className={styles.emptyState}>
                                        Brak zaplanowanych zadań.
                                    </div>
                                )}
                                {dashboard.data.upcoming_tasks.map((task) => (
                                    <div key={task.id} className={styles.listItem}>
                                        <div className={styles.listItemTitle}>
                                            {task.subject}
                                        </div>
                                        <div className={styles.listItemSub}>
                                            {task.company_name ?? '—'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Ostatnie aktywności</h2>
                            <div className={styles.list}>
                                {dashboard.data.recent_activities.length === 0 && (
                                    <div className={styles.emptyState}>
                                        Brak aktywności.
                                    </div>
                                )}
                                {dashboard.data.recent_activities.map((act) => (
                                    <div key={act.id} className={styles.listItem}>
                                        <div className={styles.listItemTitle}>
                                            {act.subject}
                                        </div>
                                        <div className={styles.listItemSub}>
                                            {act.company_name ?? '—'} ·{' '}
                                            {act.activity_date
                                                ? new Date(act.activity_date).toLocaleDateString(
                                                    'pl-PL',
                                                )
                                                : '—'}
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

export default DashboardCoordinator;
