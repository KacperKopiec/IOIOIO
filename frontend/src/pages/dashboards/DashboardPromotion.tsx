import React from 'react';
import { usePromotionDashboard } from '../../hooks/api/dashboard';
import { formatDateRange, formatPercent } from '../../lib/format';
import styles from './Dashboards.module.css';

const DashboardPromotion: React.FC = () => {
    const dashboard = usePromotionDashboard();

    return (
        <div className={styles.page}>
            <nav className={styles.breadcrumb}>Dashboard / Dział promocji</nav>
            <h1 className={styles.title}>Dział promocji</h1>

            {dashboard.isLoading && (
                <div className={styles.emptyState}>Ładowanie wydarzeń…</div>
            )}
            {dashboard.isError && (
                <div className={styles.emptyState}>Nie udało się pobrać danych.</div>
            )}
            {dashboard.data && dashboard.data.active_events.length === 0 && (
                <div className={styles.emptyState}>
                    Brak aktywnych ani planowanych wydarzeń.
                </div>
            )}

            <div className={styles.cardGrid}>
                {dashboard.data?.active_events.map((event) => {
                    const target = event.target_partners_count ?? 0;
                    const partnersLabel = target
                        ? `${event.partners_count}/${target}`
                        : `${event.partners_count}`;
                    return (
                        <article key={event.id} className={styles.eventCard}>
                            <div className={styles.eventCardName}>{event.name}</div>
                            <div className={styles.eventCardDate}>
                                {formatDateRange(event.start_date, event.end_date)}
                            </div>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{
                                        width: `${Math.min(event.progress_pct * 100, 100)}%`,
                                    }}
                                />
                            </div>
                            <div className={styles.progressLabel}>
                                <span>Partnerzy: {partnersLabel}</span>
                                <span>{formatPercent(event.progress_pct)} budżetu</span>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
};

export default DashboardPromotion;
