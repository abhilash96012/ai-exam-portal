package com.examify.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

public class ExamDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PublishGeneratedExamRequest {
        private String examName;
        private String description;
        private String department;
        private String year;
        private String section;
        private String startDate;
        private String startTime;
        private String endDate;
        private String endTime;
        private Integer duration;
        private Integer totalMarks;
        private List<QuestionInput> questions;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionInput {
        private String question;
        private List<String> options;
        private Integer correctAnswer;
        private String modelAnswer;
        private String difficulty;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateExamRequest {
        private String title;
        private String description;
        private Integer duration;
        private Integer totalMarks;
        private String branch;
        private Integer year;
        private String section;
        private String startTime;
        private String endTime;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateExamRequest {
        private String title;
        private String description;
        private Integer duration;
        private Integer totalMarks;
        private String branch;
        private Integer year;
        private String section;
        private String startTime;
        private String endTime;
        private Boolean isPublished;
    }
}
