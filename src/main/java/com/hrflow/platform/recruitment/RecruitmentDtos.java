package com.hrflow.platform.recruitment;
import jakarta.validation.constraints.*; import java.time.*; import java.util.Map;
public final class RecruitmentDtos {private RecruitmentDtos(){}
 public record JobOfferInput(@NotBlank @Size(max=40)String reference,@NotBlank @Size(max=160)String title,@NotBlank @Size(max=20000)String description,@NotBlank @Size(max=20000)String requirements,@NotBlank @Size(max=160)String location,@NotNull EmploymentType employmentType,@NotNull Long departmentId,Long hiringManagerId,@FutureOrPresent LocalDate closingDate){}
 public record JobOfferView(Long id,String reference,String title,String description,String requirements,String location,EmploymentType employmentType,JobOfferStatus status,Long departmentId,String departmentName,Long hiringManagerId,Instant publishedAt,LocalDate closingDate,Instant createdAt,Instant updatedAt){}
 public record CandidateInput(@NotBlank @Size(max=100)String firstName,@NotBlank @Size(max=100)String lastName,@NotBlank @Email @Size(max=254)String email,@NotBlank @Size(max=30)String phone,@NotBlank @Size(max=120)String city,@Size(max=500)String linkedInUrl,@Size(max=500)String portfolioUrl){}
 public record CandidateView(Long id,String firstName,String lastName,String email,String phone,String city,String linkedInUrl,String portfolioUrl,Instant createdAt,Instant updatedAt){}
 public record ApplicationInput(@NotNull Long candidateId,@NotNull Long jobOfferId,@NotBlank @Size(max=100)String source,@Size(max=4000)String notes){}
 public record ApplicationView(Long id,CandidateView candidate,JobOfferView jobOffer,ApplicationStage stage,ApplicationStatus status,String source,Instant appliedAt,Instant updatedAt,String rejectionReason,String notes,Long hiredEmployeeId){}
 public record StageInput(@NotNull ApplicationStage stage){}
 public record RejectionInput(@NotBlank @Size(max=2000)String reason){}
 public record InterviewInput(@NotNull Long applicationId,@NotNull Long interviewerId,@NotNull @Future Instant scheduledAt,@Min(15)@Max(480)int durationMinutes,@NotBlank @Size(max=40)String interviewType,@NotBlank @Size(max=500)String locationOrMeetingUrl,@Size(max=4000)String notes){}
 public record InterviewView(Long id,Long applicationId,Long interviewerId,String interviewerName,Instant scheduledAt,int durationMinutes,String interviewType,String locationOrMeetingUrl,InterviewStatus status,String notes,Instant createdAt,Instant updatedAt){}
 public record EvaluationInput(@NotNull Long interviewId,@NotNull Long evaluatorId,@Min(1)@Max(5)int technicalScore,@Min(1)@Max(5)int communicationScore,@Min(1)@Max(5)int cultureScore,@NotNull Recommendation recommendation,@Size(max=4000)String comments){}
 public record EvaluationView(Long id,Long interviewId,Long evaluatorId,int technicalScore,int communicationScore,int cultureScore,Recommendation recommendation,String comments,Instant createdAt){}
 public record CvView(Long id,Long candidateId,String originalFilename,String contentType,long size,String checksum,Instant uploadedAt){}
 public record RecruitmentDashboard(long activeOffers,long totalApplications,Map<ApplicationStage,Long>applicationsByStage,long hires,long rejections,double averageHiringDays,long upcomingInterviews){}
}
