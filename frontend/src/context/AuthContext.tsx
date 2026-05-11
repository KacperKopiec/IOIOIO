import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'koordynator' | 'opiekun' | 'promocja';

interface AuthContextType {
    role: UserRole;
    userName: string;
    userRoleName: string;
}

const roleNames: Record<UserRole, string> = {
    koordynator: 'Koordynator wydarzenia',
    opiekun: 'Opiekun partnerów',
    promocja: 'Dział promocji',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [role] = useState<UserRole>('koordynator');
    const userName = 'Marek Kowalski';
    return (
        <AuthContext.Provider value={{ role, userName, userRoleName: roleNames[role] }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
