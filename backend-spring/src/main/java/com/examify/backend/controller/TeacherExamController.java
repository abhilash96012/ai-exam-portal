package com.examify.backend.controller;

import com.examify.backend.dto.ApiResponse;
import com.examify.backend.dto.ExamDto;
import com.examify.backend.security.CustomUserDetails;
import com.examify.backend.service.TeacherExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
public class TeacherExamController {

    private final TeacherExamService teacherExamService;

    @PostMapping("/exams/publish-generated")
    public ResponseEntity<ApiResponse<Map<String, Object>>> publishGeneratedExam(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody ExamDto.PublishGeneratedExamRequest request) throws Exception {
        
        Long newExamId = teacherExamService.publishGeneratedExam(userDetails.getUsername(), request);
        return new ResponseEntity<>(ApiResponse.success("Exam and questions published successfully", Map.of("examId", newExamId)), HttpStatus.CREATED);
    }

    @GetMapping("/results")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTeacherResultsSummary(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<Map<String, Object>> exams = teacherExamService.getTeacherResultsSummary(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Teacher results summary retrieved", Map.of("exams", exams)));
    }

    @GetMapping("/exams/{examId}/results")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTeacherExamResults(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long examId) {
        Map<String, Object> data = teacherExamService.getTeacherExamResults(userDetails.getUsername(), examId);
        return ResponseEntity.ok(ApiResponse.success("Teacher exam results retrieved", data));
    }
}
