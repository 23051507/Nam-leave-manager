const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { verifyToken, checkRole, checkAccess } = require('../middleware/auth');

const router = express.Router();

// Validation middleware pour la création d'utilisateur
const validateUser = [
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
    body('first_name').notEmpty().withMessage('Le prénom est requis'),
    body('last_name').notEmpty().withMessage('Le nom est requis'),
    body('role').isIn(['EMPLOYEE', 'COORDINATOR', 'HR', 'ADMIN']).withMessage('Rôle invalide'),
    body('service').optional().notEmpty().withMessage('Le service ne peut pas être vide'),
    body('position').optional().notEmpty().withMessage('Le poste ne peut pas être vide'),
    body('annual_leave_alloc').optional().isInt({ min: 0, max: 50 }).withMessage('Allocation de congés invalide')
];

// GET /api/users - Lister tous les utilisateurs (Admin/RH)
router.get('/', verifyToken, checkRole(['ADMIN', 'HR']), async (req, res) => {
    try {
        const filters = {};

        // Appliquer les filtres si fournis
        if (req.query.role) filters.role = req.query.role;
        if (req.query.manager_id) filters.manager_id = parseInt(req.query.manager_id);
        if (req.query.service) filters.service = req.query.service;

        const users = await User.findAll(filters);

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Erreur de récupération des utilisateurs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// GET /api/users/:id - Récupérer un utilisateur spécifique
router.get('/:id', verifyToken, checkAccess, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Récupérer les subordonnés si c'est un coordinateur
        let subordinates = [];
        if (user.role === 'COORDINATOR') {
            subordinates = await User.getSubordinates(userId);
        }

        res.json({
            success: true,
            data: {
                user,
                subordinates
            }
        });
    } catch (error) {
        console.error('Erreur de récupération de l\'utilisateur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// POST /api/users - Créer un nouvel utilisateur (Admin/RH)
router.post('/', verifyToken, checkRole(['ADMIN', 'HR']), validateUser, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: errors.array()
            });
        }

        const userData = req.body;

        // Vérifier que l'email n'existe pas déjà
        const existingUser = await User.findByEmail(userData.email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Un utilisateur avec cet email existe déjà'
            });
        }

        // Vérifier que le manager existe si spécifié
        if (userData.manager_id) {
            const manager = await User.findById(userData.manager_id);
            if (!manager) {
                return res.status(400).json({
                    success: false,
                    message: 'Manager non trouvé'
                });
            }
        }

        const newUser = await User.create(userData);

        res.status(201).json({
            success: true,
            message: 'Utilisateur créé avec succès',
            data: newUser
        });
    } catch (error) {
        console.error('Erreur de création d\'utilisateur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// PUT /api/users/:id - Mettre à jour un utilisateur
router.put('/:id', verifyToken, checkRole(['ADMIN', 'HR']), async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const updateData = req.body;

        // Vérifier que l'utilisateur existe
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Vérifier que le manager existe si spécifié
        if (updateData.manager_id) {
            const manager = await User.findById(updateData.manager_id);
            if (!manager) {
                return res.status(400).json({
                    success: false,
                    message: 'Manager non trouvé'
                });
            }
        }

        const updatedUser = await User.update(userId, updateData);

        res.json({
            success: true,
            message: 'Utilisateur mis à jour avec succès',
            data: updatedUser
        });
    } catch (error) {
        console.error('Erreur de mise à jour d\'utilisateur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// DELETE /api/users/:id - Supprimer un utilisateur (Admin seulement)
router.delete('/:id', verifyToken, checkRole(['ADMIN']), async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Empêcher la suppression de soi-même
        if (userId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Vous ne pouvez pas supprimer votre propre compte'
            });
        }

        // Vérifier que l'utilisateur existe
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Vérifier qu'il n'y a pas de subordonnés
        const subordinates = await User.getSubordinates(userId);
        if (subordinates.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Impossible de supprimer un utilisateur qui a des subordonnés'
            });
        }

        await User.delete(userId);

        res.json({
            success: true,
            message: 'Utilisateur supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur de suppression d\'utilisateur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// GET /api/users/:id/subordinates - Récupérer les subordonnés d'un utilisateur
router.get('/:id/subordinates', verifyToken, checkAccess, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const subordinates = await User.getSubordinates(userId);

        res.json({
            success: true,
            data: subordinates
        });
    } catch (error) {
        console.error('Erreur de récupération des subordonnés:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// GET /api/users/coordinators - Récupérer tous les coordinateurs (pour les sélecteurs)
router.get('/coordinators', verifyToken, checkRole(['ADMIN', 'HR']), async (req, res) => {
    try {
        const coordinators = await User.findAll({ role: 'COORDINATOR' });

        res.json({
            success: true,
            data: coordinators
        });
    } catch (error) {
        console.error('Erreur de récupération des coordinateurs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

module.exports = router;





