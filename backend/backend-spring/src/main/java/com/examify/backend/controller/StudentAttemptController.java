package com.examify.backend.controller;

import com.examify.backend.dto.ApiResponse;
import com.examify.backend.dto.AttemptDto;
import com.examify.backend.security.CustomUserDetails;
import com.examify.backend.service.StudentAttemptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentAttemptController {

    private final StudentAttemptService studentAttemptService;

    @GetMapping("/exams")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAvailableExams(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<Map<String, Object>> exams = studentAttemptService.getAvailableExams(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Exams retrieved successfully", Map.of("exams", exams)));
    }

    @PostMapping("/exams/{examId}/start")
    public ResponseEntity<ApiResponse<AttemptDto.StartExamResponse>> startExam(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long examId) {
        AttemptDto.StartExamResponse response = studentAttemptService.startExam(userDetails.getUsername(), examId);
        return new ResponseEntity<>(ApiResponse.success("Exam attempt started successfully", response), HttpStatus.CREATED);
    }

    @PostMapping("/attempts/{attemptId}/answer")
    public ResponseEntity<ApiResponse<Void>> saveAnswer(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long attemptId,
            @RequestBody AttemptDto.SaveAnswerRequest request) {
        studentAttemptService.saveAnswer(userDetails.getUsername(), attemptId, request);
        return ResponseEntity.ok(ApiResponse.success("Answer saved successfully"));
    }

    @PostMapping("/attempts/{attemptId}/submit")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitExam(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long attemptId,
            @RequestBody AttemptDto.SubmitExamRequest request) {
        Map<String, Object> response = studentAttemptService.submitExam(userDetails.getUsername(), attemptId, request.getTabSwitchCount());
        return ResponseEntity.ok(ApiResponse.success("Exam submitted and graded successfully", response));
    }

    @GetMapping("/results")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllStudentResults(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Map<String, Object> response = studentAttemptService.getAllStudentResults(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Results retrieved", response));
    }

    @GetMapping("/results/{attemptId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getResultDetails(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long attemptId) {
        Map<String, Object> response = studentAttemptService.getResultDetails(userDetails.getUsername(), attemptId);
        return ResponseEntity.ok(ApiResponse.success("Result details retrieved", response));
    }

    @GetMapping("/results/exam/{examId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getResultDetailsByExam(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long examId) {
        Map<String, Object> response = studentAttemptService.getResultDetailsByExam(userDetails.getUsername(), examId);
        return ResponseEntity.ok(ApiResponse.success("Result details retrieved", response));
    }
}
