import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Briefcase, CalendarDays, Target } from 'lucide-react';
import { useAuth } from '../../context/auth';
import { useActivities } from '../../hooks/api/activities';
import { useEvents } from '../../hooks/api/events';
import { usePipelineEntries } from '../../hooks/api/pipeline';
import { formatDate, formatDateRange, formatPLN, formatPercent } from '../../lib/format';
import {
    Badge,
    Card,
    CardHeader,
    EmptyState,
    KpiCard,
    Page,
    PageHeader,
    ProgressBar,
} from '../../components/ui';
import type { BadgeTone } from '../../components/ui';
import type { Event, EventStatus, PipelineEntry } from '../../types/api';
import styles from './Dashboards.module.css';

const STATUS_TONE: Record<EventStatus, BadgeTone> = {
    active: 'success',
    draft: 'warning',
    closed: 'neutral',
    cancelled: 'danger',
};

const STATUS_LABEL: Record<EventStatus, string> = {
    active: 'Aktywne',
    draft: 'Wersja robocza',
    closed: 'Zakończone',
    cancelled: 'Anulowane',
};

const DashboardCoordinator: React.FC = () => {
    const { userId, userName } = useAuth();
    const myEvents = useEvents({
        owner_user_id: userId,
        page: 1,
        page_size: 50,
    });
    const allEvents = useEvents({ page: 1, page_size: 50 });
    const allEntries = usePipelineEntries({});
    const overdueFollowUps = useActivities({
        assigned_user_id: userId ?? undefined,
        overdue_only: true,
        limit: 8,
    });

    const events =
        (myEvents.data?.items?.length ?? 0) > 0
            ? myEvents.data!.items
            : allEvents.data?.items ?? [];

    const stats = computeStats(events, allEntries.data ?? []);
    const overdueActions = (overdueFollowUps.data ?? []).filter((activity) =>
        ['task', 'follow_up'].includes(activity.activity_type),
    );

    return (
        <Page width="wide">
            <PageHeader
                title={`Witaj, ${userName.split(' ')[0]}`}
                breadcrumb={[{ label: 'Dashboard' }, { label: 'Koordynator wydarzenia' }]}
                subtitle="Twoje wydarzenia i ich aktualne metryki."
            />

            <div className={styles.kpiRow}>
                <KpiCard
                    icon={<CalendarDays size={20} />}
                    tone="brand"
                    label="Moje wydarzenia"
                    value={`${stats.myActive}`}
                    sub={`${events.length} łącznie`}
                />
                <KpiCard
                    icon={<Briefcase size={20} />}
                    tone="success"
                    label="Pozyskani partnerzy"
                    value={`${stats.partners}`}
                    sub={`${stats.pipelineCount} firm w lejku`}
                />
                <KpiCard
                    icon={<Target size={20} />}
                    tone="indigo"
                    label="Łączna wartość"
                    value={formatPLN(stats.totalValue)}
                    sub={
                        stats.conversion != null
                            ? `Konwersja: ${formatPercent(stats.conversion, 1)}`
                            : 'Brak danych konwersji'
                    }
                />
                <KpiCard
                    icon={<AlertTriangle size={20} />}
                    tone="danger"
                    label="Zaległe follow-upy"
                    value={`${overdueActions.length}`}
                    sub="Wymagają ponowienia kontaktu"
                />
            </div>

            <Card padding="compact">
                <CardHeader title="Przypomnienia o follow-upach" />
                {overdueFollowUps.isLoading ? (
                    <EmptyState compact>Ładowanie przypomnień…</EmptyState>
                ) : overdueActions.length === 0 ? (
                    <EmptyState compact>Brak zaległych follow-upów przypisanych do Ciebie.</EmptyState>
                ) : (
                    <div className={styles.activityList}>
                        {overdueActions.map((activity) => (
                            <Link
                                key={activity.id}
                                to={
                                    activity.event_id && activity.company_id
                                        ? `/events/${activity.event_id}/companies/${activity.company_id}`
                                        : activity.event_id
                                            ? `/events/${activity.event_id}`
                                            : activity.company_id
                                                ? `/companies/${activity.company_id}`
                                                : '/dashboard'
                                }
                                className={`${styles.activityRow} ${styles.activityRowOverdue}`}
                            >
                                <AlertTriangle size={18} />
                                <div className={styles.activityBody}>
                                    <div className={styles.activityTitle}>{activity.subject}</div>
                                    <div className={styles.activitySub}>
                                        Termin: {formatDate(activity.due_date)}
                                        {activity.company_id ? ` · firma #${activity.company_id}` : ''}
                                        {activity.event_id ? ` · wydarzenie #${activity.event_id}` : ''}
                                    </div>
                                </div>
                                <ArrowRight size={16} />
                            </Link>
                        ))}
                    </div>
                )}
            </Card>

            <Card padding="compact">
                <CardHeader
                    title="Twoje wydarzenia"
                    action={
                        <Link to="/events" className={styles.sectionAction}>
                            Zobacz wszystkie
                        </Link>
                    }
                />
                {myEvents.isLoading || allEntries.isLoading ? (
                    <EmptyState compact>Ładowanie wydarzeń…</EmptyState>
                ) : events.length === 0 ? (
                    <EmptyState compact>
                        Brak wydarzeń przypisanych do Twojego konta.
                    </EmptyState>
                ) : (
                    <div className={styles.cardGrid}>
                        {events.map((ev) => (
                            <EventCard
                                key={ev.id}
                                event={ev}
                                entries={allEntries.data ?? []}
                            />
                        ))}
                    </div>
                )}
            </Card>
        </Page>
    );
};

