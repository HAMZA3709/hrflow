package com.hrflow.platform.user;
import org.springframework.data.domain.*; import org.springframework.data.jpa.repository.*; import java.util.*;
public interface UserRepository extends JpaRepository<User,Long> { Optional<User> findByEmailIgnoreCase(String email); boolean existsByEmailIgnoreCase(String email); Page<User> findByEmailContainingIgnoreCase(String email,Pageable pageable); long countByRoleAndEnabledTrue(Role role); }
