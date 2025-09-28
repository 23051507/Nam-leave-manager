const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware pour la connexion
const validateLogin = [
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('password').isLength({ min: 4 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
];

// Route de connexion
router.post('/login', validateLogin, async (req, res) => {
    try {
        // Vérifier les erreurs de validation
        const errors = validationResult(req);
        console.log(errors);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Trouver l'utilisateur
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Vérifier le mot de passe
        const isValidPassword = await User.validatePassword(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Créer le token JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || 'secretNAMS',
            { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
        );

        // Retourner les informations de l'utilisateur (sans le mot de passe)
        res.json({
            success: true,
            message: 'Connexion réussie',
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    service: user.service,
                    position: user.position,
                    manager_id: user.manager_id
                }
            }
        });

    } catch (error) {
        console.error('Erreur de connexion:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// Validation middleware pour le changement de mot de passe
const validateChangePassword = [
    body('currentPassword').isLength({ min: 6 }).withMessage('Mot de passe actuel requis'),
    body('newPassword').isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
];

// Route pour changer le mot de passe
router.post('/change-password', verifyToken, validateChangePassword, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Récupérer l'utilisateur
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Vérifier le mot de passe actuel
        const isValidPassword = await User.validatePassword(currentPassword, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Mot de passe actuel incorrect'
            });
        }

        // Mettre à jour le mot de passe
        const bcrypt = require('bcryptjs');
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Mise à jour dans la base de données
        const pool = require('../config/database');
        await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newPasswordHash, userId]
        );

        res.json({
            success: true,
            message: 'Mot de passe modifié avec succès'
        });

    } catch (error) {
        console.error('Erreur de changement de mot de passe:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// Route pour obtenir le profil de l'utilisateur connecté
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Récupérer les informations du manager si applicable
        let manager = null;
        if (user.manager_id) {
            manager = await User.findById(user.manager_id);
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    service: user.service,
                    position: user.position,
                    annual_leave_alloc: user.annual_leave_alloc,
                    hire_date: user.hire_date,
                    manager: manager ? {
                        id: manager.id,
                        first_name: manager.first_name,
                        last_name: manager.last_name,
                        email: manager.email
                    } : null
                }
            }
        });

    } catch (error) {
        console.error('Erreur de récupération du profil:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// Route pour vérifier le token (utile pour le frontend)
router.get('/verify', verifyToken, (req, res) => {
    res.json({
        success: true,
        message: 'Token valide',
        data: {
            user: req.user
        }
    });
});

module.exports = router;




