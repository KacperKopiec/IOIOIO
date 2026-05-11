import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, CalendarDays, Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../hooks/api/events';
import { usePipelineEntries } from '../../hooks/api/pipeline';
import { formatDateRange, formatPLN, formatPercent } from '../../lib/format';
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

    const events =
        (myEvents.data?.items?.length ?? 0) > 0
            ? myEvents.data!.items
            : allEvents.data?.items ?? [];

    const stats = computeStats(events, allEntries.data ?? []);

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
            </div>

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
