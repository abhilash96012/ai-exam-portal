package com.examify.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

public class AdminDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateStudentRequest {
        private String registration_number;
        private String name;
        private String email;
        private String department;
        private String branch;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InviteTeacherRequest {
        private String name;
        private String email;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UploadSyllabusRequest {
        private String subject;
        private String department;
        private String year;
        private MultipartFile document;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardStats {
        private int totalStudents;
        private int totalTeachers;
        private int totalExams;
        private int totalPublishedExams;
    }
}
