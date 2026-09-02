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
export type JobOfferStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED';
export type EmploymentType = 'PERMANENT' | 'FIXED_TERM' | 'INTERNSHIP' | 'FREELANCE';
export type ApplicationStage = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'TECHNICAL_TEST' | 'HR_INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';
export type ApplicationStatus = 'ACTIVE' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';
export interface JobOffer { id:number;reference:string;title:string;description:string;requirements:string;location:string;employmentType:EmploymentType;status:JobOfferStatus;departmentId:number;departmentName:string;hiringManagerId:number|null;publishedAt:string|null;closingDate:string|null;createdAt:string;updatedAt:string; }
export interface Candidate { id:number;firstName:string;lastName:string;email:string;phone:string;city:string;linkedInUrl:string|null;portfolioUrl:string|null;createdAt:string;updatedAt:string; }
export interface Application { id:number;candidate:Candidate;jobOffer:JobOffer;stage:ApplicationStage;status:ApplicationStatus;source:string;appliedAt:string;updatedAt:string;rejectionReason:string|null;notes:string|null;hiredEmployeeId:number|null; }
export interface Interview { id:number;applicationId:number;interviewerId:number;interviewerName:string;scheduledAt:string;durationMinutes:number;interviewType:string;locationOrMeetingUrl:string;status:'SCHEDULED'|'COMPLETED'|'CANCELLED';notes:string|null;createdAt:string;updatedAt:string; }
export interface Evaluation { id:number;interviewId:number;evaluatorId:number;technicalScore:number;communicationScore:number;cultureScore:number;recommendation:'STRONG_HIRE'|'HIRE'|'NO_HIRE'|'STRONG_NO_HIRE';comments:string|null;createdAt:string; }
export interface CvDocument { id:number;candidateId:number;originalFilename:string;contentType:string;size:number;checksum:string;uploadedAt:string; }
export interface RecruitmentDashboard {activeOffers:number;totalApplications:number;applicationsByStage:Partial<Record<ApplicationStage,number>>;hires:number;rejections:number;averageHiringDays:number;upcomingInterviews:number;}
export interface RecruitmentAudit {id:number;entityType:string;entityId:number;action:string;actor:string|null;details:string|null;occurredAt:string;}
