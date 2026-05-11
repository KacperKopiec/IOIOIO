import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Briefcase, CheckCheck, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRelationshipManagerDashboard } from '../../hooks/api/dashboard';
import { formatPercent } from '../../lib/format';
import type { RecentActivityBrief } from '../../types/api';
import styles from './Dashboards.module.css';

function formatRelative(iso: string | null): string {
    if (!iso) return '—';
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.round(diffMs / (24 * 60 * 60_000));
    if (diffMs > 0 && diffDays === 0) return 'dzisiaj';
    if (diffMs > 0 && diffDays === 1) return 'wczoraj';
    if (diffMs > 0 && diffDays < 7) return `${diffDays} dni temu`;
    if (diffMs < 0 && diffDays === 0) return 'dzisiaj';
    if (diffMs < 0 && Math.abs(diffDays) === 1) return 'jutro';
    if (diffMs < 0 && Math.abs(diffDays) < 14) return `za ${Math.abs(diffDays)} dni`;
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' });
}

const DashboardRelationshipManager: React.FC = () => {
    const { userId, userName } = useAuth();
    const dashboard = useRelationshipManagerDashboard(userId);

    const overdue = dashboard.data?.overdue_activities ?? [];
    const recent = dashboard.data?.my_recent_activities ?? [];
    const pipeline = dashboard.data?.my_pipeline_count ?? 0;
    const won = dashboard.data?.my_won_count ?? 0;
    const closeRate = pipeline > 0 ? won / pipeline : null;

    return (
        <div className={styles.page}>
            <header className={styles.headerBlock}>
                <span className={styles.breadcrumb}>Dashboard / Opiekun partnerów</span>
                <h1 className={styles.title}>Witaj, {userName.split(' ')[0]}</h1>
                <span className={styles.subtitle}>
                    Twoje firmy w lejku, zaległe zadania i ostatnie aktywności.
                </span>
            </header>

            <div className={styles.kpiRow}>
                <KpiCard
                    icon={<Users size={20} />}
                    iconClass={styles.kpiIcon}
                    label="W lejku"
                    value={`${pipeline}`}
                    sub="firm pod moją opieką"
                />
                <KpiCard
                    icon={<CheckCheck size={20} />}
                    iconClass={styles.kpiIconGreen}
                    label="Pozyskani partnerzy"
                    value={`${won}`}
                    sub={
                        closeRate != null
                            ? `Skuteczność: ${formatPercent(closeRate, 0)}`
                            : 'brak danych'
                    }
                />
                <KpiCard
                    icon={<AlertTriangle size={20} />}
                    iconClass={styles.kpiIconRose}
                    label="Zaległe zadania"
                    value={`${overdue.length}`}
                    sub="wymagają reakcji"
                />
                <KpiCard
                    icon={<Briefcase size={20} />}
                    iconClass={styles.kpiIconIndigo}
                    label="Ostatnich aktywności"
                    value={`${recent.length}`}
                    sub="w ostatnim czasie"
                />
            </div>

            <div className={styles.sectionGrid}>
                <section className={styles.section}>
                    <div className={styles.sectionHead}>
                        <h2 className={styles.sectionTitle}>Zaległe</h2>
                        <Link to="/firms" className={styles.sectionAction}>
                            Zobacz wszystkie
                        </Link>
                    </div>
                    {dashboard.isLoading ? (
                        <div className={styles.emptyState}>Ładowanie…</div>
                    ) : overdue.length === 0 ? (
                        <div className={styles.emptyState}>Brak zaległych zadań.</div>
                    ) : (
                        <div className={styles.list}>
                            {overdue.map((act) => (
                                <ActivityRow key={act.id} activity={act} variant="overdue" />
                            ))}
                        </div>
                    )}
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHead}>
                        <h2 className={styles.sectionTitle}>Moje ostatnie aktywności</h2>
                    </div>
                    {dashboard.isLoading ? (
                        <div className={styles.emptyState}>Ładowanie…</div>
                    ) : recent.length === 0 ? (
                        <div className={styles.emptyState}>Brak aktywności.</div>
                    ) : (
                        <div className={styles.list}>
                            {recent.map((act) => (
                                <ActivityRow key={act.id} activity={act} variant="regular" />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

interface KpiCardProps {
    icon: React.ReactNode;
    iconClass: string;
    label: string;
    value: string;
    sub: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, iconClass, label, value, sub }) => (
    <div className={styles.kpiCard}>
        <span className={iconClass}>{icon}</span>
        <div className={styles.kpiBody}>
            <div className={styles.kpiLabel}>{label}</div>
            <div className={styles.kpiValue}>{value}</div>
            <div className={styles.kpiSub}>{sub}</div>
        </div>
    </div>
);

interface ActivityRowProps {
    activity: RecentActivityBrief;
    variant: 'regular' | 'overdue';
}

const ActivityRow: React.FC<ActivityRowProps> = ({ activity, variant }) => {
    const itemClass =
        variant === 'overdue'
            ? `${styles.listItem} ${styles.overdueItem}`
            : styles.listItem;
    return (
        <div className={itemClass}>
            <div className={styles.listItemBody}>
                <span className={styles.listItemTitle}>{activity.subject}</span>
                <span className={styles.listItemSub}>
                    {activity.company_name ?? '—'}
                    {activity.event_name ? ` · ${activity.event_name}` : ''}
                </span>
            </div>
            <span className={styles.listItemDate}>
                {formatRelative(activity.activity_date)}
            </span>
        </div>
    );
};

export default DashboardRelationshipManager;
