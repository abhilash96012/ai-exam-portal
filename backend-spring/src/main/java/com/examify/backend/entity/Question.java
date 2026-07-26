package com.examify.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id")
    private Exam exam;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(length = 20)
    private String difficulty;

    @Column(name = "question_type", length = 20)
    private String questionType;

    @Column(columnDefinition = "TEXT")
    private String options; // Stored as JSON string

    @Column(name = "correct_option", length = 10)
    private String correctOption;

    @Column(name = "model_answer", columnDefinition = "TEXT")
    private String modelAnswer;

    private Integer marks = 1;

    @Column(name = "source_context", columnDefinition = "TEXT")
    private String sourceContext;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