function computeStats(events: Event[], entries: PipelineEntry[]) {
    const eventIds = new Set(events.map((e) => e.id));
    const scoped = entries.filter((e) => eventIds.has(e.event_id));
    const partners = scoped.filter((e) => e.stage?.outcome === 'won').length;
    const lost = scoped.filter((e) => e.stage?.outcome === 'lost').length;
    const totalValue = scoped
        .filter((e) => e.stage?.outcome === 'won')
        .reduce((acc, e) => acc + Number.parseFloat(e.agreed_amount ?? '0'), 0);
    const closed = partners + lost;
    const conversion = closed > 0 ? partners / closed : null;
    const myActive = events.filter((e) => e.status === 'active').length;
    return {
        myActive,
        partners,
        pipelineCount: scoped.length,
        totalValue,
        conversion,
    };
}

interface EventCardProps {
    event: Event;
    entries: PipelineEntry[];
}

const EventCard: React.FC<EventCardProps> = ({ event, entries }) => {
    const own = entries.filter((e) => e.event_id === event.id);
    const won = own.filter((e) => e.stage?.outcome === 'won');
    const total = won.reduce(
        (acc, e) => acc + Number.parseFloat(e.agreed_amount ?? '0'),
        0,
    );
    const target = event.target_partners_count ?? 0;
    const targetBudget = event.target_budget
        ? Number.parseFloat(event.target_budget)
        : 0;
    const budgetPct = targetBudget > 0 ? Math.min(total / targetBudget, 1) : 0;

    return (
        <Link to={`/events/${event.id}`} className={styles.eventCard}>
            <div className={styles.eventCardChips}>
                <Badge tone={STATUS_TONE[event.status]} pill size="sm">
                    {STATUS_LABEL[event.status]}
                </Badge>
                <Badge tone="info" pill size="sm">
                    {formatDateRange(event.start_date, event.end_date)}
                </Badge>
            </div>
            <div className={styles.eventCardName}>{event.name}</div>
            {event.description && (
                <div className={styles.eventCardDescription}>{event.description}</div>
            )}

            <ProgressBar value={budgetPct} tone="success" />

            <div className={styles.eventCardFoot}>
                <div className={styles.eventCardMeta}>
                    <span>Partnerzy</span>
                    <span className={styles.eventCardMetaValue}>
                        {won.length}
                        {target ? ` / ${target}` : ''}
                    </span>
                </div>
                <div className={styles.eventCardMeta}>
                    <span>Wartość</span>
                    <span className={styles.eventCardMetaValue}>
                        {formatPLN(total)}
                    </span>
                </div>
                <span className={styles.eventCardCta}>
                    Otwórz <ArrowRight size={12} />
                </span>
            </div>
        </Link>
    );
};

export default DashboardCoordinator;
