import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { api } from '../../lib/api';
import type {
    Activity,
    Company,
    CompanyCreate,
    CompanySize,
    CompanyUpdate,
    Contact,
    Document,
    Page,
} from '../../types/api';

export interface CompanyEventLink {
    pipeline_entry_id: number;
    event_id: number;
    event_name: string;
    event_start_date: string | null;
    event_end_date: string | null;
    event_status: string;
    stage_id: number;
    stage_name: string;
    stage_outcome: string;
    expected_amount: string | null;
    agreed_amount: string | null;
    closed_at: string | null;
}

export interface CompanyFilters {
    q?: string;
    industry_id?: number | null;
    company_size?: CompanySize | null;
    tag_ids?: number[];
    relation_status?: 'active' | 'inactive' | null;
    page?: number;
    page_size?: number;
}

export const companyKeys = {
    all: ['companies'] as const,
    list: (filters: CompanyFilters) => ['companies', 'list', filters] as const,
    detail: (id: number) => ['companies', 'detail', id] as const,
    contacts: (id: number) => ['companies', id, 'contacts'] as const,
    events: (id: number) => ['companies', id, 'events'] as const,
    activities: (id: number) => ['companies', id, 'activities'] as const,
    documents: (id: number) => ['companies', id, 'documents'] as const,
};

function buildParams(filters: CompanyFilters) {
    const params: Record<string, unknown> = {};
    if (filters.q) params.q = filters.q;
    if (filters.industry_id != null) params.industry_id = filters.industry_id;
    if (filters.company_size) params.company_size = filters.company_size;
    if (filters.tag_ids && filters.tag_ids.length > 0) {
        params.tag_ids = filters.tag_ids.join(',');
    }
    if (filters.relation_status) params.relation_status = filters.relation_status;
    params.page = filters.page ?? 1;
    params.page_size = filters.page_size ?? 25;
    return params;
}

export function useCompanies(filters: CompanyFilters) {
    return useQuery({
        queryKey: companyKeys.list(filters),
        queryFn: async (): Promise<Page<Company>> => {
            const { data } = await api.get<Page<Company>>('/companies', {
                params: buildParams(filters),
            });
            return data;
        },
    });
}

export function useCompany(id: number | null) {
    return useQuery({
        queryKey: id != null ? companyKeys.detail(id) : ['companies', 'detail', 'none'],
        queryFn: async (): Promise<Company> => {
            const { data } = await api.get<Company>(`/companies/${id}`);
            return data;
        },
        enabled: id != null,
    });
}

export function useCompanyContacts(id: number | null) {
    return useQuery({
        queryKey: id != null ? companyKeys.contacts(id) : ['companies', 'contacts', 'none'],
        queryFn: async (): Promise<Contact[]> => {
            const { data } = await api.get<Contact[]>(`/companies/${id}/contacts`);
            return data;
        },
        enabled: id != null,
    });
}

export function useCompanyEvents(id: number | null) {
    return useQuery({
        queryKey: id != null ? companyKeys.events(id) : ['companies', 'events', 'none'],
        queryFn: async (): Promise<CompanyEventLink[]> => {
            const { data } = await api.get<CompanyEventLink[]>(`/companies/${id}/events`);
            return data;
        },
        enabled: id != null,
    });
}

export function useCompanyActivities(id: number | null) {
    return useQuery({
        queryKey:
            id != null ? companyKeys.activities(id) : ['companies', 'activities', 'none'],
        queryFn: async (): Promise<Activity[]> => {
            const { data } = await api.get<Activity[]>(`/companies/${id}/activities`);
            return data;
        },
        enabled: id != null,
    });
}

export function useCompanyDocuments(id: number | null, includeArchived: boolean = false) {
    return useQuery({
        queryKey:
            id != null ? [...companyKeys.documents(id), includeArchived] : ['companies', 'documents', 'none'],
        queryFn: async (): Promise<Document[]> => {
            const { data } = await api.get<Document[]>(`/companies/${id}/documents?include_archived=${includeArchived}`);
            return data;
        },
        enabled: id != null,
    });
}

export interface DocumentCreate {
    file_name: string;
    file_url: string;
    document_type?: string;
}

export function useCreateCompanyDocument(companyId: number, userId: number | null) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: DocumentCreate): Promise<Document> => {
            const url = userId != null
                ? `/companies/${companyId}/documents?user_id=${userId}`
                : `/companies/${companyId}/documents`;
            const { data } = await api.post<Document>(url, payload);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: companyKeys.documents(companyId) });
        },
    });
}

