import React, { useMemo, useState } from 'react';
import { Plus, ReceiptText, Trash2 } from 'lucide-react';
import {
    useCompanyEvents,
    useCompanies,
    type CompanyEventLink,
} from '../../hooks/api/companies';
import { useEventPipeline, useEvents } from '../../hooks/api/events';
import {
    useCreateInvoice,
    useDeleteInvoice,
    useInvoices,
    useUpdateInvoice,
} from '../../hooks/api/invoices';
import { toApiError } from '../../lib/api';
import { formatDate, formatPLN } from '../../lib/format';
import type { Invoice, PaymentStatus, PipelineEntry } from '../../types/api';
import styles from './InvoicePanel.module.css';

interface InvoicePanelProps {
    companyId?: number | null;
    eventId?: number | null;
}

const STATUS_LABELS: Record<PaymentStatus, string> = {
    pending: 'Oczekuje',
    paid: 'Zapłacona',
    unpaid: 'Niezapłacona',
};

const STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
    { value: 'pending', label: STATUS_LABELS.pending },
    { value: 'unpaid', label: STATUS_LABELS.unpaid },
    { value: 'paid', label: STATUS_LABELS.paid },
];

function statusClass(status: PaymentStatus) {
    if (status === 'paid') return styles.statusPaid;
    if (status === 'unpaid') return styles.statusUnpaid;
    return styles.statusPending;
}

interface InvoiceRowProps {
    invoice: Invoice;
}

const InvoiceRow: React.FC<InvoiceRowProps> = ({ invoice }) => {
    const update = useUpdateInvoice(invoice.id);
    const remove = useDeleteInvoice();

    function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const paymentStatus = e.target.value as PaymentStatus;
        update.mutate({
            payment_status: paymentStatus,
            paid_at:
                paymentStatus === 'paid'
                    ? new Date().toISOString().slice(0, 10)
                    : null,
        });
    }

    return (
        <div className={styles.invoice}>
            <ReceiptText size={18} className={styles.icon} />
            <div className={styles.body}>
                <div className={styles.titleRow}>
                    <span className={styles.number}>{invoice.invoice_number}</span>
                    <span className={styles.amount}>
                        {formatPLN(invoice.amount)}
                    </span>
                    <span className={`${styles.status} ${statusClass(invoice.payment_status)}`}>
                        {STATUS_LABELS[invoice.payment_status]}
                    </span>
                </div>
                <div className={styles.meta}>
                    <span>Data: {formatDate(invoice.issue_date)}</span>
                    <span>Termin: {formatDate(invoice.due_date)}</span>
                    {invoice.company_name && <span>Firma: {invoice.company_name}</span>}
                    {invoice.event_name && <span>Inicjatywa: {invoice.event_name}</span>}
                </div>
                {invoice.notes && <div className={styles.meta}>{invoice.notes}</div>}
            </div>
            <div className={styles.actions}>
                <select
                    className={styles.statusSelect}
                    value={invoice.payment_status}
                    onChange={handleStatusChange}
                    disabled={update.isPending}
                >
                    {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => {
                        if (confirm('Czy na pewno usunąć tę fakturę?')) {
                            remove.mutate(invoice.id);
                        }
                    }}
                    disabled={remove.isPending}
                    title="Usuń fakturę"
                    aria-label="Usuń fakturę"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};

