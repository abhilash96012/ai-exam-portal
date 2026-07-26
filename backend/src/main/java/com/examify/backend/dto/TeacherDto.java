package com.examify.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

public class TeacherDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GeneratePromptRequest {
        private String prompt;
        private String subject;
        private String questionType;
        private String difficulty;
        private Integer numberOfQuestions;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GeneratedQuestion {
        private String question;
        private List<String> options;
        private Integer correctAnswer;
        private String questionType;
        private String difficulty;
        private Integer marks;
        private String modelAnswer;
    }
}
