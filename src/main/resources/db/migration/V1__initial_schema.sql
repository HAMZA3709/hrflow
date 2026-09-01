CREATE TABLE users (
 id BIGSERIAL PRIMARY KEY, email VARCHAR(254) NOT NULL, password_hash VARCHAR(100) NOT NULL,
 role VARCHAR(20) NOT NULL, enabled BOOLEAN NOT NULL DEFAULT TRUE, email_verified BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT uk_users_email UNIQUE (email), CONSTRAINT ck_users_role CHECK (role IN ('ADMIN','HR','MANAGER','EMPLOYEE'))
);
CREATE UNIQUE INDEX idx_users_email_lower ON users (lower(email));

CREATE TABLE email_verification_tokens (
 id BIGSERIAL PRIMARY KEY, token_hash CHAR(64) NOT NULL UNIQUE, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_email_tokens_user ON email_verification_tokens(user_id);
CREATE INDEX idx_email_tokens_expiry ON email_verification_tokens(expires_at);

CREATE TABLE password_reset_tokens (
 id BIGSERIAL PRIMARY KEY, token_hash CHAR(64) NOT NULL UNIQUE, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_expiry ON password_reset_tokens(expires_at);

CREATE TABLE departments (
 id BIGSERIAL PRIMARY KEY, name VARCHAR(120) NOT NULL, description VARCHAR(1000), active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT uk_departments_name UNIQUE(name)
);
CREATE UNIQUE INDEX idx_departments_name_lower ON departments(lower(name));

CREATE TABLE employees (
 id BIGSERIAL PRIMARY KEY, employee_number VARCHAR(50) NOT NULL UNIQUE, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL,
 phone VARCHAR(30), hire_date DATE NOT NULL, position VARCHAR(120) NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE,
 user_id BIGINT UNIQUE REFERENCES users(id), department_id BIGINT NOT NULL REFERENCES departments(id), manager_id BIGINT REFERENCES employees(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT ck_employee_not_self_manager CHECK(manager_id IS NULL OR manager_id <> id)
);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_name ON employees(last_name, first_name);

CREATE TABLE leave_requests (
 id BIGSERIAL PRIMARY KEY, employee_id BIGINT NOT NULL REFERENCES employees(id), start_date DATE NOT NULL, end_date DATE NOT NULL,
 leave_type VARCHAR(20) NOT NULL, reason VARCHAR(1000), status VARCHAR(20) NOT NULL DEFAULT 'PENDING', manager_comment VARCHAR(1000),
 reviewed_by_id BIGINT REFERENCES users(id), reviewed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT ck_leave_dates CHECK(start_date <= end_date),
 CONSTRAINT ck_leave_type CHECK(leave_type IN ('ANNUAL','SICK','UNPAID','MATERNITY','PATERNITY','OTHER')),
 CONSTRAINT ck_leave_status CHECK(status IN ('PENDING','APPROVED','REJECTED','CANCELLED'))
);
CREATE INDEX idx_leave_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_status ON leave_requests(status);
CREATE INDEX idx_leave_dates ON leave_requests(start_date,end_date);
CREATE INDEX idx_leave_employee_status_dates ON leave_requests(employee_id,status,start_date,end_date);
