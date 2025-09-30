export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'employee' | 'manager' | 'hr' | 'admin';
  serviceId: string;
  managerId?: string;
  avatar?: string;
}

export interface Service {
  id: string;
  name: string;
  managerId: string;
}

export interface LeaveType {
  id: string;
  code: string;
  name: string;
  color: string;
  requiresJustification: boolean;
  maxDays?: number;
  isExceptional: boolean;
}

export interface LeaveBalance {
  userId: string;
  leaveTypeId: string;
  acquired: number;
  used: number;
  remaining: number;
  year: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  validatorId?: string;
  validationComment?: string;
  createdAt: string;
  validatedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'leave_request' | 'validation_needed' | 'status_update' | 'reminder';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface Holiday {
  date: string;
  name: string;
  country: string;
}

export interface AppState {
  users: User[];
  services: Service[];
  leaveTypes: LeaveType[];
  leaveBalances: LeaveBalance[];
  leaveRequests: LeaveRequest[];
  notifications: Notification[];
  currentUser: User;
}

export interface AppActions {
  switchUser: (userId: string) => void;
  submitLeaveRequest: (payload: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }) => { ok: boolean; error?: string };
  validateRequest: (requestId: string, action: 'approve' | 'reject', options?: { comment?: string }) => { ok: boolean; error?: string };
  addUser: (payload: { firstName: string; lastName: string; email: string; role: User['role']; serviceId: string; managerId?: string }) => { ok: boolean; error?: string };
  updateUserRole: (userId: string, role: User['role']) => { ok: boolean; error?: string };
}

export interface AppStore extends AppState, AppActions { }