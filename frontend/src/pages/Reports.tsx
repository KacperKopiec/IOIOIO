import React, { useMemo, useState } from 'react';
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
import { Download, Printer } from 'lucide-react';
import {
    buildReportExportUrl,
    useReports,
    type ReportFilters,
} from '../hooks/api/reports';
import { useCompanies } from '../hooks/api/companies';
import { useEvents } from '../hooks/api/events';
import { useIndustries, useUsers } from '../hooks/api/reference';
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

const currentYear = new Date().getFullYear();
const defaultReportYear = currentYear - 1;
const YEAR_OPTIONS = Array.from({ length: 8 }, (_, idx) => currentYear - idx);

const Reports: React.FC = () => {
    const [filters, setFilters] = useState<ReportFilters>({ year: defaultReportYear });
    const reports = useReports(filters);
    const industries = useIndustries();
    const users = useUsers();
    const eventsQuery = useEvents({ page: 1, page_size: 100 });
    const companiesQuery = useCompanies({ page: 1, page_size: 100 });

    const totals = reports.data?.totals;
    const annual = reports.data?.annual;
    const events = useMemo(() => reports.data?.events ?? [], [reports.data]);
    const pipelineStages = useMemo(
        () => reports.data?.pipeline_stages ?? [],
        [reports.data],
    );
    const companyHistory = useMemo(
        () => reports.data?.company_history ?? [],
        [reports.data],
    );
    const yearlyTrends = useMemo(
        () => reports.data?.yearly_trends ?? [],
        [reports.data],
    );
    const newSponsors = useMemo(
        () => reports.data?.new_sponsors ?? [],
        [reports.data],
    );
    const topCompanies = useMemo(
        () => reports.data?.top_companies ?? [],
        [reports.data],
    );

    const filterSummary = useMemo(() => {
        const parts: string[] = [];
        parts.push(`Rok: ${filters.year ?? 'wszystkie lata'}`);
        if (filters.industry_id) {
            const ind = industries.data?.find((i) => i.id === filters.industry_id);
            parts.push(`Branża: ${ind?.name ?? filters.industry_id}`);
        }
        if (filters.owner_user_id) {
            const u = users.data?.find((x) => x.id === filters.owner_user_id);
            parts.push(
                `Opiekun: ${u ? `${u.first_name} ${u.last_name}` : filters.owner_user_id}`,
            );
        }
        if (filters.event_id) {
            const ev = eventsQuery.data?.items.find((e) => e.id === filters.event_id);
            parts.push(`Inicjatywa: ${ev?.name ?? filters.event_id}`);
        }
        if (filters.company_id) {
            const c = companiesQuery.data?.items.find((co) => co.id === filters.company_id);
            parts.push(`Firma: ${c?.name ?? filters.company_id}`);
        }
        return parts;
    }, [filters, industries.data, users.data, eventsQuery.data, companiesQuery.data]);

    const eventChartData = useMemo(
        () =>
            events.slice(0, 8).map((ev) => ({
                name:
                    ev.event_name.length > 18
                        ? `${ev.event_name.slice(0, 16)}...`
                        : ev.event_name,
                full: ev.event_name,
                partners: ev.partners_count,
                value: Number.parseFloat(ev.total_value) / 1000,
            })),
        [events],
    );

    const pipelineChartData = useMemo(
        () =>
            pipelineStages.map((stage) => ({
                name: stage.stage_name,
                count: stage.count,
                value: Number.parseFloat(stage.total_value),
            })),
        [pipelineStages],
    );

    const trendChartData = useMemo(
        () =>
            yearlyTrends.map((row) => ({
                year: String(row.year),
                companies: row.collaborating_companies_count,
                value: Number.parseFloat(row.total_value) / 1000,
            })),
        [yearlyTrends],
    );

    function updateFilter<K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) {
        setFilters((prev) => ({ ...prev, [key]: value }));
    }

    if (reports.isLoading) {
        return (
            <Page>
                <PageHeader title="Raporty" breadcrumb={[{ label: 'Raporty' }]} />
                <Card>
                    <EmptyState>Ładowanie raportów...</EmptyState>
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
                subtitle="Filtrowane raporty roczne, inicjatyw, pipeline i historii firm."
                actions={
                    <div className={styles.headerActions}>
                        <button
                            type="button"
                            className={styles.printButton}
                            onClick={() => window.print()}
                        >
                            <Printer size={14} />
                            Drukuj
                        </button>
                        <a
                            className={styles.exportButton}
                            href={buildReportExportUrl(filters)}
                        >
                            <Download size={14} />
                            Eksport CSV
                        </a>
                    </div>
                }
            />

            <div className={styles.printHeader} aria-hidden>
                <div className={styles.printHeaderFilters}>
                    {filterSummary.join('  •  ')}
                </div>
                <div className={styles.printHeaderMeta}>
                    Wygenerowano: {formatDate(new Date().toISOString())}
                </div>
            </div>

            <Card padding="compact" className={styles.filtersCard}>
                <CardHeader
                    title="Filtry raportu"
                    subtitle="Zawężają wszystkie zestawienia i eksport"
                />
                <div className={styles.filters}>
                    <label className={styles.filterField}>
                        Rok
                        <select
                            value={filters.year ?? ''}
                            onChange={(e) =>
                                updateFilter(
                                    'year',
                                    e.target.value ? Number.parseInt(e.target.value, 10) : null,
                                )
                            }
                        >
                            <option value="">Wszystkie lata</option>
                            {YEAR_OPTIONS.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={styles.filterField}>
                        Branża
                        <select
                            value={filters.industry_id ?? ''}
                            onChange={(e) =>
                                updateFilter(
                                    'industry_id',
                                    e.target.value ? Number.parseInt(e.target.value, 10) : null,
                                )
                            }
                        >
                            <option value="">Wszystkie branże</option>
                            {industries.data?.map((industry) => (
                                <option key={industry.id} value={industry.id}>
                                    {industry.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={styles.filterField}>
                        Opiekun
                        <select
                            value={filters.owner_user_id ?? ''}
                            onChange={(e) =>
                                updateFilter(
                                    'owner_user_id',
                                    e.target.value ? Number.parseInt(e.target.value, 10) : null,
                                )
                            }
                        >
                            <option value="">Wszyscy opiekunowie</option>
                            {users.data?.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.first_name} {user.last_name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={styles.filterField}>
                        Inicjatywa
                        <select
                            value={filters.event_id ?? ''}
                            onChange={(e) =>
                                updateFilter(
                                    'event_id',
                                    e.target.value ? Number.parseInt(e.target.value, 10) : null,
                                )
                            }
                        >
                            <option value="">Wszystkie inicjatywy</option>
                            {eventsQuery.data?.items.map((event) => (
                                <option key={event.id} value={event.id}>
                                    {event.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className={styles.filterField}>
                        Firma
                        <select
                            value={filters.company_id ?? ''}
                            onChange={(e) =>
                                updateFilter(
                                    'company_id',
                                    e.target.value ? Number.parseInt(e.target.value, 10) : null,
                                )
                            }
                        >
                            <option value="">Wszystkie firmy</option>
                            {companiesQuery.data?.items.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button
                        type="button"
                        className={styles.resetButton}
                        onClick={() => setFilters({ year: defaultReportYear })}
                    >
                        Reset
                    </button>
                </div>
            </Card>

            <div className={styles.kpiRow}>
                <KpiCard
                    label="Firmy współpracujące"
                    value={`${annual?.collaborating_companies_count ?? 0}`}
                    sub={annual?.year ? `raport roczny ${annual.year}` : 'wszystkie lata'}
                />
                <KpiCard
                    label="Pozyskani partnerzy"
                    value={`${totals?.partners_count ?? 0}`}
                    sub={`${totals?.pipeline_count ?? 0} firm w lejku`}
                />
                <KpiCard
                    label="Kwota sponsorów"
                    value={totals ? formatPLN(totals.total_value) : '—'}
                    sub="suma wygranych partnerstw"
                />
                <KpiCard
                    label="Konwersja"
                    value={
                        totals?.conversion_rate != null
                            ? formatPercent(totals.conversion_rate, 1)
                            : '—'
                    }
                    sub="wygrane / zamknięte"
                />
            </div>

            <div className={styles.grid2}>
                <Card>
                    <CardHeader
                        title="Raport według inicjatywy"
                        subtitle="Partnerzy, kwoty i liczba firm w lejku"
                    />
                    {events.length === 0 ? (
                        <EmptyState compact>Brak inicjatyw dla wybranych filtrów.</EmptyState>
                    ) : (
                        <div className={styles.table}>
                            <div className={styles.tableHead}>
                                <span>Inicjatywa</span>
                                <span>Status</span>
                                <span>Partnerzy</span>
                                <span>Kwota</span>
                                <span>Pipeline</span>
                            </div>
                            {events.map((ev) => (
                                <div key={ev.event_id} className={styles.tableRow}>
                                    <div className={styles.tableCellMain}>
                                        <div className={styles.tableTitle}>{ev.event_name}</div>
                                        <div className={styles.tableSub}>{formatDate(ev.start_date)}</div>
                                    </div>
                                    <Badge tone={STATUS_TONE[ev.status]} pill size="sm" uppercase>
                                        {STATUS_LABEL[ev.status]}
                                    </Badge>
                                    <span>{ev.partners_count}</span>
                                    <span>{formatPLN(ev.total_value)}</span>
                                    <span>{ev.pipeline_count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card>
                    <CardHeader title="Kwoty pozyskane od sponsorów" subtitle="w tysiącach PLN" />
                    {eventChartData.length === 0 ? (
                        <EmptyState compact>Brak danych do wykresu.</EmptyState>
                    ) : (
                        <div className={styles.chartBox}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={eventChartData}>
                                    <CartesianGrid stroke="#F1F5F9" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#F8FAFC' }}
                                        formatter={(value) => [`${Number(value ?? 0).toFixed(0)}k PLN`, 'Kwota']}
                                        labelFormatter={(_, payload) =>
                                            (payload?.[0]?.payload as { full: string } | undefined)?.full ?? ''
                                        }
                                    />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#00458E">
                                        {eventChartData.map((_, idx) => (
                                            <Cell key={idx} fill={idx === 0 ? '#002A5C' : '#00458E'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>
            </div>

            <div className={styles.grid2}>
                <Card>
                    <CardHeader title="Raport statusów pipeline" subtitle="firmy według etapów" />
                    {pipelineStages.length === 0 ? (
                        <EmptyState compact>Brak danych pipeline.</EmptyState>
                    ) : (
                        <div className={styles.table}>
                            <div className={styles.pipelineHead}>
                                <span>Etap</span>
                                <span>Typ</span>
                                <span>Liczba firm</span>
                                <span>Kwota</span>
                            </div>
                            {pipelineStages.map((stage) => (
                                <div key={stage.stage_id} className={styles.pipelineRow}>
                                    <span className={styles.tableTitle}>{stage.stage_name}</span>
                                    <span className={styles.tableSub}>{stage.stage_outcome}</span>
                                    <span>{stage.count}</span>
                                    <span>{formatPLN(stage.total_value)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card>
                    <CardHeader title="Pipeline wizualnie" />
                    {pipelineChartData.length === 0 ? (
                        <EmptyState compact>Brak danych do wykresu.</EmptyState>
                    ) : (
                        <div className={styles.chartBox}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={pipelineChartData}>
                                    <CartesianGrid stroke="#F1F5F9" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={false} />
                                    <Tooltip formatter={(value) => [`${value ?? 0}`, 'Firmy']} />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#047857" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>
            </div>

            <div className={styles.grid2}>
                <Card>
                    <CardHeader
                        title="Historia sponsoringu firmy"
                        subtitle="tylko firmy zakończone jako partnerzy; wybierz firmę w filtrach, aby zawęzić"
                    />
                    {companyHistory.length === 0 ? (
                        <EmptyState compact>Brak sponsorów dla wybranych filtrów.</EmptyState>
                    ) : (
                        <div className={styles.table}>
                            <div className={styles.historyHead}>
                                <span>Firma</span>
                                <span>Inicjatywa</span>
                                <span>Etap</span>
                                <span>Kwota</span>
                                <span>Data</span>
                            </div>
                            {companyHistory.map((row) => (
                                <div
                                    key={`${row.company_id}-${row.event_id}-${row.stage_name}`}
                                    className={styles.historyRow}
                                >
                                    <span className={styles.tableTitle}>{row.company_name}</span>
                                    <span className={styles.tableSub}>{row.event_name}</span>
                                    <span>{row.stage_name}</span>
                                    <span>{formatPLN(row.agreed_amount ?? row.expected_amount)}</span>
                                    <span className={styles.tableSub}>
                                        {formatDate(row.closed_at ?? row.first_contact_at)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card>
                    <CardHeader title="Trendy współpracy rok do roku" />
                    {trendChartData.length === 0 ? (
                        <EmptyState compact>Brak danych trendów.</EmptyState>
                    ) : (
                        <div className={styles.chartBox}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendChartData}>
                                    <CartesianGrid stroke="#F1F5F9" vertical={false} />
                                    <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={false} />
                                    <Tooltip formatter={(value) => [`${value ?? 0}`, 'Firmy współpracujące']} />
                                    <Line type="monotone" dataKey="companies" stroke="#00458E" strokeWidth={3} dot={{ r: 4, fill: '#00458E' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>
            </div>

            <div className={styles.grid2}>
                <Card>
                    <CardHeader title="Najnowsi sponsorzy" subtitle="ostatnie sukcesy w filtrze" />
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
                                <div key={`${sp.company_id}-${sp.event_id}`} className={styles.sponsorRow}>
                                    <span className={styles.tableTitle}>{sp.company_name}</span>
                                    <span className={styles.tableSub}>{sp.event_name}</span>
                                    <span className={styles.tableAmountSuccess}>{formatPLN(sp.agreed_amount)}</span>
                                    <span className={styles.tableSub}>{formatDate(sp.closed_at)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                <Card>
                    <CardHeader title="Top firmy" subtitle="wg sumy partnerstw" />
                    {topCompanies.length === 0 ? (
                        <EmptyState compact>Brak partnerstw.</EmptyState>
                    ) : (
                        <div className={styles.table}>
                            <div className={styles.topHead}>
                                <span>Firma</span>
                                <span>Łączna wartość</span>
                                <span>Liczba</span>
                            </div>
                            {topCompanies.map((company) => (
                                <div key={company.company_id} className={styles.topRow}>
                                    <span className={styles.tableTitle}>{company.company_name}</span>
                                    <span className={styles.tableAmountSuccess}>
                                        {formatPLN(company.total_value)}
                                    </span>
                                    <span>{company.partnerships_count}</span>
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
