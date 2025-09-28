const express = require('express');
const { body, validationResult } = require('express-validator');
const LeaveBalance = require('../models/LeaveBalance');
const User = require('../models/User');
const { verifyToken, checkRole, checkAccess } = require('../middleware/auth');

const router = express.Router();

// GET /api/leave-balances/:userId - Récupérer les soldes d'un utilisateur
router.get('/:userId', verifyToken, checkAccess, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

        // Vérifier que l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Initialiser les soldes pour l'année si nécessaire
        await LeaveBalance.initializeYearlyBalances(userId, year);

        const balances = await LeaveBalance.findByUserId(userId, year);

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    service: user.service
                },
                year,
                balances
            }
        });
    } catch (error) {
        console.error('Erreur de récupération des soldes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// GET /api/leave-balances - Récupérer tous les soldes (Admin/RH)
router.get('/', verifyToken, checkRole(['ADMIN', 'HR']), async (req, res) => {
    try {
        const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
        const service = req.query.service;

        let balances = await LeaveBalance.getAllBalancesForYear(year);

        // Filtrer par service si spécifié
        if (service) {
            balances = balances.filter(balance => balance.service === service);
        }

        // Grouper par utilisateur
        const groupedBalances = {};
        balances.forEach(balance => {
            const userId = balance.user_id;
            if (!groupedBalances[userId]) {
                groupedBalances[userId] = {
                    user: {
                        id: balance.user_id,
                        first_name: balance.first_name,
                        last_name: balance.last_name,
                        service: balance.service
                    },
                    balances: []
                };
            }
            groupedBalances[userId].balances.push({
                leave_type_id: balance.leave_type_id,
                leave_type_name: balance.leave_type_name,
                leave_type_code: balance.leave_type_code,
                total_allocated: balance.total_allocated,
                consumed: balance.consumed,
                remaining: balance.remaining
            });
        });

        res.json({
            success: true,
            data: {
                year,
                users: Object.values(groupedBalances)
            }
        });
    } catch (error) {
        console.error('Erreur de récupération des soldes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// PUT /api/leave-balances/:userId/:leaveTypeId - Ajuster manuellement un solde (Admin/RH)
router.put('/:userId/:leaveTypeId', verifyToken, checkRole(['ADMIN', 'HR']), async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const leaveTypeId = parseInt(req.params.leaveTypeId);
        const { operation, days, reason } = req.body; // operation: 'add' ou 'subtract'

        if (!['add', 'subtract'].includes(operation)) {
            return res.status(400).json({
                success: false,
                message: 'Opération invalide. Utilisez "add" ou "subtract"'
            });
        }

        if (!days || days <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Le nombre de jours doit être positif'
            });
        }

        if (!reason || reason.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Une raison détaillée est requise (minimum 10 caractères)'
            });
        }

        const year = new Date().getFullYear();

        // Vérifier que l'utilisateur existe
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Initialiser les soldes pour l'année si nécessaire
        await LeaveBalance.initializeYearlyBalances(userId, year);

        let result;
        if (operation === 'add') {
            result = await LeaveBalance.addToBalance(userId, leaveTypeId, year, days);
        } else {
            result = await LeaveBalance.updateConsumed(userId, leaveTypeId, year, days);
        }

        // Log de l'action pour audit
        const pool = require('../config/database');
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                req.user.id,
                `ADJUST_LEAVE_BALANCE_${operation.toUpperCase()}`,
                'leave_balances',
                result.id,
                JSON.stringify({
                    operation,
                    days,
                    reason,
                    leave_type_id: leaveTypeId,
                    user_id: userId
                }),
                req.ip
            ]
        );

        res.json({
            success: true,
            message: `Solde ${operation === 'add' ? 'ajouté' : 'déduit'} avec succès`,
            data: result
        });
    } catch (error) {
        console.error('Erreur d\'ajustement de solde:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// POST /api/leave-balances/initialize-year - Initialiser les soldes pour une nouvelle année (Admin/RH)
router.post('/initialize-year', verifyToken, checkRole(['ADMIN', 'HR']), async (req, res) => {
    try {
        const { year } = req.body;

        if (!year || year < new Date().getFullYear()) {
            return res.status(400).json({
                success: false,
                message: 'Année invalide'
            });
        }

        // Récupérer tous les utilisateurs actifs
        const users = await User.findAll();
        const pool = require('../config/database');

        let initializedCount = 0;
        let errors = [];

        for (const user of users) {
            try {
                await LeaveBalance.initializeYearlyBalances(user.id, year);
                initializedCount++;
            } catch (error) {
                errors.push({
                    user_id: user.id,
                    user_name: `${user.first_name} ${user.last_name}`,
                    error: error.message
                });
            }
        }

        // Log de l'action pour audit
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, table_name, new_values)
       VALUES ($1, $2, $3, $4)`,
            [
                req.user.id,
                'INITIALIZE_YEARLY_BALANCES',
                'leave_balances',
                JSON.stringify({
                    year,
                    initialized_count: initializedCount,
                    errors_count: errors.length
                })
            ]
        );

        res.json({
            success: true,
            message: `Initialisation des soldes pour l'année ${year} terminée`,
            data: {
                year,
                initialized_count: initializedCount,
                total_users: users.length,
                errors
            }
        });
    } catch (error) {
        console.error('Erreur d\'initialisation des soldes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// GET /api/leave-balances/reports/summary - Rapport de synthèse des soldes (Admin/RH)
router.get('/reports/summary', verifyToken, checkRole(['ADMIN', 'HR']), async (req, res) => {
    try {
        const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
        const service = req.query.service;

        const pool = require('../config/database');

        let query = `
      SELECT 
        u.service,
        lt.name as leave_type_name,
        COUNT(lb.user_id) as user_count,
        SUM(lb.total_allocated) as total_allocated,
        SUM(lb.consumed) as total_consumed,
        SUM(lb.remaining) as total_remaining
      FROM leave_balances lb
      JOIN users u ON lb.user_id = u.id
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      WHERE lb.year = $1 AND u.is_active = true
    `;

        const values = [year];

        if (service) {
            query += ` AND u.service = $2`;
            values.push(service);
        }

        query += `
      GROUP BY u.service, lt.name, lt.id
      ORDER BY u.service, lt.name
    `;

        const result = await pool.query(query, values);

        // Calculer les statistiques globales
        const totalUsers = await pool.query(
            `SELECT COUNT(*) as count FROM users WHERE is_active = true${service ? ' AND service = $1' : ''}`,
            service ? [service] : []
        );

        const totalAllocated = result.rows.reduce((sum, row) => sum + parseFloat(row.total_allocated || 0), 0);
        const totalConsumed = result.rows.reduce((sum, row) => sum + parseFloat(row.total_consumed || 0), 0);
        const totalRemaining = result.rows.reduce((sum, row) => sum + parseFloat(row.total_remaining || 0), 0);

        res.json({
            success: true,
            data: {
                year,
                service: service || 'Tous',
                summary: {
                    total_users: parseInt(totalUsers.rows[0].count),
                    total_allocated,
                    total_consumed,
                    total_remaining,
                    consumption_rate: totalAllocated > 0 ? (totalConsumed / totalAllocated * 100).toFixed(2) : 0
                },
                details: result.rows
            }
        });
    } catch (error) {
        console.error('Erreur de génération du rapport:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

module.exports = router;




