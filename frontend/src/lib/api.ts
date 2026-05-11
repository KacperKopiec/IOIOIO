import axios, { AxiosError } from 'axios';

export const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30_000,
});

export interface ApiError {
    status: number;
    detail: string;
}

export function toApiError(error: unknown): ApiError {
    if (error instanceof AxiosError) {
        const status = error.response?.status ?? 0;
        const data = error.response?.data as { detail?: string } | undefined;
        const detail =
            (typeof data?.detail === 'string' && data.detail) ||
            error.message ||
            'Wystąpił nieznany błąd';
        return { status, detail };
    }
    return { status: 0, detail: 'Wystąpił nieznany błąd' };
}
