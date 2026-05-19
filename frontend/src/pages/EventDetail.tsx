import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Pencil, Plus, ReceiptText } from 'lucide-react';
import { useAuth } from '../context/auth';
import { useEvent, useEventKpi, useEventPipeline } from '../hooks/api/events';
import { usePipelineStages } from '../hooks/api/reference';
import { useCoordinatorDashboard } from '../hooks/api/dashboard';
import { useActivities } from '../hooks/api/activities';
import { formatDateRange } from '../lib/format';
import EventKpiCards from '../components/EventDetail/EventKpiCards';
import PipelineSummary from '../components/EventDetail/PipelineSummary';
import EventTasksList from '../components/EventDetail/EventTasksList';
import GoalProgress from '../components/EventDetail/GoalProgress';
import ActivityFeed from '../components/EventDetail/ActivityFeed';
import UpcomingActions from '../components/EventDetail/UpcomingActions';
import AddPipelineEntryModal from '../components/modals/AddPipelineEntryModal';
import EditEventModal from '../components/modals/EditEventModal';
import InvoicePanel from '../components/Invoices/InvoicePanel';
import {
    Badge,
    Button,
    Card,
    CardHeader,
    EmptyState,
    Page,
    PageHeader,
} from '../components/ui';
import type { BadgeTone } from '../components/ui';
import type { EventStatus } from '../types/api';
import { useEventReport } from '../hooks/api/events';
import styles from './EventDetail.module.css';

