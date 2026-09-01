package com.hrflow.platform.common;
import com.hrflow.platform.leave.*; import com.hrflow.platform.user.Role; import jakarta.validation.constraints.*; import java.time.*; import java.util.*;
public final class ApiModels { private ApiModels(){}
 public record Register(@NotBlank @Email String email,@NotBlank @Size(min=12,max=72) String password){}
 public record Login(@NotBlank @Email String email,@NotBlank String password){}
 public record EmailInput(@NotBlank @Email String email){}
 public record ResetPassword(@NotBlank String token,@NotBlank @Size(min=12,max=72) String newPassword){}
 public record TokenResponse(String accessToken,String tokenType,long expiresInSeconds){}
 public record Message(String message){}
 public record UserView(Long id,String email,Role role,boolean enabled,boolean emailVerified,Instant createdAt){}
 public record RoleUpdate(@NotNull Role role){} public record StatusUpdate(@NotNull Boolean active){}
 public record DepartmentInput(@NotBlank @Size(max=120) String name,@Size(max=1000) String description){}
 public record DepartmentView(Long id,String name,String description,boolean active,Instant createdAt,Instant updatedAt){}
 public record EmployeeInput(@NotBlank @Size(max=50) String employeeNumber,@NotBlank @Size(max=100) String firstName,@NotBlank @Size(max=100) String lastName,@Size(max=30) String phone,@NotNull @PastOrPresent LocalDate hireDate,@NotBlank @Size(max=120) String position,@NotNull Long departmentId,Long managerId,Long userId){}
 public record EmployeeView(Long id,String employeeNumber,String firstName,String lastName,String phone,LocalDate hireDate,String position,boolean active,Long userId,String email,Long departmentId,String departmentName,Long managerId,Instant createdAt,Instant updatedAt){}
 public record LeaveInput(@NotNull LocalDate startDate,@NotNull LocalDate endDate,@NotNull LeaveType leaveType,@Size(max=1000) String reason){}
 public record Decision(@Size(max=1000) String managerComment){}
 public record LeaveView(Long id,Long employeeId,String employeeName,LocalDate startDate,LocalDate endDate,LeaveType leaveType,String reason,LeaveStatus status,String managerComment,Long reviewedById,Instant reviewedAt,Instant createdAt,Instant updatedAt){}
 public record Dashboard(long totalEmployees,long activeEmployees,long totalDepartments,long pendingLeaveRequests,Map<String,Long> employeesByDepartment,Map<String,Long> leaveRequestsByStatus){}
}
