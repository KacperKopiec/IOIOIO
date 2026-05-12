import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Megaphone, Users } from 'lucide-react';
import { usePromotionDashboard } from '../../hooks/api/dashboard';
import { useEvents } from '../../hooks/api/events';
import { formatDateRange, formatPercent } from '../../lib/format';
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
import type { EventStatus, PromotionEventCard } from '../../types/api';
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

function shortDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso)
        .toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' })
        .toUpperCase()
        .replace('.', '');
}

const DashboardPromotion: React.FC = () => {
    const dashboard = usePromotionDashboard();
    const events = useEvents({ page: 1, page_size: 50 });

    const cards = dashboard.data?.active_events ?? [];
    const totalPartners = cards.reduce((acc, c) => acc + c.partners_count, 0);
    const activeCount = cards.filter((c) => c.status === 'active').length;
    const draftCount = cards.filter((c) => c.status === 'draft').length;

    return (
        <Page width="wide">
            <PageHeader
                title="Dział promocji"
                breadcrumb={[{ label: 'Dashboard' }, { label: 'Dział promocji' }]}
                subtitle="Nadchodzące wydarzenia i status promocji w lejku."
            />

            <div className={styles.kpiRow}>
                <KpiCard
                    icon={<CalendarDays size={20} />}
                    tone="brand"
                    label="Aktywne wydarzenia"
                    value={`${activeCount}`}
                    sub={`${draftCount} w przygotowaniu`}
                />
                <KpiCard
                    icon={<Users size={20} />}
                    tone="success"
                    label="Pozyskani partnerzy"
                    value={`${totalPartners}`}
                    sub="łącznie we wszystkich wydarzeniach"
                />
                <KpiCard
                    icon={<Megaphone size={20} />}
                    tone="indigo"
                    label="W bazie"
                    value={`${events.data?.meta.total ?? 0}`}
                    sub="wydarzeń w systemie"
                />
            </div>

            <Card padding="compact">
                <CardHeader
                    title="Nadchodzące wydarzenia do promocji"
                    action={
                        <Link to="/events" className={styles.sectionAction}>
                            Zobacz wszystkie
                        </Link>
                    }
                />
                {dashboard.isLoading ? (
                    <EmptyState compact>Ładowanie wydarzeń…</EmptyState>
                ) : cards.length === 0 ? (
                    <EmptyState compact>
                        Brak aktywnych ani planowanych wydarzeń.
                    </EmptyState>
                ) : (
                    <div className={styles.cardGrid}>
                        {cards.map((card) => (
                            <PromotionCardItem key={card.id} card={card} />
                        ))}
                    </div>
                )}
            </Card>
        </Page>
    );
};

interface PromotionCardProps {
    card: PromotionEventCard;
}

const PromotionCardItem: React.FC<PromotionCardProps> = ({ card }) => (
    <article className={styles.eventCard}>
        <div className={styles.eventCardChips}>
            <Badge tone="info" pill size="sm">
                {shortDate(card.start_date)}
            </Badge>
            <Badge tone={STATUS_TONE[card.status]} pill size="sm">
                {STATUS_LABEL[card.status]}
            </Badge>
        </div>
        <div className={styles.eventCardName}>{card.name}</div>
        <div className={styles.eventCardDescription}>
            {formatDateRange(card.start_date, card.end_date)}
        </div>

        <ProgressBar
            value={card.progress_pct}
            tone="success"
            leftLabel={
                <span>
                    Partnerzy: {card.partners_count}
                    {card.target_partners_count
                        ? ` / ${card.target_partners_count}`
                        : ''}
                </span>
            }
            rightLabel={<span>{formatPercent(card.progress_pct)} budżetu</span>}
        />

        <Link to={`/events/${card.id}`} className={styles.eventCardCta}>
            Otwórz wydarzenie <ArrowRight size={12} />
        </Link>
    </article>
);

export default DashboardPromotion;