export function useUploadCompanyDocument(companyId: number, userId: number | null) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { file: File; document_type?: string }): Promise<Document> => {
            const formData = new FormData();
            formData.append('file', payload.file);
            const params = new URLSearchParams();
            if (payload.document_type) {
                params.append('document_type', payload.document_type);
            }
            if (userId != null) {
                params.append('user_id', String(userId));
            }
            const queryString = params.toString();
            const url = queryString
                ? `/companies/${companyId}/documents/upload?${queryString}`
                : `/companies/${companyId}/documents/upload`;
            const { data } = await api.post<Document>(url, formData);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: companyKeys.documents(companyId) });
        },
    });
}

export function useDeleteCompanyDocument(companyId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (documentId: number): Promise<void> => {
            await api.delete(`/companies/${companyId}/documents/${documentId}`);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: companyKeys.documents(companyId) });
        },
    });
}

export function useArchiveCompanyDocument(companyId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (documentId: number): Promise<Document> => {
            const { data } = await api.post<Document>(`/companies/${companyId}/documents/${documentId}/archive`);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['companies', companyId, 'documents'] });
        },
    });
}

export function useUnarchiveCompanyDocument(companyId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (documentId: number): Promise<Document> => {
            const { data } = await api.post<Document>(`/companies/${companyId}/documents/${documentId}/unarchive`);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['companies', companyId, 'documents'] });
        },
    });
}

export function useCreateCompany() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: CompanyCreate): Promise<Company> => {
            const { data } = await api.post<Company>('/companies', payload);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: companyKeys.all });
        },
    });
}

export function useUpdateCompany(id: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: CompanyUpdate): Promise<Company> => {
            const { data } = await api.patch<Company>(`/companies/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: companyKeys.all });
            qc.invalidateQueries({ queryKey: companyKeys.detail(id) });
        },
    });
}

export function useDeleteCompany() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number): Promise<void> => {
            await api.delete(`/companies/${id}`);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: companyKeys.all });
        },
    });
}

export const eventCompanyDocumentKeys = {
    list: (eventId: number, companyId: number) => ['events', eventId, 'companies', companyId, 'documents'] as const,
};

export function useEventCompanyDocuments(eventId: number | null, companyId: number | null, includeArchived: boolean = false) {
    return useQuery({
        queryKey: eventId != null && companyId != null
            ? [...eventCompanyDocumentKeys.list(eventId, companyId), includeArchived]
            : ['events', 'documents', 'none'],
        queryFn: async (): Promise<Document[]> => {
            if (eventId == null || companyId == null) return [];
            const { data } = await api.get<Document[]>(`/events/${eventId}/companies/${companyId}/documents?include_archived=${includeArchived}`);
            return data;
        },
        enabled: eventId != null && companyId != null,
    });
}

export function useCreateEventCompanyDocument(eventId: number, companyId: number, userId: number | null) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: DocumentCreate): Promise<Document> => {
            const url = userId != null
                ? `/events/${eventId}/companies/${companyId}/documents?user_id=${userId}`
                : `/events/${eventId}/companies/${companyId}/documents`;
            const { data } = await api.post<Document>(url, payload);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: eventCompanyDocumentKeys.list(eventId, companyId) });
        },
    });
}

export function useUploadEventCompanyDocument(eventId: number, companyId: number, userId: number | null) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { file: File; document_type?: string }): Promise<Document> => {
            const formData = new FormData();
            formData.append('file', payload.file);
            const params = new URLSearchParams();
            if (payload.document_type) {
                params.append('document_type', payload.document_type);
            }
            if (userId != null) {
                params.append('user_id', String(userId));
            }
            const queryString = params.toString();
            const url = queryString
                ? `/events/${eventId}/companies/${companyId}/documents/upload?${queryString}`
                : `/events/${eventId}/companies/${companyId}/documents/upload`;
            const { data } = await api.post<Document>(url, formData);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: eventCompanyDocumentKeys.list(eventId, companyId) });
        },
    });
}

export function useDeleteEventCompanyDocument(eventId: number, companyId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (documentId: number): Promise<void> => {
            await api.delete(`/events/${eventId}/companies/${companyId}/documents/${documentId}`);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: eventCompanyDocumentKeys.list(eventId, companyId) });
        },
    });
}

export function useArchiveEventCompanyDocument(eventId: number, companyId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (documentId: number): Promise<Document> => {
            const { data } = await api.post<Document>(`/events/${eventId}/companies/${companyId}/documents/${documentId}/archive`);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['events', eventId, 'companies', companyId, 'documents'] });
        },
    });
}

export function useUnarchiveEventCompanyDocument(eventId: number, companyId: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (documentId: number): Promise<Document> => {
            const { data } = await api.post<Document>(`/events/${eventId}/companies/${companyId}/documents/${documentId}/unarchive`);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['events', eventId, 'companies', companyId, 'documents'] });
        },
    });
}
