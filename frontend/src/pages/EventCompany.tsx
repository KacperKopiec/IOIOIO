import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileText, Info } from 'lucide-react';
import { useActivities } from '../hooks/api/activities';
import { useCompany, useCompanyContacts } from '../hooks/api/companies';
import { useEvent, useEventCompanyReport } from '../hooks/api/events';
import { usePipelineEntries } from '../hooks/api/pipeline';
import { usePipelineStages } from '../hooks/api/reference';
import CompanyInfo from '../components/CompanyDetail/CompanyInfo';
import EventCompanyDocuments from '../components/EventCompany/EventCompanyDocuments';
import CompanySummary from '../components/EventCompany/CompanySummary';
import EventCompanyMetrics from '../components/EventCompany/EventCompanyMetrics';
import EventContactsCard from '../components/EventCompany/EventContactsCard';
import EventHistoryTimeline from '../components/EventCompany/EventHistoryTimeline';
import EventNotesCard from '../components/EventCompany/EventNotesCard';
import PipelineStatusBar from '../components/EventCompany/PipelineStatusBar';
import EventTasksList from '../components/EventDetail/EventTasksList';
import AddContactModal from '../components/modals/AddContactModal';
import {
    Button,
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
    const [showReport, setShowReport] = useState(false);

    const company = useCompany(numericCompanyId);
    const event = useEvent(eventId);
    const stages = usePipelineStages();
    const contacts = useCompanyContacts(numericCompanyId);
    const pipelineEntries = usePipelineEntries(
        eventId != null && numericCompanyId != null
            ? { event_id: eventId, company_id: numericCompanyId }
            : {},
    );
    const companyReport = useEventCompanyReport(showReport ? eventId : null, showReport ? numericCompanyId : null);
    const allContacts = useCompanyContacts(numericCompanyId);
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
                actions={
                    <Button variant="secondary" onClick={() => setShowReport(true)}>
                        Raport
                    </Button>
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
                    <Card padding="compact">
                        <CardHeader title="Dokumenty" icon={<FileText size={18} />} />
                        <EventCompanyDocuments
                            eventId={ev.id}
                            companyId={c.id}
                        />
                    </Card>
                </div>

                <div className={styles.rightCol}>
                    <EventTasksList
                        title="Follow-upy"
                        emptyText="Brak kolejnych kroków dla tej firmy w tej inicjatywie."
                        activities={activities.data ?? []}
                        isLoading={activities.isLoading}
                        defaults={{
                            companyId: c.id,
                            eventId: ev.id,
                            pipelineEntryId: entry?.id ?? null,
                        }}
                    />
                    <EventHistoryTimeline
                        eventName={ev.name}
                        activities={activities.data ?? []}
                        isLoading={activities.isLoading}
                        companyId={c.id}
                        eventId={ev.id}
                        pipelineEntryId={entry?.id ?? null}
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

            {showReport && (
                <div className={styles.reportOverlay}>
                    <div className={styles.reportModal}>
                        <div className={styles.reportHeader}>
                            <h2>Raport współpracy: {c.name}</h2>
                            <button
                                type="button"
                                className={styles.reportClose}
                                onClick={() => setShowReport(false)}
                            >
                                ×
                            </button>
                        </div>
                        {companyReport.isLoading ? (
                            <div className={styles.reportLoading}>Generowanie raportu...</div>
                        ) : companyReport.data ? (
                            <div className={styles.reportContent}>
                                <div className={styles.reportSection}>
                                    <h3>Firma</h3>
                                    <div className={styles.reportInfo}>
                                        <div><strong>Nazwa:</strong> {companyReport.data.legal_name || companyReport.data.company_name}</div>
                                        <div><strong>Miasto:</strong> {companyReport.data.city || '—'}</div>
                                        <div><strong>Branża:</strong> {companyReport.data.industry || '—'}</div>
                                    </div>
                                </div>

                                <div className={styles.reportSection}>
                                    <h3>Etap w lejku</h3>
                                    {companyReport.data.pipeline_entry ? (
                                        <div className={styles.reportInfo}>
                                            <div><strong>Etap:</strong> {companyReport.data.pipeline_entry.stage_name}</div>
                                            <div><strong>Oczekiwana:</strong> {companyReport.data.pipeline_entry.expected_amount.toLocaleString('pl-PL')} PLN</div>
                                            <div><strong>Uzgodniona:</strong> {companyReport.data.pipeline_entry.agreed_amount.toLocaleString('pl-PL')} PLN</div>
                                            <div><strong>Opiekun:</strong> {companyReport.data.pipeline_entry.owner_name || '—'}</div>
                                            <div><strong>Pierwszy kontakt:</strong> {companyReport.data.pipeline_entry.first_contact_at?.split('T')[0] || '—'}</div>
                                            <div><strong>Oferta wysłana:</strong> {companyReport.data.pipeline_entry.offer_sent_at?.split('T')[0] || '—'}</div>
                                            <div><strong>Zamknięcie:</strong> {companyReport.data.pipeline_entry.closed_at?.split('T')[0] || '—'}</div>
                                        </div>
                                    ) : (
                                        <div className={styles.reportEmpty}>Firma nie jest w lejku tego wydarzenia</div>
                                    )}
                                </div>

                                {companyReport.data.partnership && (
                                    <div className={styles.reportSection}>
                                        <h3>Partnerstwo</h3>
                                        <div className={styles.reportInfo}>
                                            <div><strong>Pakiet:</strong> {companyReport.data.partnership.package_name || '—'}</div>
                                            <div><strong>Kwota netto:</strong> {companyReport.data.partnership.amount_net.toLocaleString('pl-PL')} PLN</div>
                                            <div><strong>Kwota brutto:</strong> {companyReport.data.partnership.amount_gross.toLocaleString('pl-PL')} PLN</div>
                                            <div><strong>Data podpisania:</strong> {companyReport.data.partnership.contract_signed_at?.split('T')[0] || '—'}</div>
                                            <div><strong>Od:</strong> {companyReport.data.partnership.start_date?.split('T')[0] || '—'}</div>
                                            <div><strong>Do:</strong> {companyReport.data.partnership.end_date?.split('T')[0] || '—'}</div>
                                        </div>
                                    </div>
                                )}

                                {allContacts.data && allContacts.data.length > 0 && (
                                    <div className={styles.reportSection}>
                                        <h3>Osoby kontaktowe</h3>
                                        <table className={styles.reportTable}>
                                            <thead>
                                                <tr>
                                                    <th>Imię i nazwisko</th>
                                                    <th>Funkcja</th>
                                                    <th>Email</th>
                                                    <th>Telefon</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allContacts.data.map((contact) => (
                                                    <tr key={contact.id}>
                                                        <td>{contact.first_name} {contact.last_name}</td>
                                                        <td>{contact.function || '—'}</td>
                                                        <td>{contact.email || '—'}</td>
                                                        <td>{contact.phone || '—'}</td>
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

export default EventCompany;
