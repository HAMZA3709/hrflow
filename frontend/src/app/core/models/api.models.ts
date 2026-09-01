export type Role = 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type LeaveType = 'ANNUAL' | 'SICK' | 'UNPAID' | 'MATERNITY' | 'PATERNITY' | 'OTHER';
export interface Page<T> {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
}
export interface ApiError {
  timestamp?: string;
  status: number;
  error?: string;
  code: string;
  message: string;
  path?: string;
  fieldErrors?: Record<string, string>;
  correlationId?: string;
}
export interface User {
  id: number;
  email: string;
  role: Role;
  enabled: boolean;
  emailVerified: boolean;
  createdAt: string;
}
export interface Department {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface Employee {
  id: number;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  hireDate: string;
  position: string;
  active: boolean;
  userId: number | null;
  email: string | null;
  departmentId: number;
  departmentName: string;
  managerId: number | null;
  createdAt: string;
  updatedAt: string;
}
export interface LeaveRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  reason: string | null;
  status: LeaveStatus;
  managerComment: string | null;
  reviewedById: number | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface Dashboard {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  pendingLeaveRequests: number;
  employeesByDepartment: Record<string, number>;
  leaveRequestsByStatus: Record<string, number>;
}
export interface TokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
}
export interface Message {
  message: string;
}
export interface EmployeeInput {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  hireDate: string;
  position: string;
  departmentId: number;
  managerId: number | null;
  userId: number | null;
}
export interface LeaveInput {
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  reason: string | null;
}
