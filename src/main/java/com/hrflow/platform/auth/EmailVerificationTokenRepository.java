package com.hrflow.platform.auth;
import org.springframework.data.jpa.repository.*; import org.springframework.data.repository.query.Param; import java.time.Instant; import java.util.*;
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken,Long> { Optional<EmailVerificationToken> findByTokenHash(String hash); @Modifying @Query("update EmailVerificationToken t set t.usedAt=:now where t.user.id=:userId and t.usedAt is null") int invalidate(@Param("userId") Long userId,@Param("now") Instant now); }
