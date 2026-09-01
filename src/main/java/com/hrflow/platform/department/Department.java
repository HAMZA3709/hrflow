package com.hrflow.platform.department;

import com.hrflow.platform.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name="departments") @Getter @Setter @NoArgsConstructor
public class Department extends BaseEntity {
 @Column(nullable=false,unique=true,length=120) private String name;
 @Column(length=1000) private String description;
 @Column(nullable=false) private boolean active=true;
}
