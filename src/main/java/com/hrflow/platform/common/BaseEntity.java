package com.hrflow.platform.common;

import jakarta.persistence.*;
import lombok.Getter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.Instant;

@MappedSuperclass @Getter
public abstract class BaseEntity {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) protected Long id;
 @CreationTimestamp @Column(nullable=false,updatable=false) protected Instant createdAt;
 @UpdateTimestamp @Column(nullable=false) protected Instant updatedAt;
}
