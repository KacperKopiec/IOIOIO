import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useEvent, useEventKpi, useEventPipeline } from '../hooks/api/events';
import { usePipelineStages } from '../hooks/api/reference';
import PipelineStats from '../components/EventPipeline/PipelineStats';
import KanbanBoard from '../components/EventPipeline/KanbanBoard';
import styles from './EventPipeline.module.css';

const EventPipeline: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const eventId = id ? Number.parseInt(id, 10) : null;

    const event = useEvent(eventId);
    const kpi = useEventKpi(eventId);
    const pipeline = useEventPipeline(eventId);
    const stages = usePipelineStages();

    if (event.isLoading) {
        return (
            <div className={styles.page}>
                <div className={styles.loading}>Ładowanie lejka…</div>
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
                        <Link to={`/events/${ev.id}`}>{ev.name}</Link>
                        <span className={styles.breadcrumbSep}>›</span>
                        <span className={styles.breadcrumbCurrent}>Lejek</span>
                    </nav>
                    <h1 className={styles.title}>Wydarzenie: {ev.name}</h1>
                    {ev.description && (
                        <div className={styles.subtitle}>{ev.description}</div>
                    )}
                </div>

                <div className={styles.toolbar}>
                    <button type="button" className={styles.toolbarBtn} disabled>
                        Filtruj
                    </button>
                    <button type="button" className={styles.toolbarBtn} disabled>
                        Sortuj
                    </button>
                </div>
            </header>

            <PipelineStats kpi={kpi.data} />

            {pipeline.isLoading || stages.isLoading ? (
                <div className={styles.loading}>Ładowanie kart…</div>
            ) : (
                <KanbanBoard
                    eventId={ev.id}
                    stages={stages.data ?? []}
                    entries={pipeline.data ?? []}
                />
            )}
        </div>
    );
};

export default EventPipeline;
