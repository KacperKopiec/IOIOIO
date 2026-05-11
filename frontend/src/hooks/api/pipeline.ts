import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { eventKeys } from './events';
import type {
    PipelineEntry,
    PipelineEntryCreate,
    PipelineMoveRequest,
} from '../../types/api';

export interface PipelineEntryFilters {
    event_id?: number;
    stage_id?: number;
    company_id?: number;
    owner_user_id?: number;
}

export const pipelineEntryKeys = {
    all: ['pipeline-entries'] as const,
    list: (filters: PipelineEntryFilters) =>
        ['pipeline-entries', 'list', filters] as const,
    detail: (id: number) => ['pipeline-entries', 'detail', id] as const,
};

export function usePipelineEntries(filters: PipelineEntryFilters) {
    return useQuery({
        queryKey: pipelineEntryKeys.list(filters),
        queryFn: async (): Promise<PipelineEntry[]> => {
            const { data } = await api.get<PipelineEntry[]>('/pipeline-entries', {
                params: filters,
            });
            return data;
        },
    });
}

export function useCreatePipelineEntry() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: PipelineEntryCreate): Promise<PipelineEntry> => {
            const { data } = await api.post<PipelineEntry>(
                '/pipeline-entries',
                payload,
            );
            return data;
        },
        onSuccess: (entry) => {
            qc.invalidateQueries({ queryKey: pipelineEntryKeys.all });
            qc.invalidateQueries({ queryKey: eventKeys.pipeline(entry.event_id) });
            qc.invalidateQueries({ queryKey: eventKeys.kpi(entry.event_id) });
        },
    });
}

export function useMovePipelineEntry() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (vars: {
            id: number;
            payload: PipelineMoveRequest;
        }): Promise<PipelineEntry> => {
            const { data } = await api.post<PipelineEntry>(
                `/pipeline-entries/${vars.id}/move`,
                vars.payload,
            );
            return data;
        },
        onSuccess: (entry) => {
            qc.invalidateQueries({ queryKey: pipelineEntryKeys.all });
            qc.invalidateQueries({ queryKey: eventKeys.pipeline(entry.event_id) });
            qc.invalidateQueries({ queryKey: eventKeys.kpi(entry.event_id) });
        },
    });
}

export function useDeletePipelineEntry(eventIdHint?: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number): Promise<void> => {
            await api.delete(`/pipeline-entries/${id}`);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: pipelineEntryKeys.all });
            if (eventIdHint != null) {
                qc.invalidateQueries({ queryKey: eventKeys.pipeline(eventIdHint) });
                qc.invalidateQueries({ queryKey: eventKeys.kpi(eventIdHint) });
            }
        },
    });
}
