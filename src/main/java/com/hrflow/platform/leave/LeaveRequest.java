package com.hrflow.platform.leave;

import com.hrflow.platform.common.BaseEntity;
import com.hrflow.platform.employee.Employee;
import com.hrflow.platform.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;

@Entity @Table(name="leave_requests") @Getter @Setter @NoArgsConstructor
public class LeaveRequest extends BaseEntity {
 @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="employee_id") private Employee employee;
 @Column(name="start_date",nullable=false) private LocalDate startDate;
 @Column(name="end_date",nullable=false) private LocalDate endDate;
 @Enumerated(EnumType.STRING) @Column(name="leave_type",nullable=false,length=20) private LeaveType leaveType;
 @Column(length=1000) private String reason;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private LeaveStatus status=LeaveStatus.PENDING;
 @Column(name="manager_comment",length=1000) private String managerComment;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="reviewed_by_id") private User reviewedBy;
 @Column(name="reviewed_at") private Instant reviewedAt;
}
