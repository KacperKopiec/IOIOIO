import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Building2, FileText, History, Info, NotebookPen, Pencil, Plus, Users } from 'lucide-react';
import {
    useCompany,
    useCompanyContacts,
    useCompanyEvents,
    useCompanyActivities,
    useCompanyReport,
} from '../hooks/api/companies';
import CompanyInfo from '../components/CompanyDetail/CompanyInfo';
import CooperationTimeline from '../components/CompanyDetail/CooperationTimeline';
import RelationshipValue from '../components/CompanyDetail/RelationshipValue';
import ContactsList from '../components/CompanyDetail/ContactsList';
import CompanyActivities from '../components/CompanyDetail/CompanyActivities';
import CompanyDocuments from '../components/CompanyDetail/CompanyDocuments';
import AddActivityModal from '../components/modals/AddActivityModal';
import AddContactModal from '../components/modals/AddContactModal';
import EditCompanyModal from '../components/modals/EditCompanyModal';
import { useAuth } from '../context/auth';
import {
    Avatar,
    Badge,
    Button,
    Card,
    CardHeader,
    EmptyState,
    Page,
    PageHeader,
} from '../components/ui';
import styles from './CompanyDetail.module.css';

const CompanyDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const companyId = id ? Number.parseInt(id, 10) : null;

    const { role } = useAuth();
    const canEditCompany = role === 'opiekun';

    const [addContactOpen, setAddContactOpen] = useState(false);
    const [addActivityOpen, setAddActivityOpen] = useState(false);
    const [editCompanyOpen, setEditCompanyOpen] = useState(false);
    const [showReport, setShowReport] = useState(false);

    const company = useCompany(companyId);
    const contacts = useCompanyContacts(companyId);
    const events = useCompanyEvents(companyId);
    const activities = useCompanyActivities(companyId);
    const companyReport = useCompanyReport(showReport ? companyId : null);

    if (company.isLoading) {
        return (
            <Page width="wide">
                <Card>
                    <EmptyState>Ładowanie firmy…</EmptyState>
                </Card>
            </Page>
        );
    }

    if (company.isError || !company.data) {
        return (
            <Page width="wide">
                <Card>
                    <EmptyState title="Błąd">
                        Nie udało się załadować firmy. Wróć do{' '}
                        <Link to="/firms">listy firm</Link>.
                    </EmptyState>
                </Card>
            </Page>
        );
    }

    const c = company.data;

    return (
        <Page width="wide">
            <div className={styles.headerWithLogo}>
                <Avatar
                    initials={c.name.slice(0, 2)}
                    size="xl"
                    tone="info"
                    square
                />
                <PageHeader
                    breadcrumb={[
                        { label: 'Baza firm', to: '/firms' },
                        { label: c.name },
                    ]}
                    title={c.name}
                    chips={
                        <Badge
                            tone={c.is_partner ? 'success' : 'neutral'}
                            pill
                            icon={<Building2 size={12} />}
                        >
                            {c.is_partner ? 'Klient' : 'Kontakt'}
                        </Badge>
                    }
                    actions={
                        <>
                            <Button
                                variant="secondary"
                                onClick={() => setEditCompanyOpen(true)}
                                disabled={!canEditCompany}
                                title={
                                    canEditCompany
                                        ? undefined
                                        : 'Edycja danych firmy zarezerwowana dla opiekuna partnerów'
                                }
                                iconLeft={<Pencil size={14} />}
                            >
                                Edytuj dane
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setShowReport(true)}
                            >
                                Raport
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => setAddActivityOpen(true)}
                                iconLeft={<Plus size={14} />}
                            >
                                Nowy wpis
                            </Button>
                        </>
                    }
                />
            </div>

            <div className={styles.grid}>
                <div className={styles.leftCol}>
                    <Card padding="compact">
                        <CardHeader
                            title="Informacje ogólne"
                            icon={<Info size={18} />}
                        />
                        <CompanyInfo company={c} />
                    </Card>

                    <Card padding="compact">
                        <CardHeader
                            title="Historia współpracy"
                            icon={<History size={18} />}
                            action={
                                <Link to="/events" className={styles.linkSubtle}>
                                    Zobacz wszystko
                                </Link>
                            }
                        />
                        <CooperationTimeline
                            companyId={c.id}
                            eventLinks={events.data ?? []}
                            isLoading={events.isLoading}
                        />
                    </Card>
                </div>

                <div className={styles.rightCol}>
                    <RelationshipValue
                        eventLinks={events.data ?? []}
                        isLoading={events.isLoading}
                    />

                    <Card padding="compact">
                        <CardHeader
                            title="Osoby kontaktowe"
                            icon={<Users size={18} />}
                            action={
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    iconOnly
                                    aria-label="Dodaj kontakt"
                                    onClick={() => setAddContactOpen(true)}
                                >
                                    <Plus size={14} />
                                </Button>
                            }
                        />
                        <ContactsList
                            contacts={contacts.data ?? []}
                            isLoading={contacts.isLoading}
                        />
                    </Card>

                    <Card padding="compact">
                        <CardHeader
                            title="Notatki"
                            icon={<NotebookPen size={18} />}
                        />
                        <CompanyActivities
                            companyId={c.id}
                            activities={activities.data ?? []}
                            isLoading={activities.isLoading}
                        />
                    </Card>

                    <Card padding="compact">
                        <CardHeader
                            title="Dokumenty"
                            icon={<FileText size={18} />}
                        />
                        <CompanyDocuments
                            companyId={company.data?.id ?? 0}
                        />
                    </Card>
                </div>
            </div>

            <AddContactModal
                open={addContactOpen}
                companyId={c.id}
                onClose={() => setAddContactOpen(false)}
            />
            <AddActivityModal
                open={addActivityOpen}
                onClose={() => setAddActivityOpen(false)}
                defaults={{ companyId: c.id }}
            />
            <EditCompanyModal
                open={editCompanyOpen}
                company={c}
                onClose={() => setEditCompanyOpen(false)}
            />

            {showReport && (
                <div className={styles.reportOverlay}>
                    <div className={styles.reportModal}>
                        <div className={styles.reportHeader}>
                            <h2>Historia: {c.name}</h2>
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
                                    <h3>Informacje</h3>
                                    <div className={styles.reportInfo}>
                                        <div><strong>Nazwa:</strong> {companyReport.data.legal_name || companyReport.data.company_name}</div>
                                        <div><strong>Miasto:</strong> {companyReport.data.city || '—'}</div>
                                        <div><strong>Branża:</strong> {companyReport.data.industry || '—'}</div>
                                    </div>
                                </div>

                                <div className={styles.reportSection}>
                                    <h3>Lejek</h3>
                                    <table className={styles.reportTable}>
                                        <thead>
                                            <tr>
                                                <th>Etap</th>
                                                <th>Liczba</th>
                                                <th>Wartość</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {companyReport.data.stages.map((s, i) => (
                                                <tr key={i}>
                                                    <td>{s.stage_name}</td>
                                                    <td>{s.count}</td>
                                                    <td>{s.stage_outcome === 'won' ? `${s.value.toLocaleString('pl-PL')} PLN` : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {companyReport.data.partnerships.length > 0 && (
                                    <div className={styles.reportSection}>
                                        <h3>Partnerstwa ({companyReport.data.total_partnerships})</h3>
                                        <table className={styles.reportTable}>
                                            <thead>
                                                <tr>
                                                    <th>Data podp.</th>
                                                    <th>Wydarzenie</th>
                                                    <th>Pakiet</th>
                                                    <th>Kwota</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {companyReport.data.partnerships.map((p, i) => (
                                                    <tr key={i}>
                                                        <td>{p.contract_signed_at?.split('T')[0] || '—'}</td>
                                                        <td>{p.event_name || '—'}</td>
                                                        <td>{p.package_name || '—'}</td>
                                                        <td>{p.amount_gross.toLocaleString('pl-PL')} PLN</td>
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

export default CompanyDetail;
