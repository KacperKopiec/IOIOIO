import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { ReportsResponse } from '../../types/api';

export const reportsKey = ['reports'] as const;

export function useReports() {
    return useQuery({
        queryKey: reportsKey,
        queryFn: async (): Promise<ReportsResponse> => {
            const { data } = await api.get<ReportsResponse>('/reports');
            return data;
        },
    });
}
