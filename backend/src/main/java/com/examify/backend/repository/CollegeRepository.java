package com.examify.backend.repository;

import com.examify.backend.entity.College;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CollegeRepository extends JpaRepository<College, Long> {
    java.util.Optional<College> findByDomain(String domain);
}
