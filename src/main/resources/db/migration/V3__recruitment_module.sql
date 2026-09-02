CREATE TABLE job_offers (
 id BIGSERIAL PRIMARY KEY, reference VARCHAR(40) NOT NULL UNIQUE, title VARCHAR(160) NOT NULL,
 description TEXT NOT NULL, requirements TEXT NOT NULL, location VARCHAR(160) NOT NULL,
 employment_type VARCHAR(20) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
 department_id BIGINT NOT NULL REFERENCES departments(id), hiring_manager_id BIGINT REFERENCES employees(id),
 published_at TIMESTAMPTZ, closing_date DATE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT ck_job_offer_type CHECK (employment_type IN ('PERMANENT','FIXED_TERM','INTERNSHIP','FREELANCE')),
 CONSTRAINT ck_job_offer_status CHECK (status IN ('DRAFT','PUBLISHED','CLOSED','CANCELLED'))
);
CREATE INDEX idx_job_offer_status ON job_offers(status);
CREATE INDEX idx_job_offer_department ON job_offers(department_id);
CREATE INDEX idx_job_offer_manager ON job_offers(hiring_manager_id);

CREATE TABLE candidates (
 id BIGSERIAL PRIMARY KEY, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL,
 email VARCHAR(254) NOT NULL, phone VARCHAR(30) NOT NULL, city VARCHAR(120) NOT NULL,
 linkedin_url VARCHAR(500), portfolio_url VARCHAR(500),
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX idx_candidate_email_lower ON candidates(lower(email));
CREATE INDEX idx_candidate_name ON candidates(last_name, first_name);

CREATE TABLE applications (
 id BIGSERIAL PRIMARY KEY, candidate_id BIGINT NOT NULL REFERENCES candidates(id), job_offer_id BIGINT NOT NULL REFERENCES job_offers(id),
 stage VARCHAR(30) NOT NULL DEFAULT 'APPLIED', status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', source VARCHAR(100) NOT NULL,
 applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 rejection_reason VARCHAR(2000), notes VARCHAR(4000), hired_employee_id BIGINT UNIQUE REFERENCES employees(id),
 CONSTRAINT uk_application_candidate_offer UNIQUE(candidate_id,job_offer_id),
 CONSTRAINT ck_application_stage CHECK(stage IN ('APPLIED','SCREENING','INTERVIEW','TECHNICAL_TEST','HR_INTERVIEW','OFFER','HIRED','REJECTED','WITHDRAWN')),
 CONSTRAINT ck_application_status CHECK(status IN ('ACTIVE','HIRED','REJECTED','WITHDRAWN'))
);
CREATE INDEX idx_application_offer_stage ON applications(job_offer_id,stage);
CREATE INDEX idx_application_candidate ON applications(candidate_id);
CREATE INDEX idx_application_applied ON applications(applied_at);

CREATE TABLE interviews (
 id BIGSERIAL PRIMARY KEY, application_id BIGINT NOT NULL REFERENCES applications(id), interviewer_id BIGINT NOT NULL REFERENCES employees(id),
 scheduled_at TIMESTAMPTZ NOT NULL, duration_minutes INTEGER NOT NULL, interview_type VARCHAR(40) NOT NULL,
 location_or_meeting_url VARCHAR(500) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED', notes VARCHAR(4000),
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT ck_interview_duration CHECK(duration_minutes BETWEEN 15 AND 480),
 CONSTRAINT ck_interview_status CHECK(status IN ('SCHEDULED','COMPLETED','CANCELLED'))
);
CREATE INDEX idx_interview_application ON interviews(application_id);
CREATE INDEX idx_interview_interviewer_date ON interviews(interviewer_id,scheduled_at);

CREATE TABLE evaluations (
 id BIGSERIAL PRIMARY KEY, interview_id BIGINT NOT NULL UNIQUE REFERENCES interviews(id), evaluator_id BIGINT NOT NULL REFERENCES employees(id),
 technical_score INTEGER NOT NULL, communication_score INTEGER NOT NULL, culture_score INTEGER NOT NULL,
 recommendation VARCHAR(30) NOT NULL, comments VARCHAR(4000), created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT ck_evaluation_scores CHECK(technical_score BETWEEN 1 AND 5 AND communication_score BETWEEN 1 AND 5 AND culture_score BETWEEN 1 AND 5),
 CONSTRAINT ck_evaluation_recommendation CHECK(recommendation IN ('STRONG_HIRE','HIRE','NO_HIRE','STRONG_NO_HIRE'))
);

CREATE TABLE cv_documents (
 id BIGSERIAL PRIMARY KEY, candidate_id BIGINT NOT NULL REFERENCES candidates(id), original_filename VARCHAR(255) NOT NULL,
 stored_filename VARCHAR(100) NOT NULL UNIQUE, content_type VARCHAR(100) NOT NULL, size BIGINT NOT NULL,
 storage_path VARCHAR(500) NOT NULL, checksum VARCHAR(64) NOT NULL, uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX idx_cv_candidate_active ON cv_documents(candidate_id) WHERE deleted_at IS NULL;

CREATE TABLE recruitment_audit (
 id BIGSERIAL PRIMARY KEY, entity_type VARCHAR(40) NOT NULL, entity_id BIGINT NOT NULL, action VARCHAR(60) NOT NULL,
 actor_email VARCHAR(254), details VARCHAR(1000), occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_recruitment_audit_entity ON recruitment_audit(entity_type,entity_id,occurred_at);
