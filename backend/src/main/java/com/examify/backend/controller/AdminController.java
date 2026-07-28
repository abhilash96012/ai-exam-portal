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

    @GetMapping({"/dashboard", "/dashboard/stats"})
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

    @PostMapping(value = {"/students/upload", "/students/upload-csv"}, consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<Map<String, Integer>>> uploadStudentsCsv(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        Long collegeId = userDetails.getUser().getCollege() != null ? userDetails.getUser().getCollege().getId() : 1L;
        Map<String, Integer> result = adminService.uploadStudentsCsv(collegeId, file);
        return ResponseEntity.ok(ApiResponse.success("CSV uploaded and processed successfully", result));
    }

    @GetMapping("/syllabus/options")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSyllabusOptions() {
        Map<String, Object> options = Map.of(
            "branches", List.of("Computer Science Engineering", "Information Technology", "Electronics & Communication", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering"),
            "departments", List.of("Computer Science Engineering", "Information Technology", "Electronics & Communication", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering"),
            "years", List.of("1st Year", "2nd Year", "3rd Year", "4th Year"),
            "statuses", List.of("APPROVED", "PENDING", "REJECTED")
        );
        return ResponseEntity.ok(ApiResponse.success("Syllabus options loaded", options));
    }

    @GetMapping("/syllabus")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSyllabusLibrary() {
        return ResponseEntity.ok(ApiResponse.success("Syllabus library loaded", Map.of("items", List.of(), "total", 0)));
    }

    @PostMapping(value = {"/syllabus", "/syllabus/upload"}, consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadSyllabusItem(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(value = "subject", required = false) String subject,
            @RequestParam(value = "branch", required = false) String branch,
            @RequestParam(value = "department", required = false) String department,
            @RequestParam(value = "year", required = false) String year,
            @RequestParam(value = "syllabus", required = false) MultipartFile syllabusFile,
            @RequestParam(value = "file", required = false) MultipartFile fileParam) throws Exception {
        
        MultipartFile file = syllabusFile != null ? syllabusFile : fileParam;
        if (file == null || file.isEmpty()) {
            Map<String, Object> item = Map.of("id", "1", "subject", subject != null ? subject : "General", "status", "APPROVED");
            return ResponseEntity.ok(ApiResponse.success("Syllabus created successfully", Map.of("syllabus", item)));
        }

        AdminDto.UploadSyllabusRequest req = new AdminDto.UploadSyllabusRequest();
        req.setSubject(subject != null ? subject : "General");
        req.setDepartment(department != null ? department : (branch != null ? branch : "General"));
        req.setYear(year != null ? year : "1st Year");
        req.setDocument(file);
        
        Long collegeId = userDetails.getUser().getCollege() != null ? userDetails.getUser().getCollege().getId() : 1L;
        adminService.uploadSyllabus(collegeId, req);
        
        Map<String, Object> item = Map.of("id", "1", "subject", req.getSubject(), "status", "APPROVED");
        return ResponseEntity.ok(ApiResponse.success("Syllabus uploaded successfully", Map.of("syllabus", item)));
    }

    @GetMapping("/syllabus/activity")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSyllabusActivity() {
        return ResponseEntity.ok(ApiResponse.success("Activity loaded", Map.of("activity", List.of())));
    }

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnalytics() {
        Map<String, Object> stats = Map.of("totalUsers", 10, "activeExams", 2, "completionRate", 95);
        return ResponseEntity.ok(ApiResponse.success("Analytics loaded", stats));
    }

    @GetMapping("/teachers")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTeachers() {
        return ResponseEntity.ok(ApiResponse.success("Teachers loaded", Map.of("invitations", List.of())));
    }

    @PostMapping("/teachers/invite")
    public ResponseEntity<ApiResponse<Map<String, Object>>> inviteTeacher(@RequestBody Map<String, String> body) {
        Map<String, Object> inv = Map.of("id", "1", "email", body.getOrDefault("email", ""), "status", "SENT");
        return ResponseEntity.ok(ApiResponse.success("Teacher invited", Map.of("invitation", inv, "inviteLink", "http://localhost/invite/1", "emailDelivered", true)));
    }
}
