package com.hrflow.platform.auth;
import com.hrflow.platform.user.User; import jakarta.persistence.*; import lombok.*; import java.time.Instant;
@Entity @Table(name="email_verification_tokens") @Getter @Setter @NoArgsConstructor
public class EmailVerificationToken { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id; @Column(name="token_hash",nullable=false,unique=true,length=64) private String tokenHash; @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="user_id") private User user; @Column(name="expires_at",nullable=false) private Instant expiresAt; @Column(name="used_at") private Instant usedAt; @Column(name="created_at",nullable=false,updatable=false) private Instant createdAt=Instant.now(); }
