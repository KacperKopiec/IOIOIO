import React, { createContext, useContext, useState } from 'react';

export type UserRole = 'koordynator' | 'opiekun' | 'promocja' | 'zarzad';

interface AuthContextType {
    role: UserRole;
    setRole: (role: UserRole) => void;
    userName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [role, setRole] = useState<UserRole>('opiekun');
    const userName = 'Anna Nowak';

    return (
        <AuthContext.Provider value={{ role, setRole, userName }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};