const STATUS_LABELS: Record<EventStatus, string> = {
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

const EventDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const eventId = id ? Number.parseInt(id, 10) : null;

    const { role } = useAuth();
    const canEditEvent = role === 'koordynator';

    const [addPipelineOpen, setAddPipelineOpen] = useState(false);
    const [editEventOpen, setEditEventOpen] = useState(false);
    const [showReport, setShowReport] = useState(false);

    const event = useEvent(eventId);
    const kpi = useEventKpi(eventId);
    const pipeline = useEventPipeline(eventId);
    const stages = usePipelineStages();
    const dashboard = useCoordinatorDashboard(eventId);
    const activities = useActivities(
        eventId != null ? { event_id: eventId, limit: 50 } : {},
    );
    const eventReport = useEventReport(showReport ? eventId : null);

    if (event.isLoading) {
        return (
            <Page width="wide">
                <Card>
                    <EmptyState>Ładowanie wydarzenia…</EmptyState>
                </Card>
            </Page>
        );
    }

    if (event.isError || !event.data) {
        return (
            <Page width="wide">
                <Card>
                    <EmptyState title="Błąd">
                        Nie udało się załadować wydarzenia. Wróć do{' '}
                        <Link to="/events">listy wydarzeń</Link>.
                    </EmptyState>
                </Card>
            </Page>
        );
    }

    const ev = event.data;

    return (
        <Page width="wide">
            <PageHeader
                title={ev.name}
                breadcrumb={[
                    { label: 'Wydarzenia', to: '/events' },
                    { label: ev.name },
                ]}
                chips={
                    <>
                        <Badge tone="info" pill>
                            {formatDateRange(ev.start_date, ev.end_date)}
                        </Badge>
                        <Badge tone={STATUS_TONE[ev.status]} pill>
                            {STATUS_LABELS[ev.status]}
                        </Badge>
                    </>
                }
                actions={
                    <>
                        <Button
                            variant="ghost"
                            iconLeft={<Pencil size={14} />}
                            onClick={() => setEditEventOpen(true)}
                            disabled={!canEditEvent}
                            title={
                                canEditEvent
                                    ? undefined
                                    : 'Edycja wydarzenia zarezerwowana dla koordynatora'
                            }
                        >
                            Edytuj
                        </Button>
                        <Button
                            variant="secondary"
                            iconLeft={<Plus size={14} />}
                            onClick={() => setAddPipelineOpen(true)}
                        >
                            Dodaj firmę
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setShowReport(true)}
                        >
                            Raport
                        </Button>
                    </>
                }
            />

            <div className={styles.layout}>
                <div className={styles.mainCol}>
                    <EventKpiCards kpi={kpi.data} />

                    <PipelineSummary
                        eventId={ev.id}
                        entries={pipeline.data ?? []}
                        stages={stages.data ?? []}
                        isLoading={pipeline.isLoading || stages.isLoading}
                    />

                    <EventTasksList
                        activities={activities.data ?? []}
                        isLoading={activities.isLoading}
                        eventId={eventId ?? undefined}
                    />
                </div>

                <aside className={styles.sideCol}>
                    <GoalProgress kpi={kpi.data} />
                    <Card padding="compact">
                        <CardHeader
                            title="Faktury i płatności"
                            icon={<ReceiptText size={18} />}
                        />
                        <InvoicePanel eventId={ev.id} />
                    </Card>
                    <ActivityFeed
                        activities={dashboard.data?.recent_activities ?? []}
                        isLoading={dashboard.isLoading}
                    />
                    <UpcomingActions
                        actions={dashboard.data?.upcoming_tasks ?? []}
                        isLoading={dashboard.isLoading}
                    />
                </aside>
            </div>

            <AddPipelineEntryModal
                open={addPipelineOpen}
                eventId={ev.id}
                onClose={() => setAddPipelineOpen(false)}
            />
            <EditEventModal
                open={editEventOpen}
                event={ev}
                onClose={() => setEditEventOpen(false)}
            />

            {showReport && (
                <div className={styles.reportOverlay}>
                    <div className={styles.reportModal}>
                        <div className={styles.reportHeader}>
                            <h2>Raport: {ev.name}</h2>
                            <button
                                type="button"
                                className={styles.reportClose}
                                onClick={() => setShowReport(false)}
                            >
                                ×
                            </button>
                        </div>
                        {eventReport.isLoading ? (
                            <div className={styles.reportLoading}>Generowanie raportu...</div>
                        ) : eventReport.data ? (
                            <div className={styles.reportContent}>
                                <div className={styles.reportSection}>
                                    <h3>Podsumowanie</h3>
                                    <div className={styles.reportStats}>
                                        <div className={styles.reportStat}>
                                            <span className={styles.reportStatLabel}>Partnerzy</span>
                                            <span className={styles.reportStatValue}>
                                                {eventReport.data.total_partners}
                                            </span>
                                        </div>
                                        <div className={styles.reportStat}>
                                            <span className={styles.reportStatLabel}>Wartość</span>
                                            <span className={styles.reportStatValue}>
                                                {Number(eventReport.data.total_value).toLocaleString('pl-PL')} PLN
                                            </span>
                                        </div>
                                        <div className={styles.reportStat}>
                                            <span className={styles.reportStatLabel}>Cel partnerów</span>
                                            <span className={styles.reportStatValue}>
                                                {eventReport.data.target_partners}
                                            </span>
                                        </div>
                                        <div className={styles.reportStat}>
                                            <span className={styles.reportStatLabel}>Cel budżetu</span>
                                            <span className={styles.reportStatValue}>
                                                {Number(eventReport.data.target_budget).toLocaleString('pl-PL')} PLN
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.reportSection}>
                                    <h3>Etapy lejka</h3>
                                    <table className={styles.reportTable}>
                                        <thead>
                                            <tr>
                                                <th>Etap</th>
                                                <th>Liczba firm</th>
                                                <th>Wartość</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {eventReport.data.stages.map((stage) => (
                                                <tr key={stage.stage_id}>
                                                    <td>{stage.stage_name}</td>
                                                    <td>{stage.count}</td>
                                                    <td>
                                                        {stage.stage_outcome === 'won'
                                                            ? `${Number(stage.value).toLocaleString('pl-PL')} PLN`
                                                            : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {eventReport.data.partners.length > 0 && (
                                    <div className={styles.reportSection}>
                                        <h3>Partnerzy (Decyzja: TAK)</h3>
                                        <table className={styles.reportTable}>
                                            <thead>
                                                <tr>
                                                    <th>Firma</th>
                                                    <th>Kwota</th>
                                                    <th>Data</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {eventReport.data.partners.map((p) => (
                                                    <tr key={p.company_id}>
                                                        <td>{p.company_name}</td>
                                                        <td>{Number(p.amount).toLocaleString('pl-PL')} PLN</td>
                                                        <td>{p.closed_at?.split('T')[0] || '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.reportError}>Błąd generowania raportu</div>
                        )}
                    </div>
                </div>
            )}
        </Page>
    );
};

export default EventDetail;
