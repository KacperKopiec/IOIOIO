import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { ReportsResponse } from '../../types/api';

export interface ReportFilters {
    year?: number | null;
    industry_id?: number | null;
    owner_user_id?: number | null;
    event_id?: number | null;
    company_id?: number | null;
}

export const reportsKey = {
    all: ['reports'] as const,
    detail: (filters: ReportFilters) => ['reports', filters] as const,
};

export function buildReportParams(filters: ReportFilters) {
    const params: Record<string, unknown> = {};
    if (filters.year != null) params.year = filters.year;
    if (filters.industry_id != null) params.industry_id = filters.industry_id;
    if (filters.owner_user_id != null) params.owner_user_id = filters.owner_user_id;
    if (filters.event_id != null) params.event_id = filters.event_id;
    if (filters.company_id != null) params.company_id = filters.company_id;
    return params;
}

export function buildReportExportUrl(filters: ReportFilters) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(buildReportParams(filters))) {
        params.set(key, String(value));
    }
    const query = params.toString();
    return query ? `/api/reports/export.csv?${query}` : '/api/reports/export.csv';
}

export function useReports(filters: ReportFilters = {}) {
    return useQuery({
        queryKey: reportsKey.detail(filters),
        queryFn: async (): Promise<ReportsResponse> => {
            const { data } = await api.get<ReportsResponse>('/reports', {
                params: buildReportParams(filters),
            });
            return data;
        },
    });
}
