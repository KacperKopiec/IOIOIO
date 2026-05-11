import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Building2, History, Info, NotebookPen, Pencil, Plus, Users } from 'lucide-react';
import {
    useCompany,
    useCompanyContacts,
    useCompanyEvents,
} from '../hooks/api/companies';
import CompanyInfo from '../components/CompanyDetail/CompanyInfo';
import CooperationTimeline from '../components/CompanyDetail/CooperationTimeline';
import RelationshipValue from '../components/CompanyDetail/RelationshipValue';
import ContactsList from '../components/CompanyDetail/ContactsList';
import CompanyNotes from '../components/CompanyDetail/CompanyNotes';
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

    const [editingNotes, setEditingNotes] = useState(false);
    const [addContactOpen, setAddContactOpen] = useState(false);
    const [addActivityOpen, setAddActivityOpen] = useState(false);
    const [editCompanyOpen, setEditCompanyOpen] = useState(false);

    const company = useCompany(companyId);
    const contacts = useCompanyContacts(companyId);
    const events = useCompanyEvents(companyId);

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
                            action={
                                !editingNotes && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        iconOnly
                                        aria-label="Edytuj notatki"
                                        onClick={() => setEditingNotes(true)}
                                    >
                                        <Pencil size={14} />
                                    </Button>
                                )
                            }
                        />
                        <CompanyNotes
                            companyId={c.id}
                            notes={c.notes}
                            editing={editingNotes}
                            onCancel={() => setEditingNotes(false)}
                            onSaved={() => setEditingNotes(false)}
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
        </Page>
    );
};

export default CompanyDetail;
