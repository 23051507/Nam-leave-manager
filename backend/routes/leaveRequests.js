const express = require('express');
const { body, validationResult } = require('express-validator');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveApproval = require('../models/LeaveApproval');
const LeaveBalance = require('../models/LeaveBalance');
const User = require('../models/User');
const { verifyToken, checkRole, checkAccess, checkApprovalAccess } = require('../middleware/auth');

const router = express.Router();

// Validation middleware pour la création de demande
const validateLeaveRequest = [
    body('leave_type_id').isInt({ min: 1 }).withMessage('Type de congé invalide'),
    body('start_date').isISO8601().withMessage('Date de début invalide'),
    body('end_date').isISO8601().withMessage('Date de fin invalide'),
    body('justification').optional().isLength({ min: 10 }).withMessage('La justification doit contenir au moins 10 caractères')
];

// GET /api/leave-requests - Lister les demandes de congés
router.get('/', verifyToken, async (req, res) => {
    try {
        const filters = {};
        const currentUser = req.user;

        // Les employés ne peuvent voir que leurs propres demandes
        if (currentUser.role === 'EMPLOYEE') {
            filters.user_id = currentUser.id;
        }
        // Les coordinateurs peuvent voir les demandes de leurs subordonnés
        else if (currentUser.role === 'COORDINATOR') {
            const subordinates = await User.getSubordinates(currentUser.id);
            if (subordinates.length === 0) {
                filters.user_id = currentUser.id; // Pas de subordonnés, voir seulement ses propres demandes
            }
            // Sinon, voir toutes les demandes (filtrage côté frontend)
        }
        // Admin et RH voient tout

        // Appliquer les filtres additionnels
        if (req.query.user_id && ['ADMIN', 'HR'].includes(currentUser.role)) {
            filters.user_id = parseInt(req.query.user_id);
        }
        if (req.query.status) filters.status = req.query.status;
        if (req.query.leave_type_id) filters.leave_type_id = parseInt(req.query.leave_type_id);
        if (req.query.start_date && req.query.end_date) {
            filters.start_date = req.query.start_date;
            filters.end_date = req.query.end_date;
        }

        const requests = await LeaveRequest.findAll(filters);

        // Pour les coordinateurs, filtrer pour ne montrer que leurs subordonnés
        if (currentUser.role === 'COORDINATOR') {
            const subordinates = await User.getSubordinates(currentUser.id);
            const subordinateIds = subordinates.map(sub => sub.id);
            const filteredRequests = requests.filter(req =>
                req.user_id === currentUser.id || subordinateIds.includes(req.user_id)
            );

            res.json({
                success: true,
                data: filteredRequests
            });
        } else {
            res.json({
                success: true,
                data: requests
            });
        }
    } catch (error) {
        console.error('Erreur de récupération des demandes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// GET /api/leave-requests/:id - Récupérer une demande spécifique
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        const request = await LeaveRequest.findById(requestId);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Demande de congé non trouvée'
            });
        }

        // Vérifier l'accès
        const currentUser = req.user;
        if (currentUser.role === 'EMPLOYEE' && request.user_id !== currentUser.id) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé'
            });
        }

        if (currentUser.role === 'COORDINATOR') {
            const subordinates = await User.getSubordinates(currentUser.id);
            const canAccess = request.user_id === currentUser.id ||
                subordinates.some(sub => sub.id === request.user_id);

            if (!canAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé'
                });
            }
        }

        // Récupérer l'historique des approbations
        const approvals = await LeaveApproval.findByRequestId(requestId);

        res.json({
            success: true,
            data: {
                request,
                approvals
            }
        });
    } catch (error) {
        console.error('Erreur de récupération de la demande:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// POST /api/leave-requests - Créer une nouvelle demande
router.post('/', verifyToken, validateLeaveRequest, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: errors.array()
            });
        }

        const { leave_type_id, start_date, end_date, justification, attachment_path } = req.body;
        const userId = req.user.id;

        // Vérifier les dates
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (startDate >= endDate) {
            return res.status(400).json({
                success: false,
                message: 'La date de fin doit être postérieure à la date de début'
            });
        }

        // Vérifier que la date de début n'est pas dans le passé
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (startDate < today) {
            return res.status(400).json({
                success: false,
                message: 'La date de début ne peut pas être dans le passé'
            });
        }

        // Calculer le nombre de jours (excluant les weekends)
        const daysCount = calculateWorkingDays(startDate, endDate);

        // Vérifier les conflits de dates
        const hasConflict = await LeaveRequest.checkDateConflicts(userId, start_date, end_date);
        if (hasConflict) {
            return res.status(400).json({
                success: false,
                message: 'Vous avez déjà une demande ou un congé approuvé sur cette période'
            });
        }

        // Vérifier le solde disponible (pour les congés qui affectent le solde)
        const pool = require('../config/database');
        const leaveTypeQuery = 'SELECT * FROM leave_types WHERE id = $1';
        const leaveTypeResult = await pool.query(leaveTypeQuery, [leave_type_id]);
        const leaveType = leaveTypeResult.rows[0];

        if (leaveType.affects_annual_balance) {
            const availableBalance = await LeaveBalance.getAvailableBalance(userId, leave_type_id);
            if (availableBalance < daysCount) {
                return res.status(400).json({
                    success: false,
                    message: `Solde insuffisant. Disponible: ${availableBalance} jours, Demandé: ${daysCount} jours`
                });
            }
        }

        // Créer la demande
        const requestData = {
            user_id: userId,
            leave_type_id,
            start_date,
            end_date,
            days_count: daysCount,
            justification,
            attachment_path
        };

        const newRequest = await LeaveRequest.create(requestData);

        // Créer l'approbation pour le manager
        const user = await User.findById(userId);
        if (user.manager_id) {
            await LeaveApproval.create({
                request_id: newRequest.id,
                approver_id: user.manager_id,
                role: 'COORDINATOR',
                decision: 'PENDING'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Demande de congé créée avec succès',
            data: newRequest
        });
    } catch (error) {
        console.error('Erreur de création de demande:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// PUT /api/leave-requests/:id - Mettre à jour une demande (seulement si PENDING)
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        const request = await LeaveRequest.findById(requestId);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Demande de congé non trouvée'
            });
        }

        // Vérifier que l'utilisateur peut modifier cette demande
        if (request.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Vous ne pouvez modifier que vos propres demandes'
            });
        }

        // Vérifier que la demande peut être modifiée
        if (request.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: 'Seules les demandes en attente peuvent être modifiées'
            });
        }

        const { start_date, end_date, justification } = req.body;

        // Vérifier les dates si fournies
        if (start_date && end_date) {
            const startDate = new Date(start_date);
            const endDate = new Date(end_date);

            if (startDate >= endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'La date de fin doit être postérieure à la date de début'
                });
            }

            // Vérifier les conflits avec d'autres demandes
            const hasConflict = await LeaveRequest.checkDateConflicts(
                request.user_id,
                start_date,
                end_date,
                requestId
            );

            if (hasConflict) {
                return res.status(400).json({
                    success: false,
                    message: 'Vous avez déjà une demande ou un congé approuvé sur cette période'
                });
            }
        }

        // Mettre à jour la demande
        const pool = require('../config/database');
        const updateFields = [];
        const values = [];
        let paramCount = 0;

        if (start_date) {
            paramCount++;
            updateFields.push(`start_date = $${paramCount}`);
            values.push(start_date);
        }

        if (end_date) {
            paramCount++;
            updateFields.push(`end_date = $${paramCount}`);
            values.push(end_date);
        }

        if (justification) {
            paramCount++;
            updateFields.push(`justification = $${paramCount}`);
            values.push(justification);
        }

        if (start_date && end_date) {
            const daysCount = calculateWorkingDays(new Date(start_date), new Date(end_date));
            paramCount++;
            updateFields.push(`days_count = $${paramCount}`);
            values.push(daysCount);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Aucune donnée à mettre à jour'
            });
        }

        paramCount++;
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(requestId);

        const query = `
      UPDATE leave_requests 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

        const result = await pool.query(query, values);
        const updatedRequest = result.rows[0];

        res.json({
            success: true,
            message: 'Demande mise à jour avec succès',
            data: updatedRequest
        });
    } catch (error) {
        console.error('Erreur de mise à jour de demande:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// DELETE /api/leave-requests/:id - Annuler une demande
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        const request = await LeaveRequest.findById(requestId);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Demande de congé non trouvée'
            });
        }

        // Vérifier que l'utilisateur peut annuler cette demande
        if (request.user_id !== req.user.id && !['ADMIN', 'HR'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Vous ne pouvez annuler que vos propres demandes'
            });
        }

        // Vérifier que la demande peut être annulée
        if (request.status === 'APPROVED') {
            return res.status(400).json({
                success: false,
                message: 'Les demandes approuvées ne peuvent pas être annulées'
            });
        }

        // Mettre à jour le statut
        await LeaveRequest.updateStatus(requestId, 'CANCELLED');

        res.json({
            success: true,
            message: 'Demande annulée avec succès'
        });
    } catch (error) {
        console.error('Erreur d\'annulation de demande:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// Fonction utilitaire pour calculer les jours ouvrables
function calculateWorkingDays(startDate, endDate) {
    let count = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        // Exclure samedi (6) et dimanche (0)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
}

module.exports = router;





