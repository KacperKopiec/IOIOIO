import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type {
    Event,
    EventCreate,
    EventKpi,
    EventStatus,
    EventUpdate,
    Page,
    PipelineEntry,
} from '../../types/api';

export interface EventFilters {
    status?: EventStatus | null;
    owner_user_id?: number | null;
    q?: string;
    tag_ids?: number[];
    page?: number;
    page_size?: number;
}

export const eventKeys = {
    all: ['events'] as const,
    list: (filters: EventFilters) => ['events', 'list', filters] as const,
    detail: (id: number) => ['events', 'detail', id] as const,
    pipeline: (id: number) => ['events', id, 'pipeline'] as const,
    kpi: (id: number) => ['events', id, 'kpi'] as const,
};

function buildParams(filters: EventFilters) {
    const params: Record<string, unknown> = {};
    if (filters.status) params.status = filters.status;
    if (filters.owner_user_id != null) params.owner_user_id = filters.owner_user_id;
    if (filters.q) params.q = filters.q;
    if (filters.tag_ids && filters.tag_ids.length > 0) {
        params.tag_ids = filters.tag_ids.join(',');
    }
    params.page = filters.page ?? 1;
    params.page_size = filters.page_size ?? 25;
    return params;
}

export function useEvents(filters: EventFilters) {
    return useQuery({
        queryKey: eventKeys.list(filters),
        queryFn: async (): Promise<Page<Event>> => {
            const { data } = await api.get<Page<Event>>('/events', {
                params: buildParams(filters),
            });
            return data;
        },
    });
}

export function useEvent(id: number | null) {
    return useQuery({
        queryKey: id != null ? eventKeys.detail(id) : ['events', 'detail', 'none'],
        queryFn: async (): Promise<Event> => {
            const { data } = await api.get<Event>(`/events/${id}`);
            return data;
        },
        enabled: id != null,
    });
}

export function useEventPipeline(id: number | null) {
    return useQuery({
        queryKey: id != null ? eventKeys.pipeline(id) : ['events', 'pipeline', 'none'],
        queryFn: async (): Promise<PipelineEntry[]> => {
            const { data } = await api.get<PipelineEntry[]>(`/events/${id}/pipeline`);
            return data;
        },
        enabled: id != null,
    });
}

export function useEventKpi(id: number | null) {
    return useQuery({
        queryKey: id != null ? eventKeys.kpi(id) : ['events', 'kpi', 'none'],
        queryFn: async (): Promise<EventKpi> => {
            const { data } = await api.get<EventKpi>(`/events/${id}/kpi`);
            return data;
        },
        enabled: id != null,
    });
}

export function useCreateEvent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: EventCreate): Promise<Event> => {
            const { data } = await api.post<Event>('/events', payload);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: eventKeys.all });
        },
    });
}

export function useUpdateEvent(id: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: EventUpdate): Promise<Event> => {
            const { data } = await api.patch<Event>(`/events/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: eventKeys.all });
            qc.invalidateQueries({ queryKey: eventKeys.detail(id) });
        },
    });
}

export function useDeleteEvent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number): Promise<void> => {
            await api.delete(`/events/${id}`);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: eventKeys.all });
        },
    });
}
