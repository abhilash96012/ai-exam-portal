package com.examify.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AuthDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
        private String role;
        
        // Either collegeId or new college info is provided
        private String collegeId; // String because it can be "new"
        private String newCollegeName;
        private String newCollegeDomain;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthResponse {
        private UserDto user;
        private String accessToken;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompleteProfileRequest {
        private String registerNumber;
        private String branch;
        private Integer year;
        private String section;
    }

    @Data
    public static class OTPRequest {
        private String email;
    }

    @Data
    public static class VerifyOTPRegisterRequest {
        private String email;
        private String otp;
        private String password;
        private String confirmPassword;
        private String name;
        private Long collegeId;
    }

    @Data
    public static class ResetPasswordRequest {
        private String email;
        private String otp;
        private String password;
        private String confirmPassword;
    }
}
