import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { CompanyRelationship, RelationshipStatus } from '../../types/api';

export interface CompanyRelationshipFilters {
    company_id?: number;
    event_id?: number;
    status?: RelationshipStatus;
}

export const companyRelationshipKeys = {
    all: ['company-relationships'] as const,
    list: (filters: CompanyRelationshipFilters) =>
        ['company-relationships', 'list', filters] as const,
};

export function useCompanyRelationships(filters: CompanyRelationshipFilters = {}) {
    return useQuery({
        queryKey: companyRelationshipKeys.list(filters),
        queryFn: async (): Promise<CompanyRelationship[]> => {
            const { data } = await api.get<CompanyRelationship[]>(
                '/company-relationships',
                { params: filters },
            );
            return data;
        },
    });
}

export function useDeleteCompanyRelationship() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number): Promise<void> => {
            await api.delete(`/company-relationships/${id}`);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: companyRelationshipKeys.all });
        },
    });
}
