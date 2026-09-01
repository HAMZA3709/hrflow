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
}
