package com.examify.backend.controller;

import com.examify.backend.dto.AdminDto;
import com.examify.backend.dto.ApiResponse;
import com.examify.backend.dto.UserDto;
import com.examify.backend.security.CustomUserDetails;
import com.examify.backend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<AdminDto.DashboardStats>> getDashboardStats(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Long collegeId = userDetails.getUser().getCollege() != null ? userDetails.getUser().getCollege().getId() : 1L;
        return ResponseEntity.ok(ApiResponse.success("Dashboard statistics loaded successfully", adminService.getDashboardStats(collegeId)));
    }

    @GetMapping("/students")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStudents(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Long collegeId = userDetails.getUser().getCollege() != null ? userDetails.getUser().getCollege().getId() : 1L;
        List<UserDto> students = adminService.getStudents(collegeId);
        return ResponseEntity.ok(ApiResponse.success("Students retrieved successfully", Map.of("students", students)));
    }

    @PostMapping("/students")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createStudent(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody AdminDto.CreateStudentRequest request) {
        Long collegeId = userDetails.getUser().getCollege() != null ? userDetails.getUser().getCollege().getId() : 1L;
        UserDto student = adminService.createStudent(collegeId, request);
        return new ResponseEntity<>(ApiResponse.success("Student created successfully", Map.of("student", student)), HttpStatus.CREATED);
    }

    @PostMapping(value = "/students/upload-csv", consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<Map<String, Integer>>> uploadStudentsCsv(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        Long collegeId = userDetails.getUser().getCollege() != null ? userDetails.getUser().getCollege().getId() : 1L;
        Map<String, Integer> result = adminService.uploadStudentsCsv(collegeId, file);
        return ResponseEntity.ok(ApiResponse.success("CSV uploaded and processed successfully", result));
    }

    @PostMapping(value = "/syllabus/upload", consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<Void>> uploadSyllabus(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @ModelAttribute AdminDto.UploadSyllabusRequest request) throws Exception {
        Long collegeId = userDetails.getUser().getCollege() != null ? userDetails.getUser().getCollege().getId() : 1L;
        adminService.uploadSyllabus(collegeId, request);
        return ResponseEntity.ok(ApiResponse.success("Syllabus uploaded and sent to webhook successfully"));
    }
}
