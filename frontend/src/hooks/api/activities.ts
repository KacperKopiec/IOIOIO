import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Activity } from '../../types/api';

export interface ActivityFilters {
    company_id?: number;
    event_id?: number;
    pipeline_entry_id?: number;
    assigned_user_id?: number;
    due_before?: string;
    overdue_only?: boolean;
    limit?: number;
}

export const activityKeys = {
    all: ['activities'] as const,
    list: (filters: ActivityFilters) => ['activities', 'list', filters] as const,
};

export function useActivities(filters: ActivityFilters = {}) {
    return useQuery({
        queryKey: activityKeys.list(filters),
        queryFn: async (): Promise<Activity[]> => {
            console.log('Fetching activities with filters:', filters);
            const { data } = await api.get<Activity[]>('/activities', { params: filters });
            console.log('Activities fetched:', data.length);
            return data;
        },
    });
}

export interface ActivityCreatePayload
    extends Omit<Partial<Activity>, 'id' | 'created_at'> {
    activity_type: Activity['activity_type'];
    subject: string;
}

export function useCreateActivity() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: ActivityCreatePayload): Promise<Activity> => {
            console.log('API call: POST /activities', payload);
            const { data } = await api.post<Activity>('/activities', payload);
            console.log('API response:', data);
            return data;
        },
        onSuccess: () => {
            console.log('Invalidating all queries');
            qc.invalidateQueries();
            console.log('Invalidated');
        },
    });
}

export interface ActivityUpdatePayload {
    subject?: string;
    activity_type?: Activity['activity_type'];
    due_date?: string | null;
    completed_at?: string | null;
    notes?: string | null;
}

export function useUpdateActivity() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (vars: { id: number; payload: Partial<ActivityUpdatePayload> }): Promise<Activity> => {
            const { data } = await api.patch<Activity>(`/activities/${vars.id}`, vars.payload);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['activities'] });
        },
    });
}
