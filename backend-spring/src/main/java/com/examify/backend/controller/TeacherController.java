package com.examify.backend.controller;

import com.examify.backend.dto.ApiResponse;
import com.examify.backend.dto.TeacherDto;
import com.examify.backend.exception.ApiException;
import com.examify.backend.service.DocumentParsingService;
import com.examify.backend.service.OllamaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
public class TeacherController {

    private final OllamaService ollamaService;
    private final DocumentParsingService documentParsingService;

    @GetMapping("/subjects")
    public ResponseEntity<ApiResponse<List<String>>> getSubjects() {
        return ResponseEntity.ok(ApiResponse.success("Ok", List.of("Java Programming", "Database Systems", "Software Engineering")));
    }

    @PostMapping("/generate-questions-from-prompt")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateQuestionsFromPrompt(@RequestBody TeacherDto.GeneratePromptRequest request) {
        int count = request.getNumberOfQuestions() != null ? request.getNumberOfQuestions() : 5;
        String prompt = request.getPrompt() != null ? request.getPrompt() : "Generate general questions for this subject";
        String subject = request.getSubject() != null ? request.getSubject() : "General Knowledge";
        String diff = request.getDifficulty() != null ? request.getDifficulty() : "Medium";
        String qType = request.getQuestionType() != null ? request.getQuestionType() : "MCQ";

        List<TeacherDto.GeneratedQuestion> questions = ollamaService.generateQuestions(prompt, count, subject, diff, qType, null);
        
        Map<String, Object> data = new HashMap<>();
        data.put("questions", questions);
        return ResponseEntity.ok(ApiResponse.success("Questions generated successfully", data));
    }

    @PostMapping(value = "/generate-questions-from-file", consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateQuestionsFromFile(
            @RequestParam("document") MultipartFile document,
            @RequestParam(value = "subject", defaultValue = "General Knowledge") String subject,
            @RequestParam(value = "questionType", defaultValue = "MCQ") String questionType,
            @RequestParam(value = "difficulty", defaultValue = "Medium") String difficulty,
            @RequestParam(value = "numberOfQuestions", defaultValue = "5") Integer numberOfQuestions) {
        
        if (document.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No file uploaded");
        }

        try {
            String extractedText = documentParsingService.extractText(document);
            
            if (extractedText == null || extractedText.trim().isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Could not extract text from the file.");
            }

            int maxChars = 12000;
            if (extractedText.length() > maxChars) {
                extractedText = extractedText.substring(0, maxChars) + "...";
            }

            List<TeacherDto.GeneratedQuestion> questions = ollamaService.generateQuestions(
                    extractedText, numberOfQuestions, subject, difficulty, questionType, null);

            if (questions == null || questions.isEmpty()) {
                throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "AI failed to generate questions in the correct format.");
            }

            Map<String, Object> data = new HashMap<>();
            data.put("questions", questions);
            return ResponseEntity.ok(ApiResponse.success("Questions generated successfully from document", data));
            
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Error parsing file: " + e.getMessage());
        }
    }
}
