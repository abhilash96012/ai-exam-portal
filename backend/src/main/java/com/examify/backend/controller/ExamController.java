package com.examify.backend.controller;

import com.examify.backend.dto.ApiResponse;
import com.examify.backend.dto.ExamDto;
import com.examify.backend.entity.Exam;
import com.examify.backend.security.CustomUserDetails;
import com.examify.backend.service.ExamService;
import com.examify.backend.service.OllamaService;
import com.examify.backend.service.DocumentParsingService;
import com.examify.backend.exception.ApiException;
import com.examify.backend.dto.TeacherDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;
    private final OllamaService ollamaService;
    private final DocumentParsingService documentParsingService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTeacherExams(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<Exam> exams = examService.getTeacherExams(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Exams retrieved successfully", Map.of("exams", exams)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> createExam(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody ExamDto.CreateExamRequest request) {
        Exam exam = examService.createExam(userDetails.getUsername(), request);
        return new ResponseEntity<>(ApiResponse.success("Exam created successfully", Map.of("exam", exam)), HttpStatus.CREATED);
    }

    @GetMapping("/{examId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getExamById(@PathVariable Long examId) {
        Exam exam = examService.getExamById(examId);
        return ResponseEntity.ok(ApiResponse.success("Exam retrieved successfully", Map.of("exam", exam)));
    }

    @PutMapping("/{examId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateExam(
            @PathVariable Long examId,
            @RequestBody ExamDto.UpdateExamRequest request) {
        Exam exam = examService.updateExam(examId, request);
        return ResponseEntity.ok(ApiResponse.success("Exam updated successfully", Map.of("exam", exam)));
    }

    @DeleteMapping("/{examId}")
    public ResponseEntity<ApiResponse<Void>> deleteExam(@PathVariable Long examId) {
        examService.deleteExam(examId);
        return ResponseEntity.ok(ApiResponse.success("Exam deleted successfully"));
    }

    @PostMapping("/{examId}/publish")
    public ResponseEntity<ApiResponse<Map<String, Object>>> publishExam(@PathVariable Long examId) {
        Exam exam = examService.publishExam(examId);
        return ResponseEntity.ok(ApiResponse.success("Exam published successfully", Map.of("exam", exam)));
    }
    
    @GetMapping("/{examId}/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getExamStatistics(@PathVariable Long examId) {
        Map<String, Object> stats = examService.getExamStatistics(examId);
        return ResponseEntity.ok(ApiResponse.success("Statistics retrieved successfully", stats));
    }
    
    @PostMapping("/{examId}/generate-questions")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateQuestions(
            @PathVariable Long examId,
            @RequestBody Map<String, Object> payload) {
            
        Exam exam = examService.getExamById(examId);
        String syllabusText = exam.getSyllabusText();
        
        if (syllabusText == null || syllabusText.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No syllabus uploaded for this exam");
        }

        int count = payload.containsKey("count") ? Integer.parseInt(payload.get("count").toString()) : 5;
        String qType = payload.containsKey("questionType") ? payload.get("questionType").toString() : "MCQ";
        String diff = payload.containsKey("difficulty") ? payload.get("difficulty").toString() : "Medium";
        String subject = exam.getBranch() != null ? exam.getBranch() : "General";
        String customPrompt = payload.containsKey("customPrompt") ? payload.get("customPrompt").toString() : null;

        int maxChars = 3000;
        if (syllabusText.length() > maxChars) {
            int startIdx = syllabusText.length() > 30000 ? 10000 : 0;
            if (startIdx + maxChars > syllabusText.length()) {
                startIdx = Math.max(0, syllabusText.length() - maxChars);
            }
            syllabusText = syllabusText.substring(startIdx, startIdx + maxChars) + "...";
        }

        List<TeacherDto.GeneratedQuestion> questions = ollamaService.generateQuestions(
                syllabusText, count, subject, diff, qType, customPrompt);
        
        Map<String, Object> data = new HashMap<>();
        data.put("questions", questions);
        return ResponseEntity.ok(ApiResponse.success("Questions generated successfully", data));
    }

    @PostMapping(value = "/{examId}/syllabus", consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadSyllabus(
            @PathVariable Long examId,
            @RequestParam("syllabus") MultipartFile syllabus,
            @RequestParam(value = "questionCount", required = false) String questionCount) {
        
        if (syllabus.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No file uploaded");
        }

        try {
            String extractedText = documentParsingService.extractText(syllabus);
            if (extractedText == null || extractedText.trim().isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Could not extract text from the file.");
            }

            // Save syllabus text using examService
            examService.saveSyllabusText(examId, extractedText);

            return ResponseEntity.ok(ApiResponse.success("Syllabus uploaded successfully", new HashMap<>()));
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Error parsing file: " + e.getMessage());
        }
    }
}
