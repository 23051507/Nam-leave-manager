const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware pour vérifier le token JWT
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // Bearer token

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token d\'accès requis'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretNAMS');

        // Vérifier que l'utilisateur existe toujours et est actif
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
            manager_id: user.manager_id
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token invalide'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expiré'
            });
        }

        console.error('Erreur de vérification du token:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

// Middleware pour vérifier les rôles
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentification requise'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé - Permissions insuffisantes'
            });
        }

        next();
    };
};

// Middleware pour vérifier si l'utilisateur peut accéder à ses propres données ou celles de ses subordonnés
const checkAccess = async (req, res, next) => {
    try {
        const { id } = req.params; // ID de l'utilisateur ciblé
        const currentUser = req.user;

        // Admin et RH peuvent accéder à tout
        if (['ADMIN', 'HR'].includes(currentUser.role)) {
            return next();
        }

        // L'utilisateur peut accéder à ses propres données
        if (parseInt(id) === currentUser.id) {
            return next();
        }

        // Les coordinateurs peuvent accéder aux données de leurs subordonnés
        if (currentUser.role === 'COORDINATOR') {
            const subordinates = await User.getSubordinates(currentUser.id);
            const hasAccess = subordinates.some(sub => sub.id === parseInt(id));

            if (hasAccess) {
                return next();
            }
        }

        return res.status(403).json({
            success: false,
            message: 'Accès refusé - Vous ne pouvez pas accéder à ces données'
        });
    } catch (error) {
        console.error('Erreur de vérification d\'accès:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

// Middleware pour vérifier si l'utilisateur peut approuver une demande
const checkApprovalAccess = async (req, res, next) => {
    try {
        const { id } = req.params; // ID de la demande de congé
        const currentUser = req.user;

        // Admin et RH peuvent approuver toutes les demandes
        if (['ADMIN', 'HR'].includes(currentUser.role)) {
            return next();
        }

        // Les coordinateurs peuvent approuver les demandes de leurs subordonnés
        if (currentUser.role === 'COORDINATOR') {
            const LeaveRequest = require('../models/LeaveRequest');
            const request = await LeaveRequest.findById(id);

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: 'Demande de congé non trouvée'
                });
            }

            const subordinates = await User.getSubordinates(currentUser.id);
            const canApprove = subordinates.some(sub => sub.id === request.user_id);

            if (canApprove) {
                return next();
            }
        }

        return res.status(403).json({
            success: false,
            message: 'Accès refusé - Vous ne pouvez pas approuver cette demande'
        });
    } catch (error) {
        console.error('Erreur de vérification d\'approbation:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
};

module.exports = {
    verifyToken,
    checkRole,
    checkAccess,
    checkApprovalAccess
};




