import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useActivities } from '../hooks/api/activities';
import { useCompany, useCompanyContacts } from '../hooks/api/companies';
import { useEvent } from '../hooks/api/events';
import { usePipelineEntries } from '../hooks/api/pipeline';
import { usePipelineStages } from '../hooks/api/reference';
import CompanyInfo from '../components/CompanyDetail/CompanyInfo';
import SectionCard from '../components/CompanyDetail/SectionCard';
import CompanySummary from '../components/EventCompany/CompanySummary';
import EventCompanyMetrics from '../components/EventCompany/EventCompanyMetrics';
import EventContactsCard from '../components/EventCompany/EventContactsCard';
import EventHistoryTimeline from '../components/EventCompany/EventHistoryTimeline';
import EventNotesCard from '../components/EventCompany/EventNotesCard';
import PipelineStatusBar from '../components/EventCompany/PipelineStatusBar';
import styles from './EventCompany.module.css';

const EventCompany: React.FC = () => {
    const { id, companyId } = useParams<{ id: string; companyId: string }>();
    const eventId = id ? Number.parseInt(id, 10) : null;
    const numericCompanyId = companyId ? Number.parseInt(companyId, 10) : null;

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
            (activities.data ?? []).filter(
                (a) => a.activity_type === 'note',
            ),
        [activities.data],
    );

    if (company.isLoading || event.isLoading) {
        return (
            <div className={styles.page}>
                <div className={styles.loading}>Ładowanie danych…</div>
            </div>
        );
    }

    if (
        company.isError ||
        !company.data ||
        event.isError ||
        !event.data
    ) {
        return (
            <div className={styles.page}>
                <div className={styles.errorBox}>
                    Nie udało się załadować widoku.{' '}
                    <Link to={`/events/${eventId ?? ''}`}>Wróć do wydarzenia</Link>.
                </div>
            </div>
        );
    }

    const c = company.data;
    const ev = event.data;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <nav className={styles.breadcrumb} aria-label="breadcrumb">
                    <Link to="/events">Wydarzenia</Link>
                    <span className={styles.breadcrumbSep}>›</span>
                    <Link to={`/events/${ev.id}`}>{ev.name}</Link>
                    <span className={styles.breadcrumbSep}>›</span>
                    <span className={styles.breadcrumbCurrent}>{c.name}</span>
                </nav>
                <h1 className={styles.title}>{c.name}</h1>
                <div className={styles.subtitle}>
                    Kontekst wydarzenia:{' '}
                    <Link
                        to={`/events/${ev.id}`}
                        style={{ color: '#64748B' }}
                    >
                        {ev.name}
                    </Link>
                </div>
            </header>

            <div className={styles.layout}>
                <div className={styles.leftCol}>
                    <CompanySummary company={c} />
                    <SectionCard title="Informacje ogólne" icon={<Info size={18} />}>
                        <CompanyInfo company={c} />
                    </SectionCard>
                </div>

                <div className={styles.centerCol}>
                    <PipelineStatusBar
                        stages={stages.data ?? []}
                        entry={entry}
                    />
                    <EventCompanyMetrics
                        entry={entry}
                        activities={activities.data ?? []}
                    />
                    <EventContactsCard
                        contacts={contacts.data ?? []}
                        isLoading={contacts.isLoading}
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
        </div>
    );
};

export default EventCompany;
