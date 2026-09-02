import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  Dashboard,
  Department,
  Employee,
  EmployeeInput,
  LeaveInput,
  LeaveRequest,
  Page,
  Role,
  User,
  Application, ApplicationStage, Candidate, CvDocument, Evaluation, Interview, JobOffer, RecruitmentAudit, RecruitmentDashboard,
} from '../models/api.models';
type Params = Record<string, string | number | boolean | undefined | null>;
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private params(p: Params) {
    let x = new HttpParams();
    Object.entries(p).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') x = x.set(k, String(v));
    });
    return x;
  }
  dashboard() {
    return this.http.get<Dashboard>(`${environment.apiUrl}/dashboard/summary`);
  }
  users(p: Params = {}) {
    return this.http.get<Page<User>>(`${environment.apiUrl}/users`, { params: this.params(p) });
  }
  role(id: number, role: Role) {
    return this.http.patch<User>(`${environment.apiUrl}/users/${id}/role`, { role });
  }
  userStatus(id: number, active: boolean) {
    return this.http.patch<User>(`${environment.apiUrl}/users/${id}/status`, { active });
  }
  departments(p: Params = {}) {
    return this.http.get<Page<Department>>(`${environment.apiUrl}/departments`, {
      params: this.params(p),
    });
  }
  saveDepartment(v: { name: string; description: string | null }, id?: number) {
    return id
      ? this.http.put<Department>(`${environment.apiUrl}/departments/${id}`, v)
      : this.http.post<Department>(`${environment.apiUrl}/departments`, v);
  }
  departmentStatus(id: number, active: boolean) {
    return this.http.patch<Department>(`${environment.apiUrl}/departments/${id}/status`, {
      active,
    });
  }
  employees(p: Params = {}) {
    return this.http.get<Page<Employee>>(`${environment.apiUrl}/employees`, {
      params: this.params(p),
    });
  }
  employeeMe() {
    return this.http.get<Employee>(`${environment.apiUrl}/employees/me`);
  }
  saveEmployee(v: EmployeeInput, id?: number) {
    return id
      ? this.http.put<Employee>(`${environment.apiUrl}/employees/${id}`, v)
      : this.http.post<Employee>(`${environment.apiUrl}/employees`, v);
  }
  employeeStatus(id: number, active: boolean) {
    return this.http.patch<Employee>(`${environment.apiUrl}/employees/${id}/status`, { active });
  }
  team(id: number, p: Params = {}) {
    return this.http.get<Page<Employee>>(`${environment.apiUrl}/employees/${id}/team`, {
      params: this.params(p),
    });
  }
  leaves(p: Params = {}, mine = false) {
    return this.http.get<Page<LeaveRequest>>(
      `${environment.apiUrl}/leave-requests${mine ? '/mine' : ''}`,
      { params: this.params(p) },
    );
  }
  createLeave(v: LeaveInput) {
    return this.http.post<LeaveRequest>(`${environment.apiUrl}/leave-requests`, v);
  }
  decideLeave(id: number, d: 'approve' | 'reject', managerComment: string | null) {
    return this.http.patch<LeaveRequest>(`${environment.apiUrl}/leave-requests/${id}/${d}`, {
      managerComment,
    });
  }
  cancelLeave(id: number) {
    return this.http.patch<LeaveRequest>(`${environment.apiUrl}/leave-requests/${id}/cancel`, {});
  }
  recruitmentDashboard(){return this.http.get<RecruitmentDashboard>(`${environment.apiUrl}/recruitment/dashboard`);}
  jobOffers(p:Params={}){return this.http.get<Page<JobOffer>>(`${environment.apiUrl}/recruitment/offers`,{params:this.params(p)});}
  jobOffer(id:number){return this.http.get<JobOffer>(`${environment.apiUrl}/recruitment/offers/${id}`);}
  saveJobOffer(v:Omit<JobOffer,'id'|'status'|'departmentName'|'publishedAt'|'createdAt'|'updatedAt'>,id?:number){return id?this.http.put<JobOffer>(`${environment.apiUrl}/recruitment/offers/${id}`,v):this.http.post<JobOffer>(`${environment.apiUrl}/recruitment/offers`,v);}
  offerAction(id:number,action:'publish'|'close'|'cancel'){return this.http.patch<JobOffer>(`${environment.apiUrl}/recruitment/offers/${id}/${action}`,{});}
  candidates(p:Params={}){return this.http.get<Page<Candidate>>(`${environment.apiUrl}/recruitment/candidates`,{params:this.params(p)});}
  candidate(id:number){return this.http.get<Candidate>(`${environment.apiUrl}/recruitment/candidates/${id}`);}
  saveCandidate(v:Omit<Candidate,'id'|'createdAt'|'updatedAt'>,id?:number){return id?this.http.put<Candidate>(`${environment.apiUrl}/recruitment/candidates/${id}`,v):this.http.post<Candidate>(`${environment.apiUrl}/recruitment/candidates`,v);}
  applications(p:Params={}){return this.http.get<Page<Application>>(`${environment.apiUrl}/recruitment/applications`,{params:this.params(p)});}
  application(id:number){return this.http.get<Application>(`${environment.apiUrl}/recruitment/applications/${id}`);}
  applicationAudit(id:number){return this.http.get<Page<RecruitmentAudit>>(`${environment.apiUrl}/recruitment/applications/${id}/audit`);}
  createApplication(v:{candidateId:number;jobOfferId:number;source:string;notes:string|null}){return this.http.post<Application>(`${environment.apiUrl}/recruitment/applications`,v);}
  transitionApplication(id:number,stage:ApplicationStage){return this.http.patch<Application>(`${environment.apiUrl}/recruitment/applications/${id}/stage`,{stage});}
  rejectApplication(id:number,reason:string){return this.http.patch<Application>(`${environment.apiUrl}/recruitment/applications/${id}/reject`,{reason});}
  hireApplication(id:number){return this.http.post<Application>(`${environment.apiUrl}/recruitment/applications/${id}/hire`,{});}
  interviews(p:Params={}){return this.http.get<Page<Interview>>(`${environment.apiUrl}/recruitment/interviews`,{params:this.params(p)});}
  saveInterview(v:{applicationId:number;interviewerId:number;scheduledAt:string;durationMinutes:number;interviewType:string;locationOrMeetingUrl:string;notes:string|null},id?:number){return id?this.http.put<Interview>(`${environment.apiUrl}/recruitment/interviews/${id}`,v):this.http.post<Interview>(`${environment.apiUrl}/recruitment/interviews`,v);}
  interviewAction(id:number,action:'cancel'|'complete'){return this.http.patch<Interview>(`${environment.apiUrl}/recruitment/interviews/${id}/${action}`,{});}
  saveEvaluation(v:Omit<Evaluation,'id'|'createdAt'>,id?:number){return id?this.http.put<Evaluation>(`${environment.apiUrl}/recruitment/evaluations/${id}`,v):this.http.post<Evaluation>(`${environment.apiUrl}/recruitment/evaluations`,v);}
  uploadCv(candidateId:number,file:File){const data=new FormData();data.append('file',file);return this.http.post<CvDocument>(`${environment.apiUrl}/recruitment/candidates/${candidateId}/cv`,data);}
  cvMetadata(candidateId:number){return this.http.get<CvDocument>(`${environment.apiUrl}/recruitment/candidates/${candidateId}/cv/metadata`);}
  downloadCv(candidateId:number){return this.http.get(`${environment.apiUrl}/recruitment/candidates/${candidateId}/cv`,{responseType:'blob'});}
  deleteCv(candidateId:number){return this.http.delete<void>(`${environment.apiUrl}/recruitment/candidates/${candidateId}/cv`);}
}
