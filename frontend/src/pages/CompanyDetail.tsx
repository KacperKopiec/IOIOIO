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
import SectionCard from '../components/CompanyDetail/SectionCard';
import AddActivityModal from '../components/modals/AddActivityModal';
import AddContactModal from '../components/modals/AddContactModal';
import styles from './CompanyDetail.module.css';

const CompanyDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const companyId = id ? Number.parseInt(id, 10) : null;

    const [editingNotes, setEditingNotes] = useState(false);
    const [addContactOpen, setAddContactOpen] = useState(false);
    const [addActivityOpen, setAddActivityOpen] = useState(false);

    const company = useCompany(companyId);
    const contacts = useCompanyContacts(companyId);
    const events = useCompanyEvents(companyId);

    if (company.isLoading) {
        return (
            <div className={styles.page}>
                <div className={styles.loading}>Ładowanie firmy…</div>
            </div>
        );
    }

    if (company.isError || !company.data) {
        return (
            <div className={styles.page}>
                <div className={styles.errorBox}>
                    Nie udało się załadować firmy. Wróć do{' '}
                    <Link to="/firms">listy firm</Link>.
                </div>
            </div>
        );
    }

    const c = company.data;
    const initial = c.name.charAt(0).toUpperCase();

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.companyIcon} aria-hidden>
                        {initial}
                    </div>
                    <div className={styles.headerBody}>
                        <nav className={styles.breadcrumb} aria-label="breadcrumb">
                            <Link to="/firms">Baza Firm</Link>
                            <span className={styles.breadcrumbSep}>›</span>
                            <span className={styles.breadcrumbCurrent}>{c.name}</span>
                        </nav>
                        <div className={styles.titleRow}>
                            <h1 className={styles.title}>{c.name}</h1>
                            <span
                                className={`${styles.statusBadge} ${c.is_partner
                                    ? styles.statusBadgePartner
                                    : styles.statusBadgeContact
                                    }`}
                            >
                                <Building2 size={12} />
                                {c.is_partner ? 'Klient' : 'Kontakt'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        disabled
                    >
                        Edytuj dane
                    </button>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        onClick={() => setAddActivityOpen(true)}
                    >
                        Nowy wpis
                    </button>
                </div>
            </header>

            <div className={styles.grid}>
                <div className={styles.leftCol}>
                    <SectionCard title="Informacje ogólne" icon={<Info size={18} />}>
                        <CompanyInfo company={c} />
                    </SectionCard>

                    <SectionCard
                        title="Historia współpracy"
                        icon={<History size={18} />}
                        action={
                            <Link to="/events" className={styles.linkSubtle}>
                                Zobacz wszystko
                            </Link>
                        }
                    >
                        <CooperationTimeline
                            companyId={c.id}
                            eventLinks={events.data ?? []}
                            isLoading={events.isLoading}
                        />
                    </SectionCard>
                </div>

                <div className={styles.rightCol}>
                    <RelationshipValue
                        eventLinks={events.data ?? []}
                        isLoading={events.isLoading}
                    />
                    <SectionCard
                        title="Osoby kontaktowe"
                        icon={<Users size={18} />}
                        action={
                            <button
                                type="button"
                                className={styles.iconButton}
                                onClick={() => setAddContactOpen(true)}
                                aria-label="Dodaj kontakt"
                            >
                                <Plus size={14} />
                            </button>
                        }
                    >
                        <ContactsList
                            contacts={contacts.data ?? []}
                            isLoading={contacts.isLoading}
                        />
                    </SectionCard>

                    <SectionCard
                        title="Notatki"
                        icon={<NotebookPen size={18} />}
                        action={
                            !editingNotes && (
                                <button
                                    type="button"
                                    className={styles.iconButton}
                                    onClick={() => setEditingNotes(true)}
                                    aria-label="Edytuj notatki"
                                >
                                    <Pencil size={14} />
                                </button>
                            )
                        }
                    >
                        <CompanyNotes
                            companyId={c.id}
                            notes={c.notes}
                            editing={editingNotes}
                            onCancel={() => setEditingNotes(false)}
                            onSaved={() => setEditingNotes(false)}
                        />
                    </SectionCard>
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
        </div>
    );
};

export default CompanyDetail;
