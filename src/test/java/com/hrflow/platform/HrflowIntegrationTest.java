package com.hrflow.platform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrflow.platform.security.JwtService;
import com.hrflow.platform.user.Role;
import com.hrflow.platform.user.User;
import com.hrflow.platform.user.UserRepository;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.*;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import java.net.URI;
import java.net.http.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.regex.*;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class HrflowIntegrationTest {
 private static final String SECRET="integration-test-secret-that-is-longer-than-thirty-two-bytes",PASSWORD="StrongPassword!123";
 private static final Pattern VERIFY_TOKEN=Pattern.compile("verify-email\\?token=([A-Za-z0-9_-]+)");
 @Container static final PostgreSQLContainer<?> postgres=new PostgreSQLContainer<>("postgres:17-alpine");
 @Container static final GenericContainer<?> mailpit=new GenericContainer<>("axllent/mailpit:v1.27").withExposedPorts(1025,8025).waitingFor(Wait.forHttp("/readyz").forPort(8025));
 @DynamicPropertySource static void properties(DynamicPropertyRegistry r){r.add("spring.datasource.url",postgres::getJdbcUrl);r.add("spring.datasource.username",postgres::getUsername);r.add("spring.datasource.password",postgres::getPassword);r.add("spring.mail.host",mailpit::getHost);r.add("spring.mail.port",()->mailpit.getMappedPort(1025));r.add("hrflow.jwt.secret",()->SECRET);r.add("hrflow.frontend-base-url",()->"http://localhost:4200");r.add("hrflow.cv.storage-directory",()->System.getProperty("java.io.tmpdir")+"/hrflow-test-cv");r.add("hrflow.cv.max-size",()->128L);}
 @Autowired MockMvc mvc;@Autowired ObjectMapper json;@Autowired UserRepository users;@Autowired PasswordEncoder encoder;@Autowired JwtService jwt;@Autowired Flyway flyway;@Autowired JdbcTemplate jdbc;
 static String employeeJwt,adminJwt,managerJwt,otherManagerJwt;static Long adminId,departmentId,employeeId,managerEmployeeId;

 @Test @Order(1) void flywayRunsOnEmptyPostgresql17(){Assertions.assertEquals(17,jdbc.queryForObject("select current_setting('server_version_num')::int / 10000",Integer.class));Assertions.assertEquals("3",flyway.info().current().getVersion().getVersion());Assertions.assertEquals(3,jdbc.queryForObject("select count(*) from flyway_schema_history where success",Integer.class));Assertions.assertEquals(1,jdbc.queryForObject("select count(*) from information_schema.tables where table_name='applications'",Integer.class));}

 @Test @Order(2) void registrationRealMailpitVerificationSingleUseAndLogin()throws Exception{String email="integration@hrflow.test";
  mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\""+email+"\",\"password\":\""+PASSWORD+"\"}")).andExpect(status().isCreated());
  mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\""+email+"\",\"password\":\""+PASSWORD+"\"}")).andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("EMAIL_NOT_VERIFIED"));
  String token=awaitVerificationToken(email);mvc.perform(get("/api/v1/auth/verify-email").param("token",token)).andExpect(status().isOk());Assertions.assertTrue(users.findByEmailIgnoreCase(email).orElseThrow().isEmailVerified());
  mvc.perform(get("/api/v1/auth/verify-email").param("token",token)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_TOKEN"));
  employeeJwt=login(email);mvc.perform(get("/api/v1/auth/me").header("Authorization",bearer(employeeJwt))).andExpect(status().isOk()).andExpect(jsonPath("$.email").value(email));}

 @Test @Order(3) void jwtValidExpiredIncorrectAndAnonymous()throws Exception{mvc.perform(get("/api/v1/auth/me").header("Authorization",bearer(employeeJwt))).andExpect(status().isOk());User employee=users.findByEmailIgnoreCase("integration@hrflow.test").orElseThrow();
  String expired=new JwtService(SECRET,Duration.ofSeconds(-1)).generate(employee);mvc.perform(get("/api/v1/auth/me").header("Authorization",bearer(expired))).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));
  String wrong=new JwtService("another-integration-secret-longer-than-thirty-two-bytes",Duration.ofHours(1)).generate(employee);mvc.perform(get("/api/v1/auth/me").header("Authorization",bearer(wrong))).andExpect(status().isUnauthorized());
  mvc.perform(get("/api/v1/employees/me")).andExpect(status().isUnauthorized()).andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON)).andExpect(jsonPath("$.code").value("AUTHENTICATION_REQUIRED"));}

 @Test @Order(4) void roleAuthorizationAndLastAdminProtection()throws Exception{mvc.perform(get("/api/v1/users").header("Authorization",bearer(employeeJwt))).andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACCESS_DENIED"));User admin=user("admin.integration@hrflow.test",Role.ADMIN);adminId=admin.getId();adminJwt=jwt.generate(admin);
  mvc.perform(patch("/api/v1/users/{id}/status",adminId).header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content("{\"active\":false}")).andExpect(status().isConflict());
  mvc.perform(patch("/api/v1/users/{id}/role",adminId).header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"HR\"}")).andExpect(status().isConflict());
  mvc.perform(get("/api/v1/users").header("Authorization",bearer(adminJwt)).param("search","admin.integration").param("size","1")).andExpect(status().isOk()).andExpect(jsonPath("$.page.totalElements").value(1));}

 @Test @Order(5) void departmentCrudUniqueSearchAndDisable()throws Exception{MvcResult made=mvc.perform(post("/api/v1/departments").header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Engineering\",\"description\":\"Product team\"}")).andExpect(status().isCreated()).andReturn();departmentId=body(made).get("id").asLong();
  mvc.perform(post("/api/v1/departments").header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"engineering\"}")).andExpect(status().isConflict());
  mvc.perform(put("/api/v1/departments/{id}",departmentId).header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Engineering & Platform\",\"description\":\"Updated\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.description").value("Updated"));
  mvc.perform(patch("/api/v1/departments/{id}/status",departmentId).header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content("{\"active\":false}")).andExpect(status().isOk()).andExpect(jsonPath("$.active").value(false));
  mvc.perform(get("/api/v1/departments").header("Authorization",bearer(adminJwt)).param("search","Platform").param("size","1")).andExpect(status().isOk()).andExpect(jsonPath("$.content",hasSize(1)));
  mvc.perform(patch("/api/v1/departments/{id}/status",departmentId).header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content("{\"active\":true}")).andExpect(status().isOk());}

 @Test @Order(6) void employeeCrudSearchPaginationFiltersAndHierarchy()throws Exception{User manager=user("manager@hrflow.test",Role.MANAGER),other=user("other.manager@hrflow.test",Role.MANAGER),employee=users.findByEmailIgnoreCase("integration@hrflow.test").orElseThrow();managerJwt=jwt.generate(manager);otherManagerJwt=jwt.generate(other);
  managerEmployeeId=createEmployee("MGR-001","Maya","Manager",manager.getId(),null);createEmployee("MGR-002","Omar","Other",other.getId(),null);employeeId=createEmployee("EMP-001","Alice","Worker",employee.getId(),managerEmployeeId);
  mvc.perform(put("/api/v1/employees/{id}",employeeId).header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content(employeeJson("EMP-001","Alice","Updated",employee.getId(),managerEmployeeId,"Senior Engineer"))).andExpect(status().isOk()).andExpect(jsonPath("$.position").value("Senior Engineer"));
  mvc.perform(get("/api/v1/employees").header("Authorization",bearer(adminJwt)).param("search","EMP-001").param("departmentId",departmentId.toString()).param("active","true").param("page","0").param("size","1").param("sort","employeeNumber,asc")).andExpect(status().isOk()).andExpect(jsonPath("$.page.totalElements").value(1));
  mvc.perform(get("/api/v1/employees/{id}/team",managerEmployeeId).header("Authorization",bearer(managerJwt))).andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(employeeId));
  mvc.perform(put("/api/v1/employees/{id}",employeeId).header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content(employeeJson("EMP-001","Alice","Updated",employee.getId(),employeeId,"Senior Engineer"))).andExpect(status().isConflict());}

 @Test @Order(7) void leaveCreationOverlapApprovalAndFilters()throws Exception{LocalDate start=LocalDate.now().plusDays(20),end=start.plusDays(3);long id=body(createLeave(employeeJwt,start,end,"ANNUAL","Holiday")).get("id").asLong();
  mvc.perform(post("/api/v1/leave-requests").header("Authorization",bearer(employeeJwt)).contentType(MediaType.APPLICATION_JSON).content(leaveJson(start.plusDays(1),end.plusDays(1),"SICK","Overlap"))).andExpect(status().isConflict());
  mvc.perform(patch("/api/v1/leave-requests/{id}/approve",id).header("Authorization",bearer(managerJwt)).contentType(MediaType.APPLICATION_JSON).content("{\"managerComment\":\"Approved\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("APPROVED")).andExpect(jsonPath("$.reviewedAt").exists()).andExpect(jsonPath("$.reviewedById").exists());
  mvc.perform(get("/api/v1/leave-requests").header("Authorization",bearer(adminJwt)).param("status","APPROVED").param("employeeId",employeeId.toString()).param("departmentId",departmentId.toString()).param("from",start.toString()).param("to",end.toString())).andExpect(status().isOk()).andExpect(jsonPath("$.page.totalElements").value(1));}

 @Test @Order(8) void rejectionNeedsCommentAndOtherManagerForbidden()throws Exception{LocalDate start=LocalDate.now().plusDays(40);long id=body(createLeave(employeeJwt,start,start.plusDays(1),"UNPAID","Personal")).get("id").asLong();
  mvc.perform(get("/api/v1/leave-requests").header("Authorization",bearer(otherManagerJwt))).andExpect(status().isOk()).andExpect(jsonPath("$.page.totalElements").value(0));
  mvc.perform(patch("/api/v1/leave-requests/{id}/reject",id).header("Authorization",bearer(managerJwt)).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isConflict());
  mvc.perform(patch("/api/v1/leave-requests/{id}/approve",id).header("Authorization",bearer(otherManagerJwt)).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden());
  mvc.perform(patch("/api/v1/leave-requests/{id}/reject",id).header("Authorization",bearer(managerJwt)).contentType(MediaType.APPLICATION_JSON).content("{\"managerComment\":\"Capacity constraint\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("REJECTED"));}

 @Test @Order(9) void employeeCancelsOwnFuturePendingLeave()throws Exception{LocalDate start=LocalDate.now().plusDays(60);long id=body(createLeave(employeeJwt,start,start.plusDays(2),"OTHER","Event")).get("id").asLong();mvc.perform(patch("/api/v1/leave-requests/{id}/cancel",id).header("Authorization",bearer(employeeJwt))).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELLED"));}

 @Test @Order(10) void dashboardUsesRealPostgresqlData()throws Exception{mvc.perform(get("/api/v1/dashboard/summary").header("Authorization",bearer(adminJwt))).andExpect(status().isOk()).andExpect(jsonPath("$.totalEmployees").value(greaterThanOrEqualTo(3))).andExpect(jsonPath("$.activeEmployees").value(greaterThanOrEqualTo(3))).andExpect(jsonPath("$.totalDepartments").value(greaterThanOrEqualTo(1))).andExpect(jsonPath("$.employeesByDepartment['Engineering & Platform']").value(3)).andExpect(jsonPath("$.leaveRequestsByStatus.APPROVED").value(1)).andExpect(jsonPath("$.leaveRequestsByStatus.REJECTED").value(1)).andExpect(jsonPath("$.leaveRequestsByStatus.CANCELLED").value(1));}

 @Test @Order(11) void validationErrorsAndCorrelationIdsFollowContract()throws Exception{mvc.perform(post("/api/v1/auth/register").header("X-Correlation-ID","trace_Valid-123").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"bad\",\"password\":\"short\"}")).andExpect(status().isBadRequest()).andExpect(header().string("X-Correlation-ID","trace_Valid-123")).andExpect(jsonPath("$.code").value("VALIDATION_ERROR")).andExpect(jsonPath("$.fieldErrors.email").exists()).andExpect(jsonPath("$.fieldErrors.password").exists()).andExpect(jsonPath("$.path").value("/api/v1/auth/register"));mvc.perform(get("/api/v1/auth/me").header("X-Correlation-ID","not valid!")).andExpect(status().isUnauthorized()).andExpect(header().string("X-Correlation-ID",matchesPattern("[0-9a-f-]{36}")));}

 @Test @Order(12) void recruitmentHireWorkflowCvDashboardAndPermissions()throws Exception{
  long offer=body(mvc.perform(post("/api/v1/recruitment/offers").header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content(offerJson("REC-JAVA-01"))).andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("DRAFT")).andReturn()).get("id").asLong();
  long candidate=body(mvc.perform(post("/api/v1/recruitment/candidates").header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content(candidateJson("hire@candidate.test"))).andExpect(status().isCreated()).andReturn()).get("id").asLong();
  mvc.perform(post("/api/v1/recruitment/applications").header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content("{\"candidateId\":"+candidate+",\"jobOfferId\":"+offer+",\"source\":\"DIRECT\"}")).andExpect(status().isConflict());
  mvc.perform(patch("/api/v1/recruitment/offers/{id}/publish",offer).header("Authorization",bearer(adminJwt))).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PUBLISHED"));
  mvc.perform(get("/api/v1/recruitment/public/offers")).andExpect(status().isOk()).andExpect(jsonPath("$.content[0].reference").value("REC-JAVA-01"));
  long application=body(mvc.perform(post("/api/v1/recruitment/applications").header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content("{\"candidateId\":"+candidate+",\"jobOfferId\":"+offer+",\"source\":\"LINKEDIN\",\"notes\":\"Senior\"}")).andExpect(status().isCreated()).andReturn()).get("id").asLong();
  mvc.perform(post("/api/v1/recruitment/applications").header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content("{\"candidateId\":"+candidate+",\"jobOfferId\":"+offer+",\"source\":\"DIRECT\"}")).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("BUSINESS_CONFLICT"));
  byte[] pdf="%PDF-1.4\n%%EOF".getBytes();mvc.perform(multipart("/api/v1/recruitment/candidates/{id}/cv",candidate).file("file",pdf).header("Authorization",bearer(adminJwt))).andExpect(status().isOk()).andExpect(jsonPath("$.checksum",hasLength(64))).andExpect(jsonPath("$.storagePath").doesNotExist());
  mvc.perform(multipart("/api/v1/recruitment/candidates/{id}/cv",candidate).file("file","not pdf".getBytes()).header("Authorization",bearer(adminJwt))).andExpect(status().isConflict());
  mvc.perform(multipart("/api/v1/recruitment/candidates/{id}/cv",candidate).file("file",new byte[129]).header("Authorization",bearer(adminJwt))).andExpect(status().isConflict());
  mvc.perform(get("/api/v1/recruitment/candidates/{id}/cv",candidate).header("Authorization",bearer(employeeJwt))).andExpect(status().isForbidden());
  for(String stage:List.of("SCREENING","INTERVIEW","HR_INTERVIEW","OFFER"))mvc.perform(patch("/api/v1/recruitment/applications/{id}/stage",application).header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content("{\"stage\":\""+stage+"\"}")).andExpect(status().isOk());
  mvc.perform(patch("/api/v1/recruitment/applications/{id}/stage",application).header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content("{\"stage\":\"APPLIED\"}")).andExpect(status().isConflict());
  String when=Instant.now().plus(2,ChronoUnit.DAYS).toString();long interview=body(mvc.perform(post("/api/v1/recruitment/interviews").header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content("{\"applicationId\":"+application+",\"interviewerId\":"+managerEmployeeId+",\"scheduledAt\":\""+when+"\",\"durationMinutes\":60,\"interviewType\":\"TECHNICAL\",\"locationOrMeetingUrl\":\"https://meet.example/interview\"}")).andExpect(status().isCreated()).andReturn()).get("id").asLong();
  mvc.perform(patch("/api/v1/recruitment/interviews/{id}/complete",interview).header("Authorization",bearer(managerJwt))).andExpect(status().isOk());
  mvc.perform(post("/api/v1/recruitment/evaluations").header("Authorization",bearer(managerJwt)).contentType(MediaType.APPLICATION_JSON).content("{\"interviewId\":"+interview+",\"evaluatorId\":"+managerEmployeeId+",\"technicalScore\":5,\"communicationScore\":4,\"cultureScore\":4,\"recommendation\":\"HIRE\",\"comments\":\"Favorable\"}")).andExpect(status().isCreated());
  long employee=body(mvc.perform(post("/api/v1/recruitment/applications/{id}/hire",application).header("Authorization",bearer(adminJwt))).andExpect(status().isOk()).andExpect(jsonPath("$.stage").value("HIRED")).andReturn()).get("hiredEmployeeId").asLong();
  mvc.perform(post("/api/v1/recruitment/applications/{id}/hire",application).header("Authorization",bearer(adminJwt))).andExpect(status().isOk()).andExpect(jsonPath("$.hiredEmployeeId").value(employee));
  mvc.perform(get("/api/v1/recruitment/dashboard").header("Authorization",bearer(adminJwt))).andExpect(status().isOk()).andExpect(jsonPath("$.hires").value(1)).andExpect(jsonPath("$.totalApplications").value(1));
 }
 @Test @Order(13) void recruitmentRejectionRequiresReason()throws Exception{long offer=body(mvc.perform(post("/api/v1/recruitment/offers").header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content(offerJson("REC-JAVA-02"))).andExpect(status().isCreated()).andReturn()).get("id").asLong();mvc.perform(patch("/api/v1/recruitment/offers/{id}/publish",offer).header("Authorization",bearer(adminJwt))).andExpect(status().isOk());long c=body(mvc.perform(post("/api/v1/recruitment/candidates").header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content(candidateJson("reject@candidate.test"))).andExpect(status().isCreated()).andReturn()).get("id").asLong();long a=body(mvc.perform(post("/api/v1/recruitment/applications").header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content("{\"candidateId\":"+c+",\"jobOfferId\":"+offer+",\"source\":\"DIRECT\"}")).andExpect(status().isCreated()).andReturn()).get("id").asLong();mvc.perform(patch("/api/v1/recruitment/applications/{id}/reject",a).header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"\"}")).andExpect(status().isBadRequest());mvc.perform(patch("/api/v1/recruitment/applications/{id}/reject",a).header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Compétences insuffisantes\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("REJECTED"));}

 private User user(String email,Role role){User u=new User();u.setEmail(email);u.setPasswordHash(encoder.encode(PASSWORD));u.setRole(role);u.setEnabled(true);u.setEmailVerified(true);return users.save(u);}
 private String login(String email)throws Exception{return body(mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\""+email+"\",\"password\":\""+PASSWORD+"\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.tokenType").value("Bearer")).andReturn()).get("accessToken").asText();}
 private Long createEmployee(String number,String first,String last,Long userId,Long managerId)throws Exception{return body(mvc.perform(post("/api/v1/employees").header("Authorization",bearer(adminJwt)).contentType(MediaType.APPLICATION_JSON).content(employeeJson(number,first,last,userId,managerId,"Engineer"))).andExpect(status().isCreated()).andReturn()).get("id").asLong();}
 private String employeeJson(String number,String first,String last,Long userId,Long managerId,String position){return "{\"employeeNumber\":\""+number+"\",\"firstName\":\""+first+"\",\"lastName\":\""+last+"\",\"phone\":\"+212600000000\",\"hireDate\":\""+LocalDate.now().minusYears(1)+"\",\"position\":\""+position+"\",\"departmentId\":"+departmentId+",\"managerId\":"+(managerId==null?"null":managerId)+",\"userId\":"+userId+"}";}
 private MvcResult createLeave(String token,LocalDate start,LocalDate end,String type,String reason)throws Exception{return mvc.perform(post("/api/v1/leave-requests").header("Authorization",bearer(token)).contentType(MediaType.APPLICATION_JSON).content(leaveJson(start,end,type,reason))).andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("PENDING")).andReturn();}
 private String leaveJson(LocalDate start,LocalDate end,String type,String reason){return "{\"startDate\":\""+start+"\",\"endDate\":\""+end+"\",\"leaveType\":\""+type+"\",\"reason\":\""+reason+"\"}";}
 private String offerJson(String reference){return "{\"reference\":\""+reference+"\",\"title\":\"Senior Java Engineer\",\"description\":\"Build HRFlow\",\"requirements\":\"Java 21\",\"location\":\"Casablanca\",\"employmentType\":\"PERMANENT\",\"departmentId\":"+departmentId+",\"hiringManagerId\":"+managerEmployeeId+",\"closingDate\":\""+LocalDate.now().plusMonths(2)+"\"}";}
 private String candidateJson(String email){return "{\"firstName\":\"Nora\",\"lastName\":\"Candidate\",\"email\":\""+email+"\",\"phone\":\"+212611111111\",\"city\":\"Rabat\"}";}
 private JsonNode body(MvcResult r)throws Exception{return json.readTree(r.getResponse().getContentAsString());}
 private String awaitVerificationToken(String recipient)throws Exception{HttpClient client=HttpClient.newHttpClient();String base="http://"+mailpit.getHost()+":"+mailpit.getMappedPort(8025);for(int attempt=0;attempt<40;attempt++){JsonNode list=json.readTree(client.send(HttpRequest.newBuilder(URI.create(base+"/api/v1/messages")).GET().build(),HttpResponse.BodyHandlers.ofString()).body());for(JsonNode summary:list.path("messages")){String id=summary.path("ID").asText();JsonNode message=json.readTree(client.send(HttpRequest.newBuilder(URI.create(base+"/api/v1/message/"+id)).GET().build(),HttpResponse.BodyHandlers.ofString()).body());if(message.toString().contains(recipient)){Matcher matcher=VERIFY_TOKEN.matcher(message.toString());if(matcher.find())return matcher.group(1);}}Thread.sleep(100);}throw new AssertionError("Aucun email de vérification reçu par Mailpit");}
 private static String bearer(String token){return "Bearer "+token;}
}
