import React, { useMemo, useState } from 'react';
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
