import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useEvent, useEventKpi, useEventPipeline } from '../hooks/api/events';
import { usePipelineStages } from '../hooks/api/reference';
import PipelineStats from '../components/EventPipeline/PipelineStats';
import KanbanBoard from '../components/EventPipeline/KanbanBoard';
import AddPipelineEntryModal from '../components/modals/AddPipelineEntryModal';
import {
    Button,
    Card,
    EmptyState,
    Page,
    PageHeader,
} from '../components/ui';

const EventPipeline: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const eventId = id ? Number.parseInt(id, 10) : null;

    const event = useEvent(eventId);
    const kpi = useEventKpi(eventId);
    const pipeline = useEventPipeline(eventId);
    const stages = usePipelineStages();

    const [addOpen, setAddOpen] = useState(false);

    if (event.isLoading) {
        return (
            <Page width="full">
                <Card>
                    <EmptyState>Ładowanie lejka…</EmptyState>
                </Card>
            </Page>
        );
    }

    if (event.isError || !event.data) {
        return (
            <Page width="full">
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
        <Page width="full">
            <PageHeader
                title={`Lejek: ${ev.name}`}
                breadcrumb={[
                    { label: 'Wydarzenia', to: '/events' },
                    { label: ev.name, to: `/events/${ev.id}` },
                    { label: 'Lejek' },
                ]}
                subtitle={ev.description ?? undefined}
                actions={
                    <>
                        <Button variant="ghost" size="md" disabled>
                            Filtruj
                        </Button>
                        <Button variant="ghost" size="md" disabled>
                            Sortuj
                        </Button>
                        <Button
                            variant="primary"
                            iconLeft={<Plus size={14} />}
                            onClick={() => setAddOpen(true)}
                        >
                            Dodaj firmę
                        </Button>
                    </>
                }
            />

            <PipelineStats kpi={kpi.data} />

            {pipeline.isLoading || stages.isLoading ? (
                <Card>
                    <EmptyState>Ładowanie kart…</EmptyState>
                </Card>
            ) : (
                <KanbanBoard
                    eventId={ev.id}
                    stages={stages.data ?? []}
                    entries={pipeline.data ?? []}
                />
            )}

            <AddPipelineEntryModal
                open={addOpen}
                eventId={ev.id}
                onClose={() => setAddOpen(false)}
            />
        </Page>
    );
};

export default EventPipeline;
