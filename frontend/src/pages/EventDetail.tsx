import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Pencil, Plus } from 'lucide-react';
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
import AddActivityModal from '../components/modals/AddActivityModal';
import AddPipelineEntryModal from '../components/modals/AddPipelineEntryModal';
import EditEventModal from '../components/modals/EditEventModal';
import {
    Badge,
    Button,
    Card,
    EmptyState,
    Page,
    PageHeader,
} from '../components/ui';
import type { BadgeTone } from '../components/ui';
import type { EventStatus } from '../types/api';
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

    const [addActivityOpen, setAddActivityOpen] = useState(false);
    const [addPipelineOpen, setAddPipelineOpen] = useState(false);
    const [editEventOpen, setEditEventOpen] = useState(false);

    const event = useEvent(eventId);
    const kpi = useEventKpi(eventId);
    const pipeline = useEventPipeline(eventId);
    const stages = usePipelineStages();
    const dashboard = useCoordinatorDashboard(eventId);
    const activities = useActivities(
        eventId != null ? { event_id: eventId, limit: 50 } : {},
    );

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
                            variant="primary"
                            iconLeft={<Plus size={14} />}
                            onClick={() => setAddActivityOpen(true)}
                        >
                            Nowy wpis
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
                    />
                </div>

                <aside className={styles.sideCol}>
                    <GoalProgress kpi={kpi.data} />
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

            <AddActivityModal
                open={addActivityOpen}
                onClose={() => setAddActivityOpen(false)}
                defaults={{ eventId: ev.id }}
            />
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
        </Page>
    );
};

export default EventDetail;
