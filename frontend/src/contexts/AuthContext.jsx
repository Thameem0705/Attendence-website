import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { WelcomeScreen } from '../components/WelcomeScreen';

const AuthContext = createContext();

// Hardcoded admin credentials
const ADMIN_USERNAME = 'Sullthanitp';
const ADMIN_PASSWORD = 'Allow)itp';

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    // On mount, restore session from localStorage
    useEffect(() => {
        try {
            const savedUser = localStorage.getItem('auth_user');
            const savedRole = localStorage.getItem('auth_role');
            if (savedUser && savedRole) {
                setUser(JSON.parse(savedUser));
                setRole(savedRole);
            }
        } catch (e) {
            console.error('Error restoring session:', e);
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_role');
        } finally {
            // Small delay to show the splash screen animation
            setTimeout(() => setLoading(false), 2200);
        }
    }, []);

    const login = async (username, password) => {
        // 1. Check hardcoded admin credentials first
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            const adminUser = { username: ADMIN_USERNAME };
            setUser(adminUser);
            setRole('admin');
            localStorage.setItem('auth_user', JSON.stringify(adminUser));
            localStorage.setItem('auth_role', 'admin');
            return { user: adminUser, role: 'admin' };
        }

        // 2. Check Supabase profiles table for regular users
        try {
            const { data, error } = await supabaseAdmin
                .from('profiles')
                .select('id, username, name, role, assigned_password, email, address')
                .eq('username', username)
                .single();

            if (error || !data) {
                throw new Error('Invalid username or password');
            }

            // Check password against the stored assigned_password
            if (data.assigned_password !== password) {
                throw new Error('Invalid username or password');
            }

            const loggedInUser = {
                id: data.id,
                username: data.username,
                name: data.name,
                email: data.email,
                address: data.address,
            };
            const userRole = data.role || 'user';

            setUser(loggedInUser);
            setRole(userRole);
            localStorage.setItem('auth_user', JSON.stringify(loggedInUser));
            localStorage.setItem('auth_role', userRole);
            return { user: loggedInUser, role: userRole };
        } catch (err) {
            throw new Error(err.message || 'Invalid username or password');
        }
    };

    const logout = () => {
        setUser(null);
        setRole(null);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_role');
    };

    const value = {
        user,
        role,
        login,
        logout,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? <WelcomeScreen /> : children}
        </AuthContext.Provider>
    );
};
