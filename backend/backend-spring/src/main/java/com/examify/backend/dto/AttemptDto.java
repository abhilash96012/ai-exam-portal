package com.examify.backend.dto;

import com.examify.backend.entity.ExamAttempt;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class AttemptDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaveAnswerRequest {
        private Long questionId;
        private String selectedOption;
        private String textAnswer;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubmitExamRequest {
        private Integer tabSwitchCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StartExamResponse {
        private ExamAttempt attempt;
        private Object exam;
        private List<QuestionDto> questions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionDto {
        private Long id;
        private Long exam_id;
        private String question_text;
        private String question_type;
        private String option_a;
        private String option_b;
        private String option_c;
        private String option_d;
        private Integer marks;
    }
}
