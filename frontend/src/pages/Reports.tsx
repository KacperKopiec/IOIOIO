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
import {
    Badge,
    Card,
    CardHeader,
    EmptyState,
    KpiCard,
    Page,
    PageHeader,
} from '../components/ui';
import type { BadgeTone } from '../components/ui';
import type { EventStatus } from '../types/api';
import styles from './Reports.module.css';

const STATUS_LABEL: Record<EventStatus, string> = {
    draft: 'Wersja robocza',
    active: 'Aktywne',
    closed: 'Zakończone',
    cancelled: 'Anulowane',
};

const STATUS_TONE: Record<EventStatus, BadgeTone> = {
    draft: 'warning',
    active: 'success',
    closed: 'neutral',
    cancelled: 'danger',
};

const Reports: React.FC = () => {
    const reports = useReports();

    const totals = reports.data?.totals;
    const events = reports.data?.events ?? [];
    const newSponsors = reports.data?.new_sponsors ?? [];
    const topCompanies = reports.data?.top_companies ?? [];

    const eventsChartData = useMemo(
        () =>
            events.slice(0, 8).map((ev) => ({
                name:
                    ev.event_name.length > 18
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
            <Page>
                <PageHeader title="Raporty" breadcrumb={[{ label: 'Raporty' }]} />
                <Card>
                    <EmptyState>Ładowanie raportów…</EmptyState>
                </Card>
            </Page>
        );
    }

    if (reports.isError || !reports.data) {
        return (
            <Page>
                <PageHeader title="Raporty" breadcrumb={[{ label: 'Raporty' }]} />
                <Card>
                    <EmptyState title="Błąd">Nie udało się pobrać raportów.</EmptyState>
                </Card>
            </Page>
        );
    }

    return (
        <Page width="wide">
            <PageHeader
                title="Raporty"
                breadcrumb={[{ label: 'Raporty' }]}
                subtitle="Skumulowane metryki, najnowsi sponsorzy i szczegóły wydarzeń."
            />

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
                <Card>
                    <CardHeader
                        title="Wartość partnerstw w wydarzeniach"
                        subtitle="w tysiącach PLN"
                    />
                    {eventsChartData.length === 0 ? (
                        <EmptyState compact>Brak danych do wykresu.</EmptyState>
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
                </Card>

                <Card>
                    <CardHeader title="Nowi sponsorzy w czasie" />
                    {sponsorsTimeline.length === 0 ? (
                        <EmptyState compact>Brak nowych sponsorów.</EmptyState>
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
                                        stroke="#047857"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#047857' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>
            </div>

            <Card>
                <CardHeader
                    title="Szczegóły wydarzeń"
                    subtitle={`${events.length} wydarzeń`}
                />
                {events.length === 0 ? (
                    <EmptyState compact>Brak wydarzeń.</EmptyState>
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
                                <div className={styles.tableCellMain}>
                                    <div className={styles.tableTitle}>{ev.event_name}</div>
                                    <div className={styles.tableSub}>{formatDate(ev.start_date)}</div>
                                </div>
                                <Badge
                                    tone={STATUS_TONE[ev.status]}
                                    pill
                                    size="sm"
                                    uppercase
                                >
                                    {STATUS_LABEL[ev.status]}
                                </Badge>
                                <span>
                                    {ev.partners_count}
                                    {ev.target_partners_count
                                        ? ` / ${ev.target_partners_count}`
                                        : ''}
                                </span>
                                <span>{formatPLN(ev.total_value)}</span>
                                <span>{ev.pipeline_count}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <div className={styles.grid2}>
                <Card>
                    <CardHeader
                        title="Najnowsi sponsorzy"
                        subtitle="ostatnie 10 sukcesów"
                    />
                    {newSponsors.length === 0 ? (
                        <EmptyState compact>Brak nowych sponsorów.</EmptyState>
                    ) : (
                        <div className={styles.table}>
                            <div className={styles.sponsorHead}>
                                <span>Firma</span>
                                <span>Wydarzenie</span>
                                <span>Kwota</span>
                                <span>Data</span>
                            </div>
                            {newSponsors.map((sp) => (
                                <div
                                    key={`${sp.company_id}-${sp.event_id}`}
                                    className={styles.sponsorRow}
                                >
                                    <span className={styles.tableTitle}>{sp.company_name}</span>
                                    <span className={styles.tableSub}>{sp.event_name}</span>
                                    <span className={styles.tableAmountSuccess}>
                                        {formatPLN(sp.agreed_amount)}
                                    </span>
                                    <span className={styles.tableSub}>
                                        {formatDate(sp.closed_at)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card>
                    <CardHeader title="Top firmy" subtitle="wg sumy umów" />
                    {topCompanies.length === 0 ? (
                        <EmptyState compact>Brak partnerstw.</EmptyState>
                    ) : (
                        <div className={styles.table}>
                            <div className={styles.topHead}>
                                <span>Firma</span>
                                <span>Łączna wartość</span>
                                <span>Liczba partnerstw</span>
                            </div>
                            {topCompanies.map((c) => (
                                <div key={c.company_id} className={styles.topRow}>
                                    <span className={styles.tableTitle}>{c.company_name}</span>
                                    <span className={styles.tableAmountSuccess}>
                                        {formatPLN(c.total_value)}
                                    </span>
                                    <span>{c.partnerships_count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </Page>
    );
};

export default Reports;
