import { createContext, useContext } from 'react';

export type UserRole = 'koordynator' | 'opiekun' | 'promocja';

interface RoleProfile {
    label: string;
}

export const ROLE_PROFILES: Record<UserRole, RoleProfile> = {
    koordynator: { label: 'Koordynator wydarzenia' },
    opiekun: { label: 'Opiekun partnerów' },
    promocja: { label: 'Dział promocji' },
};

export const ROLES: UserRole[] = ['koordynator', 'opiekun', 'promocja'];

export interface AuthContextType {
    role: UserRole;
    userId: number | null;
    userName: string;
    userRoleName: string;
    setRole: (role: UserRole) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export function roleLabel(role: UserRole): string {
    return ROLE_PROFILES[role].label;
}
