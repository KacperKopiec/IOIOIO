import React, { useMemo, useState } from 'react';
import { useUsers } from '../hooks/api/reference';
import {
    AuthContext,
    ROLE_PROFILES,
    type AuthContextType,
    type UserRole,
} from './auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [role, setRole] = useState<UserRole>('koordynator');
    const usersQuery = useUsers(role);

    const value = useMemo<AuthContextType>(() => {
        const profile = ROLE_PROFILES[role];
        const user = usersQuery.data?.[0] ?? null;
        return {
            role,
            userId: user?.id ?? null,
            userName: user ? `${user.first_name} ${user.last_name}` : '',
            userRoleName: profile.label,
            setRole,
        };
    }, [role, usersQuery.data]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
