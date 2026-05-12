import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type {
    CoordinatorDashboard,
    PromotionDashboard,
    RelationshipManagerDashboard,
} from '../../types/api';

export const dashboardKeys = {
    coordinator: (eventId: number) => ['dashboard', 'coordinator', eventId] as const,
    promotion: ['dashboard', 'promotion'] as const,
    relationshipManager: (userId: number) =>
        ['dashboard', 'relationship-manager', userId] as const,
};

export function useCoordinatorDashboard(eventId: number | null) {
    return useQuery({
        queryKey:
            eventId != null
                ? dashboardKeys.coordinator(eventId)
                : ['dashboard', 'coordinator', 'none'],
        queryFn: async (): Promise<CoordinatorDashboard> => {
            const { data } = await api.get<CoordinatorDashboard>('/dashboard/coordinator', {
                params: { event_id: eventId },
            });
            return data;
        },
        enabled: eventId != null,
    });
}

export function usePromotionDashboard() {
    return useQuery({
        queryKey: dashboardKeys.promotion,
        queryFn: async (): Promise<PromotionDashboard> => {
            const { data } = await api.get<PromotionDashboard>('/dashboard/promotion');
            return data;
        },
    });
}

export function useRelationshipManagerDashboard(userId: number | null) {
    return useQuery({
        queryKey:
            userId != null
                ? dashboardKeys.relationshipManager(userId)
                : ['dashboard', 'relationship-manager', 'none'],
        queryFn: async (): Promise<RelationshipManagerDashboard> => {
            const { data } = await api.get<RelationshipManagerDashboard>(
                '/dashboard/relationship-manager',
                { params: { user_id: userId } },
            );
            return data;
        },
        enabled: userId != null,
    });
}
