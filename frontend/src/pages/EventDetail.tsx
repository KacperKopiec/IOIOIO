import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Pencil } from 'lucide-react';
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
import styles from './EventDetail.module.css';

const STATUS_LABELS: Record<string, string> = {
    draft: 'Wersja robocza',
    active: 'Aktywne',
    closed: 'Zakończone',
    cancelled: 'Anulowane',
};

const EventDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const eventId = id ? Number.parseInt(id, 10) : null;

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
            <div className={styles.page}>
                <div className={styles.loading}>Ładowanie wydarzenia…</div>
            </div>
        );
    }

    if (event.isError || !event.data) {
        return (
            <div className={styles.page}>
                <div className={styles.errorBox}>
                    Nie udało się załadować wydarzenia. Wróć do{' '}
                    <Link to="/events">listy wydarzeń</Link>.
                </div>
            </div>
        );
    }

    const ev = event.data;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <nav className={styles.breadcrumb} aria-label="breadcrumb">
                        <Link to="/events">Wydarzenia</Link>
                        <span className={styles.breadcrumbSep}>›</span>
                        <span className={styles.breadcrumbCurrent}>{ev.name}</span>
                    </nav>
                    <div className={styles.titleRow}>
                        <h1 className={styles.title}>{ev.name}</h1>
                        <span className={styles.dateChip}>
                            {formatDateRange(ev.start_date, ev.end_date)}
                        </span>
                        <span className={styles.statusChip}>
                            {STATUS_LABELS[ev.status] ?? ev.status}
                        </span>
                    </div>
                </div>
                <button type="button" className={styles.editButton} disabled>
                    <Pencil size={14} />
                    Edytuj projekt
                </button>
            </header>

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
        </div>
    );
};

export default EventDetail;
