import React, { useMemo } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useReports } from '../hooks/api/reports';
import { formatDate, formatPLN, formatPercent } from '../lib/format';
import styles from './Reports.module.css';

const STATUS_LABEL: Record<string, string> = {
    draft: 'Wersja robocza',
    active: 'Aktywne',
    closed: 'Zakończone',
    cancelled: 'Anulowane',
};

const STATUS_CLASS: Record<string, string> = {
    draft: styles.statusDraft,
    active: styles.statusActive,
    closed: styles.statusClosed,
    cancelled: styles.statusCancelled,
};

const Reports: React.FC = () => {
    const reports = useReports();

    const totals = reports.data?.totals;
    const events = reports.data?.events ?? [];
    const newSponsors = reports.data?.new_sponsors ?? [];
    const topCompanies = reports.data?.top_companies ?? [];

    const eventsChartData = useMemo(
        () =>
            events
                .slice(0, 8)
                .map((ev) => ({
                    name: ev.event_name.length > 18
                        ? `${ev.event_name.slice(0, 16)}…`
                        : ev.event_name,
                    full: ev.event_name,
                    partners: ev.partners_count,
                    value: Number.parseFloat(ev.total_value) / 1000,
                })),
        [events],
    );

    const sponsorsTimeline = useMemo(() => {
        const buckets = new Map<string, number>();
        for (const sp of newSponsors) {
            if (!sp.closed_at) continue;
            const date = new Date(sp.closed_at);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            buckets.set(key, (buckets.get(key) ?? 0) + 1);
        }
        return Array.from(buckets.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, count]) => ({ month, count }));
    }, [newSponsors]);

    if (reports.isLoading) {
        return (
            <div className={styles.page}>
                <div className={styles.loading}>Ładowanie raportów…</div>
            </div>
        );
    }

    if (reports.isError || !reports.data) {
        return (
            <div className={styles.page}>
                <div className={styles.errorBox}>
                    Nie udało się pobrać raportów. Spróbuj odświeżyć stronę.
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <span className={styles.breadcrumb}>Raporty</span>
                <h1 className={styles.title}>Raporty</h1>
                <span className={styles.subtitle}>
                    Skumulowane metryki, najnowsi sponsorzy i szczegóły wydarzeń.
                </span>
            </header>

            <div className={styles.kpiRow}>
                <KpiCard
                    label="Całkowita wartość"
                    value={totals ? formatPLN(totals.total_value) : '—'}
                    sub="suma podpisanych umów"
                />
                <KpiCard
                    label="Pozyskani partnerzy"
                    value={`${totals?.partners_count ?? 0}`}
                    sub={`${totals?.pipeline_count ?? 0} firm w lejku`}
                />
                <KpiCard
                    label="Konwersja"
                    value={
                        totals?.conversion_rate != null
                            ? formatPercent(totals.conversion_rate, 1)
                            : '—'
                    }
                    sub="firmy zamknięte sukcesem / wszystkie zamknięte"
                />
                <KpiCard
                    label="Liczba wydarzeń"
                    value={`${events.length}`}
                    sub="w systemie"
                />
            </div>

            <div className={styles.grid2}>
                <section className={styles.section}>
                    <div className={styles.sectionHead}>
                        <h2 className={styles.sectionTitle}>Wartość partnerstw w wydarzeniach</h2>
                        <span className={styles.sectionSub}>w tysiącach PLN</span>
                    </div>
                    {eventsChartData.length === 0 ? (
                        <div className={styles.tableEmpty}>Brak danych do wykresu.</div>
                    ) : (
                        <div className={styles.chartBox}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={eventsChartData}>
                                    <CartesianGrid stroke="#F1F5F9" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12, fill: '#64748B' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12, fill: '#64748B' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F8FAFC' }}
                                        formatter={(value) => [
                                            `${Number(value ?? 0).toFixed(0)}k PLN`,
                                            'Wartość',
                                        ]}
                                        labelFormatter={(_, payload) =>
                                            (payload?.[0]?.payload as { full: string } | undefined)
                                                ?.full ?? ''
                                        }
                                    />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#00458E">
                                        {eventsChartData.map((_, idx) => (
                                            <Cell key={idx} fill={idx === 0 ? '#002A5C' : '#00458E'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHead}>
                        <h2 className={styles.sectionTitle}>Nowi sponsorzy w czasie</h2>
                    </div>
                    {sponsorsTimeline.length === 0 ? (
                        <div className={styles.tableEmpty}>Brak nowych sponsorów.</div>
                    ) : (
                        <div className={styles.chartBox}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={sponsorsTimeline}>
                                    <CartesianGrid stroke="#F1F5F9" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 12, fill: '#64748B' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fontSize: 12, fill: '#64748B' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        formatter={(value) => [`${value ?? 0}`, 'Nowi sponsorzy']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#059669"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#059669' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </section>
            </div>

            <section className={styles.section}>
                <div className={styles.sectionHead}>
                    <h2 className={styles.sectionTitle}>Szczegóły wydarzeń</h2>
                    <span className={styles.sectionSub}>{events.length} wydarzeń</span>
                </div>
                {events.length === 0 ? (
                    <div className={styles.tableEmpty}>Brak wydarzeń.</div>
                ) : (
                    <div className={styles.table}>
                        <div className={styles.tableHead}>
                            <span>Wydarzenie</span>
                            <span>Status</span>
                            <span>Partnerzy</span>
                            <span>Wartość</span>
                            <span>W lejku</span>
                        </div>
                        {events.map((ev) => (
                            <div key={ev.event_id} className={styles.tableRow}>
                                <div>
                                    <div className={styles.eventCellTitle}>{ev.event_name}</div>
                                    <div className={styles.eventCellSub}>
                                        {formatDate(ev.start_date)}
                                    </div>
                                </div>
                                <span
                                    className={`${styles.statusBadge} ${STATUS_CLASS[ev.status] ?? styles.statusClosed}`}
                                >
                                    {STATUS_LABEL[ev.status] ?? ev.status}
                                </span>
                                <span>
                                    {ev.partners_count}
                                    {ev.target_partners_count ? ` / ${ev.target_partners_count}` : ''}
                                </span>
                                <span>{formatPLN(ev.total_value)}</span>
                                <span>{ev.pipeline_count}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <div className={styles.grid2}>
                <section className={styles.section}>
                    <div className={styles.sectionHead}>
                        <h2 className={styles.sectionTitle}>Najnowsi sponsorzy</h2>
                        <span className={styles.sectionSub}>ostatnie 10 sukcesów</span>
                    </div>
                    {newSponsors.length === 0 ? (
                        <div className={styles.tableEmpty}>Brak nowych sponsorów.</div>
                    ) : (
                        <div className={styles.table}>
                            <div className={styles.sponsorHead}>
                                <span>Firma</span>
                                <span>Wydarzenie</span>
                                <span>Kwota</span>
                                <span>Data</span>
                            </div>
                            {newSponsors.map((sp) => (
                                <div key={`${sp.company_id}-${sp.event_id}`} className={styles.sponsorRow}>
                                    <span className={styles.eventCellTitle}>{sp.company_name}</span>
                                    <span className={styles.eventCellSub}>{sp.event_name}</span>
                                    <span className={styles.sponsorAmount}>
                                        {formatPLN(sp.agreed_amount)}
                                    </span>
                                    <span className={styles.eventCellSub}>
                                        {formatDate(sp.closed_at)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHead}>
                        <h2 className={styles.sectionTitle}>Top firmy</h2>
                        <span className={styles.sectionSub}>wg sumy umów</span>
                    </div>
                    {topCompanies.length === 0 ? (
                        <div className={styles.tableEmpty}>Brak partnerstw.</div>
                    ) : (
                        <div className={styles.table}>
                            <div className={styles.topHead}>
                                <span>Firma</span>
                                <span>Łączna wartość</span>
                                <span>Liczba partnerstw</span>
                            </div>
                            {topCompanies.map((c) => (
                                <div key={c.company_id} className={styles.topRow}>
                                    <span className={styles.eventCellTitle}>{c.company_name}</span>
                                    <span className={styles.sponsorAmount}>
                                        {formatPLN(c.total_value)}
                                    </span>
                                    <span>{c.partnerships_count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

interface KpiCardProps {
    label: string;
    value: string;
    sub: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub }) => (
    <div className={styles.kpiCard}>
        <span className={styles.kpiLabel}>{label}</span>
        <span className={styles.kpiValue}>{value}</span>
        <span className={styles.kpiSub}>{sub}</span>
    </div>
);

export default Reports;
