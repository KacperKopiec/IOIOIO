import React, { createContext, useContext, useMemo, useState } from 'react';

export type UserRole = 'koordynator' | 'opiekun' | 'promocja';

interface RoleProfile {
    label: string;
    demoUserId: number;
    demoUserName: string;
}

const ROLE_PROFILES: Record<UserRole, RoleProfile> = {
    koordynator: {
        label: 'Koordynator wydarzenia',
        demoUserId: 2,
        demoUserName: 'Marek Kowalski',
    },
    opiekun: {
        label: 'Opiekun partnerów',
        demoUserId: 3,
        demoUserName: 'Katarzyna Wiśniewska',
    },
    promocja: {
        label: 'Dział promocji',
        demoUserId: 4,
        demoUserName: 'Tomasz Lewandowski',
    },
};

export const ROLES: UserRole[] = ['koordynator', 'opiekun', 'promocja'];

interface AuthContextType {
    role: UserRole;
    userId: number;
    userName: string;
    userRoleName: string;
    setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [role, setRole] = useState<UserRole>('koordynator');

    const value = useMemo<AuthContextType>(() => {
        const profile = ROLE_PROFILES[role];
        return {
            role,
            userId: profile.demoUserId,
            userName: profile.demoUserName,
            userRoleName: profile.label,
            setRole,
        };
    }, [role]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export function roleLabel(role: UserRole): string {
    return ROLE_PROFILES[role].label;
}
