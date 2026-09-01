package com.hrflow.platform.auth;
import org.springframework.data.jpa.repository.*; import org.springframework.data.repository.query.Param; import java.time.Instant; import java.util.*;
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken,Long> { Optional<PasswordResetToken> findByTokenHash(String hash); @Modifying @Query("update PasswordResetToken t set t.usedAt=:now where t.user.id=:userId and t.usedAt is null") int invalidate(@Param("userId") Long userId,@Param("now") Instant now); }
