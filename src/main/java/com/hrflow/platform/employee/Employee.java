package com.hrflow.platform.employee;

import com.hrflow.platform.common.BaseEntity;
import com.hrflow.platform.department.Department;
import com.hrflow.platform.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Table(name="employees") @Getter @Setter @NoArgsConstructor
public class Employee extends BaseEntity {
 @Column(name="employee_number",nullable=false,unique=true,length=50) private String employeeNumber;
 @Column(name="first_name",nullable=false,length=100) private String firstName;
 @Column(name="last_name",nullable=false,length=100) private String lastName;
 @Column(length=30) private String phone;
 @Column(name="hire_date",nullable=false) private LocalDate hireDate;
 @Column(nullable=false,length=120) private String position;
 @Column(nullable=false) private boolean active=true;
 @OneToOne(fetch=FetchType.LAZY) @JoinColumn(name="user_id",unique=true) private User user;
 @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="department_id") private Department department;
 @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="manager_id") private Employee manager;
}
