import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Contact, ContactCreate } from '../../types/api';
import { companyKeys } from './companies';

export const contactKeys = {
    all: ['contacts'] as const,
    list: (companyId?: number) => ['contacts', 'list', companyId ?? 'all'] as const,
    detail: (id: number) => ['contacts', 'detail', id] as const,
};

export function useContacts(companyId?: number) {
    return useQuery({
        queryKey: contactKeys.list(companyId),
        queryFn: async (): Promise<Contact[]> => {
            const { data } = await api.get<Contact[]>('/contacts', {
                params: companyId != null ? { company_id: companyId } : undefined,
            });
            return data;
        },
    });
}

export function useCreateContact() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: ContactCreate): Promise<Contact> => {
            const { data } = await api.post<Contact>('/contacts', payload);
            return data;
        },
        onSuccess: (contact) => {
            qc.invalidateQueries({ queryKey: contactKeys.all });
            qc.invalidateQueries({ queryKey: companyKeys.contacts(contact.company_id) });
        },
    });
}

export function useDeleteContact() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number): Promise<void> => {
            await api.delete(`/contacts/${id}`);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: contactKeys.all });
            qc.invalidateQueries({ queryKey: companyKeys.all });
        },
    });
}
