package com.hrflow.platform.user;

import com.hrflow.platform.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name="users") @Getter @Setter @NoArgsConstructor
public class User extends BaseEntity {
 @Column(nullable=false,unique=true,length=254) private String email;
 @Column(name="password_hash",nullable=false,length=100) private String passwordHash;
 @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private Role role=Role.EMPLOYEE;
 @Column(nullable=false) private boolean enabled=true;
 @Column(name="email_verified",nullable=false) private boolean emailVerified;
}
