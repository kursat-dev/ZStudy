import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (name: string, email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            await api.init();
            const response = await api.getProfile();
            if (response.success) {
                setUser(response.data.user);
            }
        } catch {
            // Not authenticated or token expired
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const signIn = useCallback(async (email: string, password: string) => {
        const response = await api.login(email, password);
        if (response.success) {
            await api.setTokens(response.data.accessToken, response.data.refreshToken);
            setUser(response.data.user);
        } else {
            throw new Error(response.message);
        }
    }, []);

    const signUp = useCallback(async (name: string, email: string, password: string) => {
        const response = await api.register(name, email, password);
        if (response.success) {
            await api.setTokens(response.data.accessToken, response.data.refreshToken);
            setUser(response.data.user);
        } else {
            throw new Error(response.message);
        }
    }, []);

    const signOut = useCallback(async () => {
        await api.clearTokens();
        setUser(null);
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const response = await api.getProfile();
            if (response.success) {
                setUser(response.data.user);
            }
        } catch {
            // Silently fail
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                signIn,
                signUp,
                signOut,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
