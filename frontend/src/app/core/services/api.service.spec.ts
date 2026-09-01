import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';

describe('ApiService contracts', () => {
  let api: ApiService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('loads the real dashboard endpoint', () => {
    api.dashboard().subscribe((x) => expect(x.pendingLeaveRequests).toBe(2));
    http.expectOne('/api/v1/dashboard/summary').flush({
      totalEmployees: 3,
      activeEmployees: 3,
      totalDepartments: 1,
      pendingLeaveRequests: 2,
      employeesByDepartment: {},
      leaveRequestsByStatus: {},
    });
  });

  it('uses the stable user pagination contract', () => {
    api
      .users({ page: 1, size: 10, search: 'admin' })
      .subscribe((x) => expect(x.page.number).toBe(1));
    const req = http.expectOne((r) => r.url === '/api/v1/users');
    expect(req.request.params.get('search')).toBe('admin');
    req.flush({ content: [], page: { size: 10, number: 1, totalElements: 0, totalPages: 0 } });
  });

  it('creates a department with the exact DTO', () => {
    api.saveDepartment({ name: 'Qualité', description: null }).subscribe();
    const req = http.expectOne('/api/v1/departments');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Qualité', description: null });
    req.flush({});
  });

  it('sends employee filters', () => {
    api.employees({ departmentId: 4, active: true, sort: 'lastName,asc' }).subscribe();
    const req = http.expectOne((r) => r.url === '/api/v1/employees');
    expect(req.request.params.get('departmentId')).toBe('4');
    expect(req.request.params.get('active')).toBe('true');
    req.flush({ content: [], page: { size: 20, number: 0, totalElements: 0, totalPages: 0 } });
  });

  it('creates a leave request with the backend enums', () => {
    const input = {
      startDate: '2026-10-01',
      endDate: '2026-10-02',
      leaveType: 'ANNUAL' as const,
      reason: 'Repos',
    };
    api.createLeave(input).subscribe();
    const req = http.expectOne('/api/v1/leave-requests');
    expect(req.request.body).toEqual(input);
    req.flush({});
  });

  it('approves and rejects through distinct decision endpoints', () => {
    api.decideLeave(12, 'approve', 'OK').subscribe();
    let req = http.expectOne('/api/v1/leave-requests/12/approve');
    expect(req.request.body).toEqual({ managerComment: 'OK' });
    req.flush({});
    api.decideLeave(13, 'reject', 'Charge').subscribe();
    req = http.expectOne('/api/v1/leave-requests/13/reject');
    expect(req.request.body).toEqual({ managerComment: 'Charge' });
    req.flush({});
  });
});
