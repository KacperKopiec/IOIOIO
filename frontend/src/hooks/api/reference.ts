import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type {
    Industry,
    PipelineStage,
    RelationshipType,
    Role,
    Tag,
    TagCategory,
    User,
} from '../../types/api';

export const referenceKeys = {
    industries: ['reference', 'industries'] as const,
    roles: ['reference', 'roles'] as const,
    tags: (category?: TagCategory) => ['reference', 'tags', category ?? 'all'] as const,
    pipelineStages: ['reference', 'pipeline-stages'] as const,
    relationshipTypes: ['reference', 'relationship-types'] as const,
    users: (role?: string) => ['reference', 'users', role ?? 'all'] as const,
};

export function useIndustries() {
    return useQuery({
        queryKey: referenceKeys.industries,
        queryFn: async (): Promise<Industry[]> => {
            const { data } = await api.get<Industry[]>('/industries');
            return data;
        },
        staleTime: 60 * 60_000,
    });
}

export function useRoles() {
    return useQuery({
        queryKey: referenceKeys.roles,
        queryFn: async (): Promise<Role[]> => {
            const { data } = await api.get<Role[]>('/roles');
            return data;
        },
        staleTime: 60 * 60_000,
    });
}

export function useTags(category?: TagCategory) {
    return useQuery({
        queryKey: referenceKeys.tags(category),
        queryFn: async (): Promise<Tag[]> => {
            const { data } = await api.get<Tag[]>('/tags', {
                params: category ? { category } : undefined,
            });
            return data;
        },
        staleTime: 60 * 60_000,
    });
}

export interface TagCreatePayload {
    name: string;
    category: TagCategory;
}

export function useCreateTag() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: TagCreatePayload): Promise<Tag> => {
            const { data } = await api.post<Tag>('/tags', payload);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['reference', 'tags'] });
        },
    });
}

export function usePipelineStages() {
    return useQuery({
        queryKey: referenceKeys.pipelineStages,
        queryFn: async (): Promise<PipelineStage[]> => {
            const { data } = await api.get<PipelineStage[]>('/pipeline-stages');
            return data;
        },
        staleTime: 60 * 60_000,
    });
}

export function useRelationshipTypes() {
    return useQuery({
        queryKey: referenceKeys.relationshipTypes,
        queryFn: async (): Promise<RelationshipType[]> => {
            const { data } = await api.get<RelationshipType[]>('/relationship-types');
            return data;
        },
        staleTime: 60 * 60_000,
    });
}

export function useUsers(role?: string) {
    return useQuery({
        queryKey: referenceKeys.users(role),
        queryFn: async (): Promise<User[]> => {
            const { data } = await api.get<User[]>('/users', {
                params: role ? { role } : undefined,
            });
            return data;
        },
        staleTime: 5 * 60_000,
    });
}
