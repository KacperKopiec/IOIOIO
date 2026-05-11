import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Briefcase, CheckCheck, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRelationshipManagerDashboard } from '../../hooks/api/dashboard';
import { formatPercent } from '../../lib/format';
import {
    Card,
    CardHeader,
    EmptyState,
    KpiCard,
    Page,
    PageHeader,
} from '../../components/ui';
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
        <Page width="wide">
            <PageHeader
                title={`Witaj, ${userName.split(' ')[0]}`}
                breadcrumb={[{ label: 'Dashboard' }, { label: 'Opiekun partnerów' }]}
                subtitle="Twoje firmy w lejku, zaległe zadania i ostatnie aktywności."
            />

            <div className={styles.kpiRow}>
                <KpiCard
                    icon={<Users size={20} />}
                    tone="brand"
                    label="W lejku"
                    value={`${pipeline}`}
                    sub="firm pod moją opieką"
                />
                <KpiCard
                    icon={<CheckCheck size={20} />}
                    tone="success"
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
                    tone="danger"
                    label="Zaległe zadania"
                    value={`${overdue.length}`}
                    sub="wymagają reakcji"
                />
                <KpiCard
                    icon={<Briefcase size={20} />}
                    tone="indigo"
                    label="Ostatnich aktywności"
                    value={`${recent.length}`}
                    sub="w ostatnim czasie"
                />
            </div>

            <div className={styles.sectionGrid}>
                <Card padding="compact">
                    <CardHeader
                        title="Zaległe"
                        action={
                            <Link to="/firms" className={styles.sectionAction}>
                                Zobacz wszystkie
                            </Link>
                        }
                    />
                    {dashboard.isLoading ? (
                        <EmptyState compact>Ładowanie…</EmptyState>
                    ) : overdue.length === 0 ? (
                        <EmptyState compact>Brak zaległych zadań.</EmptyState>
                    ) : (
                        <div className={styles.activityList}>
                            {overdue.map((act) => (
                                <ActivityRow
                                    key={act.id}
                                    activity={act}
                                    variant="overdue"
                                />
                            ))}
                        </div>
                    )}
                </Card>

                <Card padding="compact">
                    <CardHeader title="Moje ostatnie aktywności" />
                    {dashboard.isLoading ? (
                        <EmptyState compact>Ładowanie…</EmptyState>
                    ) : recent.length === 0 ? (
                        <EmptyState compact>Brak aktywności.</EmptyState>
                    ) : (
                        <div className={styles.activityList}>
                            {recent.map((act) => (
                                <ActivityRow
                                    key={act.id}
                                    activity={act}
                                    variant="regular"
                                />
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </Page>
    );
};

interface ActivityRowProps {
    activity: RecentActivityBrief;
    variant: 'regular' | 'overdue';
}

const ActivityRow: React.FC<ActivityRowProps> = ({ activity, variant }) => (
    <div
        className={`${styles.activityRow} ${variant === 'overdue' ? styles.activityRowOverdue : ''
            }`}
    >
        <div className={styles.activityBody}>
            <span className={styles.activityTitle}>{activity.subject}</span>
            <span className={styles.activitySub}>
                {activity.company_name ?? '—'}
                {activity.event_name ? ` · ${activity.event_name}` : ''}
            </span>
        </div>
        <span className={styles.activityDate}>
            {formatRelative(activity.activity_date)}
        </span>
    </div>
);

export default DashboardRelationshipManager;
