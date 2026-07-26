package com.examify.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "syllabus_library")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SyllabusLibrary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String subject;

    @Column(length = 100)
    private String department;

    @Column(length = 20)
    private String year;

    @Column(name = "extracted_text", columnDefinition = "TEXT")
    private String extractedText;

    @Column(length = 20)
    private String status = "UPLOADED";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
