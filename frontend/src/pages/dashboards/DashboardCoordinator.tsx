import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, CalendarDays, Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../hooks/api/events';
import { usePipelineEntries } from '../../hooks/api/pipeline';
import { formatDateRange, formatPLN, formatPercent } from '../../lib/format';
import type { Event, PipelineEntry } from '../../types/api';
import styles from './Dashboards.module.css';

const STATUS_CHIP_CLASS: Record<string, string> = {
    active: styles.chipGreen,
    draft: styles.chipAmber,
    closed: styles.chipSlate,
    cancelled: styles.chipSlate,
};

const STATUS_LABEL: Record<string, string> = {
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
        <div className={styles.page}>
            <header className={styles.headerBlock}>
                <span className={styles.breadcrumb}>Dashboard / Koordynator wydarzenia</span>
                <h1 className={styles.title}>Witaj, {userName.split(' ')[0]}</h1>
                <span className={styles.subtitle}>
                    Twoje wydarzenia i ich aktualne metryki.
                </span>
            </header>

            <div className={styles.kpiRow}>
                <KpiCard
                    icon={<CalendarDays size={20} />}
                    iconClass={styles.kpiIcon}
                    label="Moje wydarzenia"
                    value={`${stats.myActive}`}
                    sub={`${events.length} łącznie`}
                />
                <KpiCard
                    icon={<Briefcase size={20} />}
                    iconClass={styles.kpiIconGreen}
                    label="Pozyskani partnerzy"
                    value={`${stats.partners}`}
                    sub={`${stats.pipelineCount} firm w lejku`}
                />
                <KpiCard
                    icon={<Target size={20} />}
                    iconClass={styles.kpiIconIndigo}
                    label="Łączna wartość"
                    value={formatPLN(stats.totalValue)}
                    sub={
                        stats.conversion != null
                            ? `Konwersja: ${formatPercent(stats.conversion, 1)}`
                            : 'Brak danych konwersji'
                    }
                />
            </div>

            <section className={styles.section}>
                <div className={styles.sectionHead}>
                    <h2 className={styles.sectionTitle}>Twoje wydarzenia</h2>
                    <Link to="/events" className={styles.sectionAction}>
                        Zobacz wszystkie
                    </Link>
                </div>

                {myEvents.isLoading || allEntries.isLoading ? (
                    <div className={styles.emptyState}>Ładowanie wydarzeń…</div>
                ) : events.length === 0 ? (
                    <div className={styles.emptyState}>
                        Brak wydarzeń przypisanych do Twojego konta.
                    </div>
                ) : (
                    <div className={styles.cardGrid}>
                        {events.map((ev) => (
                            <EventCard key={ev.id} event={ev} entries={allEntries.data ?? []} />
                        ))}
                    </div>
                )}
            </section>
        </div>
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
                <span
                    className={`${styles.chip} ${STATUS_CHIP_CLASS[event.status] ?? styles.chipSlate}`}
                >
                    {STATUS_LABEL[event.status] ?? event.status}
                </span>
                <span className={`${styles.chip} ${styles.chipBlue}`}>
                    {formatDateRange(event.start_date, event.end_date)}
                </span>
            </div>
            <div className={styles.eventCardName}>{event.name}</div>
            {event.description && (
                <div className={styles.eventCardDescription}>{event.description}</div>
            )}

            <div className={styles.progressBar}>
                <div
                    className={`${styles.progressFill} ${styles.progressFillGreen}`}
                    style={{ width: `${budgetPct * 100}%` }}
                />
            </div>

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
                    <span className={styles.eventCardMetaValue}>{formatPLN(total)}</span>
                </div>
                <span className={`${styles.ctaBtn} ${styles.ctaBtnGhost}`}>
                    Otwórz <ArrowRight size={12} />
                </span>
            </div>
        </Link>
    );
};

export default DashboardCoordinator;