const InvoicePanel: React.FC<InvoicePanelProps> = ({ companyId = null, eventId = null }) => {
    const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
    const [showForm, setShowForm] = useState(false);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('PLN');
    const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
    const [dueDate, setDueDate] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
        companyId != null ? String(companyId) : '',
    );
    const [selectedEventId, setSelectedEventId] = useState<string>(
        eventId != null ? String(eventId) : '',
    );
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);

    const invoices = useInvoices({
        company_id: companyId,
        event_id: eventId,
        payment_status: statusFilter || null,
    });
    const companyEvents = useCompanyEvents(companyId ?? null);
    const eventPipeline = useEventPipeline(eventId ?? null);
    const allCompanies = useCompanies({ page: 1, page_size: 100 });
    const allEvents = useEvents({ page: 1, page_size: 100 });
    const create = useCreateInvoice();

    const companyOptions = useMemo(() => {
        if (eventId != null) {
            const entries = eventPipeline.data ?? [];
            const seen = new Set<number>();
            return entries
                .filter((entry: PipelineEntry) => {
                    if (!entry.company || seen.has(entry.company.id)) return false;
                    seen.add(entry.company.id);
                    return true;
                })
                .map((entry) => ({
                    id: entry.company!.id,
                    name: entry.company!.name,
                }));
        }
        return (allCompanies.data?.items ?? []).map((company) => ({
            id: company.id,
            name: company.name,
        }));
    }, [allCompanies.data, eventId, eventPipeline.data]);

    const eventOptions = useMemo(
        () => {
            if (companyId == null) {
                return (allEvents.data?.items ?? []).map((event) => ({
                    id: event.id,
                    name: event.name,
                }));
            }
            return (companyEvents.data ?? []).map((link: CompanyEventLink) => ({
                id: link.event_id,
                name: link.event_name,
            }));
        },
        [allEvents.data, companyEvents.data, companyId],
    );

    function resetForm() {
        setInvoiceNumber('');
        setAmount('');
        setCurrency('PLN');
        setIssueDate(new Date().toISOString().slice(0, 10));
        setDueDate('');
        setPaymentStatus('pending');
        setSelectedCompanyId(companyId != null ? String(companyId) : '');
        setSelectedEventId(eventId != null ? String(eventId) : '');
        setNotes('');
        setError(null);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const parsedCompanyId = Number.parseInt(selectedCompanyId, 10);
        if (!invoiceNumber.trim()) {
            setError('Numer faktury jest wymagany.');
            return;
        }
        if (!selectedCompanyId || Number.isNaN(parsedCompanyId)) {
            setError('Firma jest wymagana.');
            return;
        }
        if (!amount || Number.parseFloat(amount) < 0) {
            setError('Kwota faktury jest wymagana.');
            return;
        }
        if (!issueDate) {
            setError('Data faktury jest wymagana.');
            return;
        }

        setError(null);
        create.mutate(
            {
                company_id: parsedCompanyId,
                event_id: selectedEventId ? Number.parseInt(selectedEventId, 10) : null,
                invoice_number: invoiceNumber.trim(),
                amount,
                currency: currency.trim() || 'PLN',
                issue_date: issueDate,
                due_date: dueDate || null,
                payment_status: paymentStatus,
                paid_at: paymentStatus === 'paid' ? new Date().toISOString().slice(0, 10) : null,
                notes: notes.trim() || null,
            },
            {
                onSuccess: () => {
                    resetForm();
                    setShowForm(false);
                },
                onError: (err) => setError(toApiError(err).detail),
            },
        );
    }

    const items = invoices.data ?? [];

    return (
        <div>
            <div className={styles.toolbar}>
                <select
                    className={styles.filter}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | '')}
                >
                    <option value="">Wszystkie płatności</option>
                    {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    className={styles.addButton}
                    onClick={() => setShowForm(true)}
                >
                    <Plus size={14} />
                    Dodaj fakturę
                </button>
            </div>

            {showForm && (
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.row2}>
                        <input
                            className={styles.input}
                            placeholder="Numer faktury"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            required
                        />
                        <input
                            className={styles.input}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Kwota"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.row2}>
                        <input
                            className={styles.input}
                            placeholder="Waluta"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                        />
                        <select
                            className={styles.select}
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.row2}>
                        <input
                            className={styles.input}
                            type="date"
                            value={issueDate}
                            onChange={(e) => setIssueDate(e.target.value)}
                            required
                        />
                        <input
                            className={styles.input}
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>
                    {companyId == null && (
                        <select
                            className={styles.select}
                            value={selectedCompanyId}
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                            required
                        >
                            <option value="">Wybierz firmę</option>
                            {companyOptions.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.name}
                                </option>
                            ))}
                        </select>
                    )}
                    {eventId == null && (
                        <select
                            className={styles.select}
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                        >
                            <option value="">Bez inicjatywy</option>
                            {eventOptions.map((event) => (
                                <option key={event.id} value={event.id}>
                                    {event.name}
                                </option>
                            ))}
                        </select>
                    )}
                    <textarea
                        className={styles.textarea}
                        placeholder="Notatki"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                    {error && <div className={styles.error}>{error}</div>}
                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={() => {
                                resetForm();
                                setShowForm(false);
                            }}
                            disabled={create.isPending}
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={create.isPending}
                        >
                            {create.isPending ? 'Zapisywanie...' : 'Zapisz fakturę'}
                        </button>
                    </div>
                </form>
            )}

            {invoices.isLoading ? (
                <div className={styles.empty}>Ładowanie faktur...</div>
            ) : items.length === 0 ? (
                <div className={styles.empty}>Brak faktur dla wybranego widoku.</div>
            ) : (
                <div className={styles.list}>
                    {items.map((invoice) => (
                        <InvoiceRow key={invoice.id} invoice={invoice} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default InvoicePanel;
