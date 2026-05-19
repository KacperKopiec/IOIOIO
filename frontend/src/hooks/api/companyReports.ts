import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export interface CompanyReport {
    company_id: number;
    company_name: string;
    legal_name: string | null;
    city: string | null;
    industry: string | null;
    stages: {
        stage_name: string;
        stage_outcome: string | null;
        count: number;
        value: number;
    }[];
    activities: {
        activity_type: string;
        subject: string;
        activity_date: string | null;
        due_date: string | null;
        completed_at: string | null;
    }[];
    partnerships: {
        event_id: number | null;
        event_name: string | null;
        package_name: string | null;
        amount_net: number;
        amount_gross: number;
        contract_signed_at: string | null;
        start_date: string | null;
        end_date: string | null;
    }[];
    total_pipeline_won_value: number;
    total_partnerships: number;
}

export const companyReportKeys = {
    detail: (id: number) => ['companies', id, 'report'] as const,
};

export function useCompanyReport(id: number | null) {
    return useQuery({
        queryKey: id != null ? companyReportKeys.detail(id) : ['companies', 'report', 'none'],
        queryFn: async (): Promise<CompanyReport> => {
            const { data } = await api.get<CompanyReport>(`/companies/${id}/report`);
            return data;
        },
        enabled: id != null,
    });
}
