package com.hrflow.platform.department;
import org.springframework.data.domain.*; import org.springframework.data.jpa.repository.*;
public interface DepartmentRepository extends JpaRepository<Department,Long> { boolean existsByNameIgnoreCase(String name); boolean existsByNameIgnoreCaseAndIdNot(String name,Long id); Page<Department> findByNameContainingIgnoreCase(String q,Pageable p); long countByActiveTrue(); }
