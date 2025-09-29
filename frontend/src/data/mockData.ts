import { User, Service, LeaveType, LeaveBalance, LeaveRequest, Notification, Holiday } from '../types';

export const users: User[] = [
  {
    id: '1',
    email: 'jean.dupont@company.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'employee',
    serviceId: 'dev',
    managerId: '2'
  },
  {
    id: '2',
    email: 'marie.martin@company.com',
    firstName: 'Marie',
    lastName: 'Martin',
    role: 'manager',
    serviceId: 'dev'
  },
  {
    id: '3',
    email: 'sophie.rh@company.com',
    firstName: 'Sophie',
    lastName: 'Bernard',
    role: 'hr',
    serviceId: 'rh'
  },
  {
    id: '4',
    email: 'admin@company.com',
    firstName: 'Admin',
    lastName: 'System',
    role: 'admin',
    serviceId: 'admin'
  }
];

export const services: Service[] = [
  { id: 'dev', name: 'Développement', managerId: '2' },
  { id: 'rh', name: 'Ressources Humaines', managerId: '3' },
  { id: 'admin', name: 'Administration', managerId: '4' }
];

export const leaveTypes: LeaveType[] = [
  {
    id: 'cp',
    code: 'CP',
    name: 'Congés Payés',
    color: '#3B82F6',
    requiresJustification: false,
    isExceptional: false
  },
  {
    id: 'rtt',
    code: 'RTT',
    name: 'RTT',
    color: '#10B981',
    requiresJustification: false,
    isExceptional: false
  },
  {
    id: 'maladie',
    code: 'MAL',
    name: 'Maladie',
    color: '#EF4444',
    requiresJustification: true,
    isExceptional: true
  },
  {
    id: 'sans-solde',
    code: 'SS',
    name: 'Sans Solde',
    color: '#6B7280',
    requiresJustification: true,
    isExceptional: false
  },
  {
    id: 'maternite',
    code: 'MAT',
    name: 'Maternité/Paternité',
    color: '#F59E0B',
    requiresJustification: true,
    isExceptional: true
  }
];

export const leaveBalances: LeaveBalance[] = [
  { userId: '1', leaveTypeId: 'cp', acquired: 25, used: 8, remaining: 17, year: 2025 },
  { userId: '1', leaveTypeId: 'rtt', acquired: 12, used: 3, remaining: 9, year: 2025 },
  { userId: '2', leaveTypeId: 'cp', acquired: 25, used: 12, remaining: 13, year: 2025 },
  { userId: '2', leaveTypeId: 'rtt', acquired: 12, used: 6, remaining: 6, year: 2025 }
];

export const leaveRequests: LeaveRequest[] = [
  {
    id: '1',
    employeeId: '1',
    leaveTypeId: 'cp',
    startDate: '2025-09-15',
    endDate: '2025-09-19',
    days: 5,
    reason: 'Vacances en famille',
    status: 'pending',
    createdAt: '2025-09-07T10:00:00Z'
  },
  {
    id: '2',
    employeeId: '1',
    leaveTypeId: 'rtt',
    startDate: '2025-09-10',
    endDate: '2025-09-10',
    days: 1,
    status: 'approved',
    validatorId: '2',
    validationComment: 'Approuvé',
    createdAt: '2025-09-05T14:30:00Z',
    validatedAt: '2025-09-06T09:15:00Z'
  }
];

export const notifications: Notification[] = [
  {
    id: '1',
    userId: '2',
    type: 'validation_needed',
    title: 'Nouvelle demande de congés',
    message: 'Jean Dupont a fait une demande de congés payés du 15/09 au 19/09',
    read: false,
    createdAt: '2025-09-07T10:00:00Z'
  },
  {
    id: '2',
    userId: '1',
    type: 'status_update',
    title: 'Demande approuvée',
    message: 'Votre demande de RTT du 10/09 a été approuvée',
    read: true,
    createdAt: '2025-09-06T09:15:00Z'
  }
];

export const holidays: Holiday[] = [
  { date: '2025-01-01', name: 'Jour de l\'An', country: 'FR' },
  { date: '2025-04-21', name: 'Lundi de Pâques', country: 'FR' },
  { date: '2025-05-01', name: 'Fête du Travail', country: 'FR' },
  { date: '2025-05-08', name: 'Fête de la Victoire', country: 'FR' },
  { date: '2025-05-29', name: 'Ascension', country: 'FR' },
  { date: '2025-06-09', name: 'Lundi de Pentecôte', country: 'FR' },
  { date: '2025-07-14', name: 'Fête Nationale', country: 'FR' },
  { date: '2025-08-15', name: 'Assomption', country: 'FR' },
  { date: '2025-11-01', name: 'Toussaint', country: 'FR' },
  { date: '2025-11-11', name: 'Armistice', country: 'FR' },
  { date: '2025-12-25', name: 'Noël', country: 'FR' }
];

// Current user simulation
export let currentUser: User = users[0]; // Default to employee

export const setCurrentUser = (user: User) => {
  currentUser = user;
};

export const getCurrentUser = () => currentUser;