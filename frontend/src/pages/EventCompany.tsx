import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useActivities } from '../hooks/api/activities';
import { useCompany, useCompanyContacts } from '../hooks/api/companies';
import { useEvent } from '../hooks/api/events';
import { usePipelineEntries } from '../hooks/api/pipeline';
import { usePipelineStages } from '../hooks/api/reference';
import CompanyInfo from '../components/CompanyDetail/CompanyInfo';
import CompanySummary from '../components/EventCompany/CompanySummary';
import EventCompanyMetrics from '../components/EventCompany/EventCompanyMetrics';
import EventContactsCard from '../components/EventCompany/EventContactsCard';
import EventHistoryTimeline from '../components/EventCompany/EventHistoryTimeline';
import EventNotesCard from '../components/EventCompany/EventNotesCard';
import PipelineStatusBar from '../components/EventCompany/PipelineStatusBar';
import AddContactModal from '../components/modals/AddContactModal';
import {
    Card,
    CardHeader,
    EmptyState,
    Page,
    PageHeader,
} from '../components/ui';
import styles from './EventCompany.module.css';

const EventCompany: React.FC = () => {
    const { id, companyId } = useParams<{ id: string; companyId: string }>();
    const eventId = id ? Number.parseInt(id, 10) : null;
    const numericCompanyId = companyId ? Number.parseInt(companyId, 10) : null;
    const [addContactOpen, setAddContactOpen] = useState(false);

    const company = useCompany(numericCompanyId);
    const event = useEvent(eventId);
    const stages = usePipelineStages();
    const contacts = useCompanyContacts(numericCompanyId);
    const pipelineEntries = usePipelineEntries(
        eventId != null && numericCompanyId != null
            ? { event_id: eventId, company_id: numericCompanyId }
            : {},
    );
    const activities = useActivities(
        eventId != null && numericCompanyId != null
            ? { event_id: eventId, company_id: numericCompanyId, limit: 50 }
            : {},
    );

    const entry = pipelineEntries.data?.[0] ?? null;

    const notes = useMemo(
        () =>
            (activities.data ?? []).filter((a) => a.activity_type === 'note'),
        [activities.data],
    );

    if (company.isLoading || event.isLoading) {
        return (
            <Page width="wide">
                <Card>
                    <EmptyState>Ładowanie danych…</EmptyState>
                </Card>
            </Page>
        );
    }

    if (
        company.isError ||
        !company.data ||
        event.isError ||
        !event.data
    ) {
        return (
            <Page width="wide">
                <Card>
                    <EmptyState title="Błąd">
                        Nie udało się załadować widoku.{' '}
                        <Link to={`/events/${eventId ?? ''}`}>
                            Wróć do wydarzenia
                        </Link>.
                    </EmptyState>
                </Card>
            </Page>
        );
    }

    const c = company.data;
    const ev = event.data;

    return (
        <Page width="wide">
            <PageHeader
                breadcrumb={[
                    { label: 'Wydarzenia', to: '/events' },
                    { label: ev.name, to: `/events/${ev.id}` },
                    { label: c.name },
                ]}
                title={c.name}
                subtitle={
                    <>
                        Kontekst wydarzenia:{' '}
                        <Link to={`/events/${ev.id}`} className={styles.subLink}>
                            {ev.name}
                        </Link>
                    </>
                }
            />

            <div className={styles.layout}>
                <div className={styles.leftCol}>
                    <CompanySummary company={c} />
                    <Card padding="compact">
                        <CardHeader title="Informacje ogólne" icon={<Info size={18} />} />
                        <CompanyInfo company={c} />
                    </Card>
                </div>

                <div className={styles.centerCol}>
                    <PipelineStatusBar stages={stages.data ?? []} entry={entry} />
                    <EventCompanyMetrics
                        entry={entry}
                        activities={activities.data ?? []}
                    />
                    <EventContactsCard
                        contacts={contacts.data ?? []}
                        isLoading={contacts.isLoading}
                        onAdd={() => setAddContactOpen(true)}
                    />
                </div>

                <div className={styles.rightCol}>
                    <EventHistoryTimeline
                        eventName={ev.name}
                        activities={activities.data ?? []}
                        isLoading={activities.isLoading}
                    />
                    <EventNotesCard
                        companyId={c.id}
                        eventId={ev.id}
                        notes={notes}
                    />
                </div>
            </div>

            <AddContactModal
                open={addContactOpen}
                companyId={c.id}
                onClose={() => setAddContactOpen(false)}
            />
        </Page>
    );
};

export default EventCompany;
