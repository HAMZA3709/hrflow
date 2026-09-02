package com.hrflow.platform.recruitment;
import org.springframework.data.jpa.repository.*; import java.time.Instant; import java.util.*;
interface JobOfferRepository extends JpaRepository<JobOffer,Long>,JpaSpecificationExecutor<JobOffer>{boolean existsByReferenceIgnoreCase(String reference);boolean existsByReferenceIgnoreCaseAndIdNot(String reference,Long id);long countByStatus(JobOfferStatus status);}
interface CandidateRepository extends JpaRepository<Candidate,Long>,JpaSpecificationExecutor<Candidate>{Optional<Candidate> findByEmailIgnoreCase(String email);boolean existsByEmailIgnoreCaseAndIdNot(String email,Long id);}
interface ApplicationRepository extends JpaRepository<Application,Long>,JpaSpecificationExecutor<Application>{boolean existsByCandidateIdAndJobOfferId(Long c,Long o);long countByStage(ApplicationStage s);long countByStatus(ApplicationStatus s);List<Application> findByJobOfferIdAndStatus(Long id,ApplicationStatus status);}
interface InterviewRepository extends JpaRepository<Interview,Long>,JpaSpecificationExecutor<Interview>{List<Interview> findByApplicationId(Long id);long countByStatusAndScheduledAtAfter(InterviewStatus status,Instant at);boolean existsByApplicationIdAndStatus(Long id,InterviewStatus status);}
interface EvaluationRepository extends JpaRepository<Evaluation,Long>{Optional<Evaluation> findByInterviewId(Long id);boolean existsByInterviewApplicationIdAndRecommendationIn(Long id,Collection<Recommendation> values);}
interface CvDocumentRepository extends JpaRepository<CvDocument,Long>{Optional<CvDocument> findByCandidateIdAndDeletedAtIsNull(Long id);}
interface RecruitmentAuditRepository extends JpaRepository<RecruitmentAudit,Long>{}
