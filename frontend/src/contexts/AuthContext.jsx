import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const normalizeRole = (role) => {
        if (!role) return role;
        const r = String(role).toUpperCase();
        const mapping = {
            'ADMIN': 'ADMIN',
            'HR': 'HR',
            'RH': 'HR',
            'COORDINATOR': 'COORDINATOR',
            'COORDONATEUR': 'COORDINATOR',
            'COORDINATEUR': 'COORDINATOR',
            'EMPLOYEE': 'EMPLOYEE',
            'EMPLOYE': 'EMPLOYEE',
            'EMPLOYÉ': 'EMPLOYEE'
        };
        return mapping[r] || r;
    };
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);

    // Configuration d'axios pour inclure le token dans toutes les requêtes
    useEffect(() => {
        // Base URL du backend (évite d'écrire l'URL complète partout)
        axios.defaults.baseURL = 'http://localhost:5000';

        const tokenFromStorage = localStorage.getItem('token');
        if (tokenFromStorage) {
            setToken(tokenFromStorage);
            axios.defaults.headers.common['Authorization'] = `Bearer ${tokenFromStorage}`;

            // Charger l'utilisateur depuis le stockage local
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    parsed.role = normalizeRole(parsed.role);
                    setUser(parsed);
                } catch (error) {
                    console.error('Erreur de parsing des données utilisateur:', error);
                    logout();
                }
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password
            });

            if (response.data.success) {
                const { token, user } = response.data.data;
                const normalizedUser = { ...user, role: normalizeRole(user.role) };

                // Stocker les données
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(normalizedUser));

                // Mettre à jour l'état
                setToken(token);
                setUser(normalizedUser);

                // Configurer axios
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                return { success: true, user: normalizedUser };
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Erreur de connexion'
            };
        }
    };

    const logout = () => {
        // Nettoyer le localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Nettoyer l'état
        setToken(null);
        setUser(null);

        // Nettoyer axios
        delete axios.defaults.headers.common['Authorization'];
    };

    const updateUser = (userData) => {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const isAuthenticated = !!token && !!user;

    const hasRole = (role) => {
        return user?.role === role;
    };

    const hasAnyRole = (roles) => {
        return roles.includes(user?.role);
    };

    // Fonction pour vérifier périodiquement la validité du token
    const verifyToken = async () => {
        try {
            const response = await axios.get('/api/auth/verify');
            if (response.data.success) {
                return true;
            }
        } catch (error) {
            // Ne pas déconnecter automatiquement si le backend est indisponible
            // Conserver la session locale pour permettre l'accès aux pages
            console.warn('Impossible de vérifier le token pour le moment:', error?.message || error);
            return true;
        }
        return false;
    };

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated,
        hasRole,
        hasAnyRole,
        verifyToken
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
