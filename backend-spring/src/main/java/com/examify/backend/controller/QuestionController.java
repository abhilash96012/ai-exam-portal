package com.examify.backend.controller;

import com.examify.backend.entity.Exam;
import com.examify.backend.entity.Question;
import com.examify.backend.repository.ExamRepository;
import com.examify.backend.repository.QuestionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @PostMapping("/bulk")
    public ResponseEntity<?> createQuestionsBulk(@RequestBody BulkQuestionRequest request) {
        Exam exam = examRepository.findById(request.getExamId())
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        List<Question> savedQuestions = new ArrayList<>();
        for (QuestionDto dto : request.getQuestions()) {
            Question question = new Question();
            question.setExam(exam);
            question.setQuestionText(dto.getQuestionText());
            question.setQuestionType("MCQ"); // Assuming MCQ for now based on UI generator
            question.setCorrectOption(dto.getCorrectOption());
            question.setDifficulty(dto.getDifficulty());
            question.setMarks(dto.getMarks() != null ? dto.getMarks() : 1);
            
            // Convert options to JSON string
            List<String> optionsList = new ArrayList<>();
            optionsList.add(dto.getOptionA());
            optionsList.add(dto.getOptionB());
            optionsList.add(dto.getOptionC());
            optionsList.add(dto.getOptionD());
            try {
                question.setOptions(objectMapper.writeValueAsString(optionsList));
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Failed to process options JSON");
            }

            savedQuestions.add(questionRepository.save(question));
        }

        return ResponseEntity.ok().body("{\"message\": \"Questions saved successfully\", \"count\": " + savedQuestions.size() + "}");
    }

    @Data
    public static class BulkQuestionRequest {
        private Long examId;
        private List<QuestionDto> questions;
    }

    @Data
    public static class QuestionDto {
        private String questionText;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;
        private String correctOption;
        private String difficulty;
        private Integer marks;
    }
}
