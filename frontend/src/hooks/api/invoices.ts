import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Invoice, InvoiceCreate, InvoiceUpdate, PaymentStatus } from '../../types/api';

export interface InvoiceFilters {
    company_id?: number | null;
    event_id?: number | null;
    payment_status?: PaymentStatus | null;
}

export const invoiceKeys = {
    all: ['invoices'] as const,
    list: (filters: InvoiceFilters) => ['invoices', 'list', filters] as const,
    detail: (id: number) => ['invoices', 'detail', id] as const,
};

function buildParams(filters: InvoiceFilters) {
    const params: Record<string, unknown> = {};
    if (filters.company_id != null) params.company_id = filters.company_id;
    if (filters.event_id != null) params.event_id = filters.event_id;
    if (filters.payment_status) params.payment_status = filters.payment_status;
    return params;
}

export function useInvoices(filters: InvoiceFilters) {
    return useQuery({
        queryKey: invoiceKeys.list(filters),
        queryFn: async (): Promise<Invoice[]> => {
            const { data } = await api.get<Invoice[]>('/invoices', {
                params: buildParams(filters),
            });
            return data;
        },
    });
}

export function useCreateInvoice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: InvoiceCreate): Promise<Invoice> => {
            const { data } = await api.post<Invoice>('/invoices', payload);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: invoiceKeys.all });
        },
    });
}

export function useUpdateInvoice(id: number) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: InvoiceUpdate): Promise<Invoice> => {
            const { data } = await api.patch<Invoice>(`/invoices/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: invoiceKeys.all });
            qc.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
        },
    });
}

export function useDeleteInvoice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number): Promise<void> => {
            await api.delete(`/invoices/${id}`);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: invoiceKeys.all });
        },
    });
}
