import React, { useRef, useState } from 'react';
import { Archive, ArchiveRestore, ChevronDown, ChevronUp, FileText, ExternalLink, Plus, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../../context/auth';
import {
    useArchiveEventCompanyDocument,
    useCreateEventCompanyDocument,
    useDeleteEventCompanyDocument,
    useEventCompanyDocuments,
    useUnarchiveEventCompanyDocument,
    useUploadEventCompanyDocument,
    type DocumentCreate,
} from '../../hooks/api/companies';
import styles from '../CompanyDetail/CompanyDocuments.module.css';

interface EventCompanyDocumentsProps {
    eventId: number;
    companyId: number;
}

const documentTypeLabels: Record<string, string> = {
    contract: 'Umowa',
    report: 'Raport',
    invoice: 'Faktura',
    graphic: 'Grafika',
    other: 'Inny',
};

const documentTypeOptions = [
    { value: '', label: 'Wybierz typ (opcjonalne)' },
    { value: 'contract', label: 'Umowa' },
    { value: 'report', label: 'Raport' },
    { value: 'invoice', label: 'Faktura' },
    { value: 'graphic', label: 'Grafika' },
    { value: 'other', label: 'Inny' },
];

const EventCompanyDocuments: React.FC<EventCompanyDocumentsProps> = ({
    eventId,
    companyId,
}) => {
    const [showArchived, setShowArchived] = useState(false);
    const documentsQuery = useEventCompanyDocuments(eventId, companyId, showArchived);
    const documents = documentsQuery.data ?? [];
    const isLoading = documentsQuery.isLoading;

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<DocumentCreate>({
        file_name: '',
        file_url: '',
        document_type: '',
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadType, setUploadType] = useState<'url' | 'file'>('url');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { userId } = useAuth();
    const createDoc = useCreateEventCompanyDocument(eventId, companyId, userId);
    const uploadDoc = useUploadEventCompanyDocument(eventId, companyId, userId);
    const deleteDoc = useDeleteEventCompanyDocument(eventId, companyId);
    const archiveDoc = useArchiveEventCompanyDocument(eventId, companyId);
    const unarchiveDoc = useUnarchiveEventCompanyDocument(eventId, companyId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (uploadType === 'url') {
            if (!formData.file_name || !formData.file_url) return;
            createDoc.mutate(
                {
                    ...formData,
                    document_type: formData.document_type || undefined,
                },
                {
                    onSuccess: () => {
                        setShowForm(false);
                        setFormData({ file_name: '', file_url: '', document_type: '' });
                    },
                },
            );
        } else {
            if (!selectedFile) return;
            uploadDoc.mutate(
                { file: selectedFile, document_type: formData.document_type || undefined },
                {
                    onSuccess: () => {
                        setShowForm(false);
                        setSelectedFile(null);
                        setFormData({ file_name: '', file_url: '', document_type: '' });
                    },
                },
            );
        }
    };

    if (isLoading) {
        return <div className={styles.empty}>Ładowanie dokumentów…</div>;
    }

    const isPending = createDoc.isPending || uploadDoc.isPending;

    return (
        <div>
            {!showForm && (
                <div className={styles.toolbar}>
                    <button
                        type="button"
                        className={styles.addButton}
                        onClick={() => setShowForm(true)}
                    >
                        <Plus size={14} />
                        Dodaj dokument
                    </button>
                    <button
                        type="button"
                        className={styles.archiveToggle}
                        onClick={() => {
                            setShowArchived(!showArchived);
                        }}
                        title={showArchived ? 'Ukryj archiwalne' : 'Pokaż archiwalne'}
                    >
                        {showArchived ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <ArchiveRestore size={14} />
                    </button>
                </div>
            )}
            {showForm && (
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.tabGroup}>
                        <button
                            type="button"
                            className={`${styles.tab} ${uploadType === 'url' ? styles.tabActive : ''}`}
                            onClick={() => setUploadType('url')}
                        >
                            Z URL
                        </button>
                        <button
                            type="button"
                            className={`${styles.tab} ${uploadType === 'file' ? styles.tabActive : ''}`}
                            onClick={() => setUploadType('file')}
                        >
                            <Upload size={12} /> Plik PDF
                        </button>
                    </div>
                    {uploadType === 'url' ? (
                        <>
                            <input
                                type="text"
                                placeholder="Nazwa pliku"
                                value={formData.file_name}
                                onChange={(e) =>
                                    setFormData({ ...formData, file_name: e.target.value })
                                }
                                className={styles.input}
                                required
                            />
                            <input
                                type="url"
                                placeholder="URL pliku (np. link do chmury)"
                                value={formData.file_url}
                                onChange={(e) =>
                                    setFormData({ ...formData, file_url: e.target.value })
                                }
                                className={styles.input}
                                required
                            />
                        </>
                    ) : (
                        <div className={styles.fileUpload}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                                className={styles.fileInput}
                            />
                            {selectedFile ? (
                                <div className={styles.fileName}>
                                    <FileText size={14} />
                                    {selectedFile.name}
                                </div>
                            ) : (
                                <div className={styles.filePlaceholder}>
                                    <Upload size={20} />
                                    <span>Kliknij lub przeciągnij plik PDF</span>
                                </div>
                            )}
                        </div>
                    )}
                    <select
                        value={formData.document_type}
                        onChange={(e) =>
                            setFormData({ ...formData, document_type: e.target.value })
                        }
                        className={styles.select}
                    >
                        {documentTypeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <div className={styles.formActions}>
                        <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={() => {
                                setShowForm(false);
                                setFormData({ file_name: '', file_url: '', document_type: '' });
                                setSelectedFile(null);
                            }}
                            disabled={isPending}
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={isPending || (uploadType === 'file' && !selectedFile)}
                        >
                            {isPending ? 'Dodawanie...' : 'Dodaj'}
                        </button>
                    </div>
                </form>
            )}
            {documents.length === 0 ? (
                <div className={styles.empty}>Brak dokumentów.</div>
            ) : (
                <div className={styles.list}>
                    {documents.map((doc) => (
                        <div key={doc.id} className={styles.row}>
                            <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.rowContent}
                            >
                                <FileText size={16} className={styles.icon} />
                                <div className={styles.body}>
                                    <span className={styles.name}>{doc.file_name}</span>
                                    <div className={styles.meta}>
                                        {doc.document_type && (
                                            <span className={styles.type}>
                                                {documentTypeLabels[doc.document_type] || doc.document_type}
                                            </span>
                                        )}
                                        <span className={styles.metaItem}>
                                            {new Date(doc.created_at).toLocaleDateString('pl-PL')}
                                        </span>
                                        {doc.uploaded_by_name && (
                                            <span className={styles.metaItem}>
                                                {doc.uploaded_by_name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <ExternalLink size={14} className={styles.linkIcon} />
                            </a>
                            <div className={styles.actions}>
                                {doc.archived ? (
                                    <button
                                        type="button"
                                        className={styles.actionButton}
                                        onClick={() => unarchiveDoc.mutate(doc.id)}
                                        disabled={unarchiveDoc.isPending}
                                        title="Przywróć z archiwum"
                                    >
                                        <Upload size={14} />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className={styles.actionButton}
                                        onClick={() => {
                                            if (confirm('Czy chcesz zarchiwizować ten dokument?')) {
                                                archiveDoc.mutate(doc.id);
                                            }
                                        }}
                                        disabled={archiveDoc.isPending}
                                        title="Archiwizuj dokument"
                                    >
                                        <Archive size={14} />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className={styles.deleteButton}
                                    onClick={() => {
                                        if (confirm('Czy na pewno chcesz usunąć ten dokument?')) {
                                            deleteDoc.mutate(doc.id);
                                        }
                                    }}
                                    disabled={deleteDoc.isPending}
                                    title="Usuń dokument"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventCompanyDocuments;