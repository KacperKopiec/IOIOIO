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
