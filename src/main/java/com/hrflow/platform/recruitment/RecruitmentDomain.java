package com.hrflow.platform.recruitment;

import com.hrflow.platform.common.BaseEntity;
import com.hrflow.platform.department.Department;
import com.hrflow.platform.employee.Employee;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.*;

enum JobOfferStatus { DRAFT, PUBLISHED, CLOSED, CANCELLED }
enum EmploymentType { PERMANENT, FIXED_TERM, INTERNSHIP, FREELANCE }
enum ApplicationStage { APPLIED, SCREENING, INTERVIEW, TECHNICAL_TEST, HR_INTERVIEW, OFFER, HIRED, REJECTED, WITHDRAWN }
enum ApplicationStatus { ACTIVE, HIRED, REJECTED, WITHDRAWN }
enum InterviewStatus { SCHEDULED, COMPLETED, CANCELLED }
enum Recommendation { STRONG_HIRE, HIRE, NO_HIRE, STRONG_NO_HIRE }

@Entity @Table(name="job_offers") @Getter @Setter
class JobOffer extends BaseEntity {
 @Column(nullable=false,unique=true,length=40) String reference;
 @Column(nullable=false,length=160) String title;
 @Column(nullable=false,columnDefinition="text") String description;
 @Column(nullable=false,columnDefinition="text") String requirements;
 @Column(nullable=false,length=160) String location;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) EmploymentType employmentType;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) JobOfferStatus status=JobOfferStatus.DRAFT;
 @ManyToOne(optional=false,fetch=FetchType.LAZY) Department department;
 @ManyToOne(fetch=FetchType.LAZY) Employee hiringManager;
 Instant publishedAt; LocalDate closingDate;
}
@Entity @Table(name="candidates") @Getter @Setter
class Candidate extends BaseEntity {
 @Column(nullable=false,length=100) String firstName; @Column(nullable=false,length=100) String lastName;
 @Column(nullable=false,length=254) String email; @Column(nullable=false,length=30) String phone;
 @Column(nullable=false,length=120) String city; @Column(name="linkedin_url",length=500) String linkedInUrl;
 @Column(length=500) String portfolioUrl;
}
@Entity @Table(name="applications") @Getter @Setter
class Application {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
 @ManyToOne(optional=false,fetch=FetchType.LAZY) Candidate candidate;
 @ManyToOne(optional=false,fetch=FetchType.LAZY) JobOffer jobOffer;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=30) ApplicationStage stage=ApplicationStage.APPLIED;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) ApplicationStatus status=ApplicationStatus.ACTIVE;
 @Column(nullable=false,length=100) String source; @Column(nullable=false) Instant appliedAt=Instant.now();
 @Column(nullable=false) Instant updatedAt=Instant.now(); @Column(length=2000) String rejectionReason;
 @Column(length=4000) String notes; @OneToOne(fetch=FetchType.LAZY) Employee hiredEmployee;
 @PreUpdate void touch(){updatedAt=Instant.now();}
}
@Entity @Table(name="interviews") @Getter @Setter
class Interview extends BaseEntity {
 @ManyToOne(optional=false,fetch=FetchType.LAZY) Application application;
 @ManyToOne(optional=false,fetch=FetchType.LAZY) Employee interviewer;
 @Column(nullable=false) Instant scheduledAt; @Column(nullable=false) int durationMinutes;
 @Column(nullable=false,length=40) String interviewType; @Column(nullable=false,length=500) String locationOrMeetingUrl;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) InterviewStatus status=InterviewStatus.SCHEDULED;
 @Column(length=4000) String notes;
}
@Entity @Table(name="evaluations") @Getter @Setter
class Evaluation { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
 @OneToOne(optional=false,fetch=FetchType.LAZY) Interview interview; @ManyToOne(optional=false,fetch=FetchType.LAZY) Employee evaluator;
 int technicalScore; int communicationScore; int cultureScore;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=30) Recommendation recommendation;
 @Column(length=4000) String comments; @Column(nullable=false,updatable=false) Instant createdAt=Instant.now();
}
@Entity @Table(name="cv_documents") @Getter @Setter
class CvDocument { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
 @ManyToOne(optional=false,fetch=FetchType.LAZY) Candidate candidate;
 @Column(nullable=false,length=255) String originalFilename; @Column(nullable=false,unique=true,length=100) String storedFilename;
 @Column(nullable=false,length=100) String contentType; @Column(nullable=false) long size;
 @Column(nullable=false,length=500) String storagePath; @Column(nullable=false,length=64) String checksum;
 @Column(nullable=false) Instant uploadedAt=Instant.now(); Instant deletedAt;
}
@Entity @Table(name="recruitment_audit") @Getter @Setter
class RecruitmentAudit { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) Long id;
 @Column(nullable=false,length=40) String entityType; @Column(nullable=false) Long entityId;
 @Column(nullable=false,length=60) String action; @Column(length=254) String actorEmail;
 @Column(length=1000) String details; @Column(nullable=false) Instant occurredAt=Instant.now();
}
