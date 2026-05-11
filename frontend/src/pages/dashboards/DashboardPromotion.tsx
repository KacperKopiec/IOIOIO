import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Megaphone, Users } from 'lucide-react';
import { usePromotionDashboard } from '../../hooks/api/dashboard';
import { useEvents } from '../../hooks/api/events';
import { formatDateRange, formatPercent } from '../../lib/format';
import type { PromotionEventCard } from '../../types/api';
import styles from './Dashboards.module.css';

function shortDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso)
        .toLocaleDateString('pl-PL', { day: '2-digit', month: 'short' })
        .toUpperCase()
        .replace('.', '');
}

const STATUS_CLASS: Record<string, string> = {
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

const DashboardPromotion: React.FC = () => {
    const dashboard = usePromotionDashboard();
    const events = useEvents({ page: 1, page_size: 50 });

    const cards = dashboard.data?.active_events ?? [];
    const totalPartners = cards.reduce((acc, c) => acc + c.partners_count, 0);
    const activeCount = cards.filter((c) => c.status === 'active').length;
    const draftCount = cards.filter((c) => c.status === 'draft').length;

    return (
        <div className={styles.page}>
            <header className={styles.headerBlock}>
                <span className={styles.breadcrumb}>Dashboard / Dział promocji</span>
                <h1 className={styles.title}>Dział promocji</h1>
                <span className={styles.subtitle}>
                    Nadchodzące wydarzenia i status promocji w lejku.
                </span>
            </header>

            <div className={styles.kpiRow}>
                <KpiCard
                    icon={<CalendarDays size={20} />}
                    iconClass={styles.kpiIcon}
                    label="Aktywne wydarzenia"
                    value={`${activeCount}`}
                    sub={`${draftCount} w przygotowaniu`}
                />
                <KpiCard
                    icon={<Users size={20} />}
                    iconClass={styles.kpiIconGreen}
                    label="Pozyskani partnerzy"
                    value={`${totalPartners}`}
                    sub="łącznie we wszystkich wydarzeniach"
                />
                <KpiCard
                    icon={<Megaphone size={20} />}
                    iconClass={styles.kpiIconIndigo}
                    label="W bazie"
                    value={`${events.data?.meta.total ?? 0}`}
                    sub="wydarzeń w systemie"
                />
            </div>

            <section className={styles.section}>
                <div className={styles.sectionHead}>
                    <h2 className={styles.sectionTitle}>
                        Nadchodzące wydarzenia do promocji
                    </h2>
                    <Link to="/events" className={styles.sectionAction}>
                        Zobacz wszystkie
                    </Link>
                </div>

                {dashboard.isLoading ? (
                    <div className={styles.emptyState}>Ładowanie wydarzeń…</div>
                ) : cards.length === 0 ? (
                    <div className={styles.emptyState}>
                        Brak aktywnych ani planowanych wydarzeń.
                    </div>
                ) : (
                    <div className={styles.cardGrid}>
                        {cards.map((card) => (
                            <PromotionCard key={card.id} card={card} />
                        ))}
                    </div>
                )}
            </section>
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

interface PromotionCardProps {
    card: PromotionEventCard;
}

const PromotionCard: React.FC<PromotionCardProps> = ({ card }) => {
    return (
        <article className={styles.eventCard}>
            <div className={styles.eventCardChips}>
                <span className={`${styles.chip} ${styles.chipBlue}`}>
                    {shortDate(card.start_date)}
                </span>
                <span
                    className={`${styles.chip} ${STATUS_CLASS[card.status] ?? styles.chipSlate}`}
                >
                    {STATUS_LABEL[card.status] ?? card.status}
                </span>
            </div>
            <div className={styles.eventCardName}>{card.name}</div>
            <div className={styles.eventCardDescription}>
                {formatDateRange(card.start_date, card.end_date)}
            </div>

            <div className={styles.progressBar}>
                <div
                    className={`${styles.progressFill} ${styles.progressFillGreen}`}
                    style={{ width: `${Math.min(card.progress_pct, 1) * 100}%` }}
                />
            </div>

            <div className={styles.progressLabel}>
                <span>
                    Partnerzy: {card.partners_count}
                    {card.target_partners_count ? ` / ${card.target_partners_count}` : ''}
                </span>
                <span>{formatPercent(card.progress_pct)} budżetu</span>
            </div>

            <Link to={`/events/${card.id}`} className={styles.ctaBtn}>
                Otwórz wydarzenie <ArrowRight size={12} />
            </Link>
        </article>
    );
};

export default DashboardPromotion;
