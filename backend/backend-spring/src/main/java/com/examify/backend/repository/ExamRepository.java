package com.examify.backend.repository;

import com.examify.backend.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByCreatedById(Long teacherId);
    List<Exam> findByIsPublishedTrue();
    List<Exam> findByCollegeIdAndIsPublishedTrue(Long collegeId);
    List<Exam> findByCreatedByOrderByCreatedAtDesc(com.examify.backend.entity.User user);
}
