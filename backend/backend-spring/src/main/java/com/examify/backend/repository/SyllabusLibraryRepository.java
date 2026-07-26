package com.examify.backend.repository;

import com.examify.backend.entity.SyllabusLibrary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SyllabusLibraryRepository extends JpaRepository<SyllabusLibrary, Long> {
}
