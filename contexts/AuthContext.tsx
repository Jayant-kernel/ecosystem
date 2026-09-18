
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    loginAsGuest: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Helper to map standard Firebase user format to our app's standard User format
const mapUser = (fbUser: FirebaseUser | null): User | null => {
    if (!fbUser) return null;
    // For anonymous users, email and displayName might be null.
    const name = fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Guest');
    return {
        id: fbUser.uid,
        email: fbUser.email || `guest_${fbUser.uid.slice(0,5)}@ecosystem.ai`, // fake email for internal consistency if needed
        name: name
    };
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Standard Firebase listener for auth state changes.
        // This handles initial load, login, logout, etc. automatically.
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(mapUser(firebaseUser));
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        await authService.login(email, password);
    };

    const signup = async (name: string, email: string, password: string) => {
        await authService.signup(name, email, password);
    };

    const loginWithGoogle = async () => {
        await authService.loginWithGoogle();
    }

    const loginAsGuest = async () => {
        await authService.loginAsGuest();
    }

    const logout = async () => {
        await authService.logout();
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, loginWithGoogle, loginAsGuest, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
