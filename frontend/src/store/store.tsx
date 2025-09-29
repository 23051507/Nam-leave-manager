import React, { createContext, useContext, useMemo, useState } from 'react';
import { AppStore, LeaveBalance, LeaveRequest, Notification, User } from '@/types';
import { users as seedUsers, services as seedServices, leaveTypes as seedLeaveTypes, leaveBalances as seedLeaveBalances, leaveRequests as seedLeaveRequests, notifications as seedNotifications, holidays as seedHolidays } from '@/data/mockData';
import { toast } from 'sonner';

const StoreContext = createContext<AppStore | null>(null);

function calculateWorkingDays(start: string, end: string, holidays: { date: string }[]): number {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate < startDate) return 0;
    let count = 0;
    const current = new Date(startDate);
    while (current <= endDate) {
        const dow = current.getDay();
        const dateStr = current.toISOString().split('T')[0];
        if (dow !== 0 && dow !== 6 && !holidays.some(h => h.date === dateStr)) count++;
        current.setDate(current.getDate() + 1);
    }
    return count;
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User>(seedUsers[0]);
    const [users, setUsers] = useState(seedUsers);
    const [services] = useState(seedServices);
    const [leaveTypes] = useState(seedLeaveTypes);
    const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>(seedLeaveBalances);
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(seedLeaveRequests);
    const [notifications, setNotifications] = useState<Notification[]>(seedNotifications);
    const [holidays] = useState(seedHolidays);

    const switchUser = (userId: string) => {
        if (currentUser.id === userId) return;
        const u = users.find(u => u.id === userId);
        if (u) setCurrentUser(u); else toast.error('Utilisateur introuvable');
    };

    const addUser: AppStore['addUser'] = (payload) => {
        const { firstName, lastName, email, role, serviceId, managerId } = payload;
        if (!firstName || !lastName || !email) return { ok: false, error: 'Champs requis manquants' };
        if (!services.find(s => s.id === serviceId)) return { ok: false, error: 'Service invalide' };
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) return { ok: false, error: 'Email déjà existant' };

        const newUser: User = {
            id: (users.length + 1).toString(),
            firstName,
            lastName,
            email,
            role,
            serviceId,
            managerId
        };
        setUsers(prev => [...prev, newUser]);

        toast.success('Employé ajouté');
        return { ok: true };
    };

    const updateUserRole: AppStore['updateUserRole'] = (userId, role) => {
        const exists = users.find(u => u.id === userId);
        if (!exists) return { ok: false, error: 'Utilisateur introuvable' };
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
        if (currentUser.id === userId) setCurrentUser({ ...exists, role });
        toast.success('Rôle mis à jour');
        return { ok: true };
    };

    const submitLeaveRequest: AppStore['submitLeaveRequest'] = (payload) => {
        const { leaveTypeId, startDate, endDate, reason } = payload;
        const leaveType = leaveTypes.find(l => l.id === leaveTypeId);
        if (!leaveType) return { ok: false, error: 'Type de congé invalide' };
        if (!startDate || !endDate) return { ok: false, error: 'Dates manquantes' };

        const days = calculateWorkingDays(startDate, endDate, holidays);
        if (days <= 0) return { ok: false, error: 'Aucune journée ouvrée' };

        // balance rules
        if (!leaveType.isExceptional) {
            const bal = leaveBalances.find(b => b.userId === currentUser.id && b.leaveTypeId === leaveTypeId);
            if (!bal || days > bal.remaining) {
                return { ok: false, error: 'Solde insuffisant' };
            }
        }

        const newRequest: LeaveRequest = {
            id: (leaveRequests.length + 1).toString(),
            employeeId: currentUser.id,
            leaveTypeId,
            startDate,
            endDate,
            days,
            reason,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        setLeaveRequests(prev => [newRequest, ...prev]);

        // notify manager (simplified: service manager)
        const service = services.find(s => s.id === currentUser.serviceId);
        if (service) {
            const notif: Notification = {
                id: (notifications.length + 1).toString(),
                userId: service.managerId,
                type: 'validation_needed',
                title: 'Nouvelle demande de congés',
                message: `${currentUser.firstName} ${currentUser.lastName} a fait une demande du ${new Date(startDate).toLocaleDateString('fr-FR')} au ${new Date(endDate).toLocaleDateString('fr-FR')}`,
                read: false,
                createdAt: new Date().toISOString()
            };
            setNotifications(prev => [notif, ...prev]);
        }

        toast.success('Demande de congés soumise');
        return { ok: true };
    };

    const validateRequest: AppStore['validateRequest'] = (requestId, action, options) => {
        const req = leaveRequests.find(r => r.id === requestId);
        if (!req) return { ok: false, error: 'Demande introuvable' };

        if (action === 'approve') {
            // update balances for non-exceptional
            const leaveType = leaveTypes.find(l => l.id === req.leaveTypeId);
            if (leaveType && !leaveType.isExceptional) {
                const idx = leaveBalances.findIndex(b => b.userId === req.employeeId && b.leaveTypeId === req.leaveTypeId);
                if (idx >= 0) {
                    const copy = [...leaveBalances];
                    const bal = { ...copy[idx] };
                    bal.used += req.days;
                    bal.remaining = Math.max(0, bal.acquired - bal.used);
                    copy[idx] = bal;
                    setLeaveBalances(copy);
                }
            }
        }

        setLeaveRequests(prev => prev.map(r => r.id === requestId ? {
            ...r,
            status: action === 'approve' ? 'approved' : 'rejected',
            validatorId: currentUser.id,
            validationComment: options?.comment,
            validatedAt: new Date().toISOString()
        } : r));

        // notify employee
        const notif: Notification = {
            id: (notifications.length + 1).toString(),
            userId: req.employeeId,
            type: 'status_update',
            title: action === 'approve' ? 'Demande approuvée' : 'Demande rejetée',
            message: action === 'approve' ? 'Votre demande a été approuvée' : 'Votre demande a été rejetée',
            read: false,
            createdAt: new Date().toISOString()
        };
        setNotifications(prev => [notif, ...prev]);

        toast.success(action === 'approve' ? 'Demande approuvée' : 'Demande rejetée');
        return { ok: true };
    };

    const value: AppStore = useMemo(() => ({
        users,
        services,
        leaveTypes,
        leaveBalances,
        leaveRequests,
        notifications,
        currentUser,
        switchUser,
        submitLeaveRequest,
        validateRequest,
        addUser,
        updateUserRole
    }), [users, services, leaveTypes, leaveBalances, leaveRequests, notifications, currentUser]);

    return (
        <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
    );
};

export function useAppStore(): AppStore {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error('useAppStore must be used within StoreProvider');
    return ctx;
} 