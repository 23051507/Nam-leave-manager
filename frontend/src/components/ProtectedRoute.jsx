import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

    // Afficher un loader pendant la vérification
    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
            >
                <CircularProgress size={60} />
            </Box>
        );
    }

    // Rediriger vers la page de connexion si non authentifié
    if (!isAuthenticated) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // Vérifier les rôles requis si spécifiés
    console.log("Rôle utilisateur:", user?.role, "Rôles requis:", requiredRoles);
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        // Rediriger vers le dashboard approprié selon le rôle de l'utilisateur
        const roleDashboard = {
            'ADMIN': '/admin/dashboard',
            'HR': '/hr/dashboard',
            'COORDINATOR': '/coordinator/dashboard',
            'EMPLOYEE': '/employee/dashboard'
        };

        return <Navigate to={roleDashboard[user.role] || '/dashboard'} replace />;
    }

    return children;
};

export default ProtectedRoute;




