import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

    // DEBUG: Afficher les informations dans la console
    console.log('=== PROTECTED ROUTE DEBUG ===');
    console.log('Location:', location.pathname);
    console.log('Loading:', loading);
    console.log('IsAuthenticated:', isAuthenticated);
    console.log('User:', user);
    console.log('Required Roles:', requiredRoles);
    console.log('User Role:', user?.role);
    console.log('Role Check:', requiredRoles.length > 0 ? requiredRoles.includes(user?.role) : 'No role required');
    console.log('==============================');

    // Afficher un loader pendant la vérification
    if (loading) {
        console.log('🔄 Showing loading spinner');
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
            >
                <CircularProgress size={60} />
                <div style={{ marginLeft: '20px', fontFamily: 'Arial' }}>
                    Vérification de l'authentification...
                </div>
            </Box>
        );
    }

    // Rediriger vers la page de connexion si non authentifié
    if (!isAuthenticated) {
        console.log('❌ Not authenticated, redirecting to login');
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // Vérifier les rôles requis si spécifiés
    if (requiredRoles.length > 0 && !requiredRoles.includes(user?.role)) {
        console.log('⚠️ Role not authorized. User role:', user?.role, 'Required:', requiredRoles);
        
        // Rediriger vers le dashboard approprié selon le rôle de l'utilisateur
        const roleDashboard = {
            'ADMIN': '/admin/dashboard',
            'HR': '/hr/dashboard',
            'COORDINATOR': '/coordinator/dashboard',
            'EMPLOYEE': '/employee/dashboard'
        };

        const redirectTo = roleDashboard[user?.role] || '/dashboard';
        console.log('🔀 Redirecting to:', redirectTo);
        
        return <Navigate to={redirectTo} replace />;
    }

    console.log('✅ Access granted, rendering children');
    return children;
};

export default ProtectedRoute;