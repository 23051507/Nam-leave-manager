const express = require('express');
const { body, validationResult } = require('express-validator');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveApproval = require('../models/LeaveApproval');
const LeaveBalance = require('../models/LeaveBalance');
const User = require('../models/User');
const { verifyToken, checkRole, checkApprovalAccess } = require('../middleware/auth');

const router = express.Router();

// Validation middleware pour l'approbation
const validateApproval = [
    body('decision').isIn(['APPROVED', 'REJECTED', 'REQUEST_CHANGE']).withMessage('Décision invalide'),
    body('comment').optional().isLength({ max: 500 }).withMessage('Le commentaire ne peut pas dépasser 500 caractères')
];

// GET /api/leave-approvals/pending - Récupérer les demandes en attente d'approbation
router.get('/pending', verifyToken, async (req, res) => {
    try {
        const currentUser = req.user;
        let pendingRequests = [];

        if (currentUser.role === 'COORDINATOR') {
            pendingRequests = await LeaveRequest.getPendingForApproval(currentUser.id);
        } else if (['ADMIN', 'HR'].includes(currentUser.role)) {
            // Admin et RH peuvent voir toutes les demandes en attente
            const filters = { status: 'PENDING' };
            pendingRequests = await LeaveRequest.findAll(filters);
        }

        res.json({
            success: true,
            data: pendingRequests
        });
    } catch (error) {
        console.error('Erreur de récupération des demandes en attente:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// POST /api/leave-approvals/:requestId/approve - Approuver une demande
router.post('/:requestId/approve', verifyToken, checkApprovalAccess, validateApproval, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: errors.array()
            });
        }

        const requestId = parseInt(req.params.requestId);
        const { comment } = req.body;
        const approverId = req.user.id;
        const approverRole = req.user.role;

        // Récupérer la demande
        const request = await LeaveRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Demande de congé non trouvée'
            });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: 'Cette demande ne peut plus être approuvée'
            });
        }

        // Vérifier si une approbation existe déjà pour cet approbateur
        const existingApprovals = await LeaveApproval.findByRequestId(requestId);
        const existingApproval = existingApprovals.find(approval => approval.approver_id === approverId);

        let approval;
        if (existingApproval) {
            // Mettre à jour l'approbation existante
            approval = await LeaveApproval.updateDecision(existingApproval.id, 'APPROVED', comment);
        } else {
            // Créer une nouvelle approbation
            approval = await LeaveApproval.create({
                request_id: requestId,
                approver_id: approverId,
                role: approverRole,
                decision: 'APPROVED',
                comment
            });
        }

        // Vérifier si la demande nécessite une approbation RH
        const pool = require('../config/database');
        const leaveTypeQuery = 'SELECT * FROM leave_types WHERE id = $1';
        const leaveTypeResult = await pool.query(leaveTypeQuery, [request.leave_type_id]);
        const leaveType = leaveTypeResult.rows[0];

        // Si le type de congé nécessite une approbation RH et que l'approbateur n'est pas HR/ADMIN
        if (leaveType.requires_hr_approval && !['HR', 'ADMIN'].includes(approverRole)) {
            // Créer une approbation pour HR
            await LeaveApproval.create({
                request_id: requestId,
                approver_id: null, // Sera assigné à un RH
                role: 'HR',
                decision: 'PENDING'
            });

            res.json({
                success: true,
                message: 'Demande approuvée par le manager, en attente de validation RH',
                data: { approval, nextStep: 'HR_APPROVAL_REQUIRED' }
            });
        } else {
            // Approuver définitivement la demande
            await LeaveRequest.updateStatus(requestId, 'APPROVED');

            // Débiter le solde si nécessaire
            if (leaveType.affects_annual_balance) {
                const currentYear = new Date().getFullYear();
                await LeaveBalance.deductFromBalance(
                    request.user_id,
                    request.leave_type_id,
                    currentYear,
                    request.days_count
                );
            }

            res.json({
                success: true,
                message: 'Demande approuvée avec succès',
                data: { approval, status: 'APPROVED' }
            });
        }
    } catch (error) {
        console.error('Erreur d\'approbation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// POST /api/leave-approvals/:requestId/reject - Rejeter une demande
router.post('/:requestId/reject', verifyToken, checkApprovalAccess, validateApproval, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: errors.array()
            });
        }

        const requestId = parseInt(req.params.requestId);
        const { comment } = req.body;
        const approverId = req.user.id;
        const approverRole = req.user.role;

        // Récupérer la demande
        const request = await LeaveRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Demande de congé non trouvée'
            });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: 'Cette demande ne peut plus être rejetée'
            });
        }

        // Créer ou mettre à jour l'approbation
        const existingApprovals = await LeaveApproval.findByRequestId(requestId);
        const existingApproval = existingApprovals.find(approval => approval.approver_id === approverId);

        let approval;
        if (existingApproval) {
            approval = await LeaveApproval.updateDecision(existingApproval.id, 'REJECTED', comment);
        } else {
            approval = await LeaveApproval.create({
                request_id: requestId,
                approver_id: approverId,
                role: approverRole,
                decision: 'REJECTED',
                comment
            });
        }

        // Rejeter la demande
        await LeaveRequest.updateStatus(requestId, 'REJECTED');

        res.json({
            success: true,
            message: 'Demande rejetée avec succès',
            data: { approval, status: 'REJECTED' }
        });
    } catch (error) {
        console.error('Erreur de rejet:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// POST /api/leave-approvals/:requestId/request-change - Demander une modification
router.post('/:requestId/request-change', verifyToken, checkApprovalAccess, validateApproval, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: errors.array()
            });
        }

        const requestId = parseInt(req.params.requestId);
        const { comment } = req.body;
        const approverId = req.user.id;
        const approverRole = req.user.role;

        // Récupérer la demande
        const request = await LeaveRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Demande de congé non trouvée'
            });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: 'Cette demande ne peut plus être modifiée'
            });
        }

        // Créer ou mettre à jour l'approbation
        const existingApprovals = await LeaveApproval.findByRequestId(requestId);
        const existingApproval = existingApprovals.find(approval => approval.approver_id === approverId);

        let approval;
        if (existingApproval) {
            approval = await LeaveApproval.updateDecision(existingApproval.id, 'REQUEST_CHANGE', comment);
        } else {
            approval = await LeaveApproval.create({
                request_id: requestId,
                approver_id: approverId,
                role: approverRole,
                decision: 'REQUEST_CHANGE',
                comment
            });
        }

        // Marquer la demande comme nécessitant des modifications
        await LeaveRequest.updateStatus(requestId, 'REQUEST_CHANGE');

        res.json({
            success: true,
            message: 'Demande de modification envoyée avec succès',
            data: { approval, status: 'REQUEST_CHANGE' }
        });
    } catch (error) {
        console.error('Erreur de demande de modification:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

// GET /api/leave-approvals/:requestId/history - Récupérer l'historique d'approbation
router.get('/:requestId/history', verifyToken, async (req, res) => {
    try {
        const requestId = parseInt(req.params.requestId);

        // Vérifier que la demande existe et que l'utilisateur peut y accéder
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

        const approvalHistory = await LeaveApproval.getApprovalChain(requestId);

        res.json({
            success: true,
            data: approvalHistory
        });
    } catch (error) {
        console.error('Erreur de récupération de l\'historique:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur interne du serveur'
        });
    }
});

module.exports = router;




