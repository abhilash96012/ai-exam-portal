package com.examify.backend.controller;

import com.examify.backend.dto.ApiResponse;
import com.examify.backend.dto.AuthDto;
import com.examify.backend.dto.UserDto;
import com.examify.backend.entity.College;
import com.examify.backend.repository.CollegeRepository;
import com.examify.backend.service.AuthService;
import com.examify.backend.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CollegeRepository collegeRepository;
    private final OtpService otpService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthDto.AuthResponse>> register(@RequestBody AuthDto.RegisterRequest request) {
        AuthDto.AuthResponse response = authService.register(request);
        return new ResponseEntity<>(ApiResponse.success("User registered successfully", response), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthDto.AuthResponse>> login(@RequestBody AuthDto.LoginRequest request) {
        AuthDto.AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getMe(@AuthenticationPrincipal UserDetails userDetails) {
        UserDto userDto = authService.getMe(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Current user loaded", userDto));
    }

    @PutMapping("/complete-profile")
    public ResponseEntity<ApiResponse<UserDto>> completeProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody AuthDto.CompleteProfileRequest request) {
        UserDto userDto = authService.completeProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile completed", userDto));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
    }
    
    @GetMapping("/colleges")
    public ResponseEntity<ApiResponse<List<College>>> getColleges() {
        return ResponseEntity.ok(ApiResponse.success("Colleges loaded successfully", collegeRepository.findAll()));
    }

    @PostMapping("/student/send-otp")
    public ResponseEntity<Map<String, Object>> sendOtp(@RequestBody AuthDto.OTPRequest request) {
        try {
            String generatedOtp = otpService.generateAndSendOtp(request.getEmail());
            java.util.Map<String, Object> data = new java.util.HashMap<>();
            data.put("email", request.getEmail());
            data.put("expiresIn", 300);
            data.put("otp", generatedOtp);
            return ResponseEntity.ok(java.util.Map.of("success", true, "message", "OTP sent successfully. Your OTP code is: " + generatedOtp, "data", data));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("success", false, "message", "Failed to send OTP: " + e.getMessage()));
        }
    }

    @PostMapping("/student/verify-otp-and-register")
    public ResponseEntity<Map<String, Object>> verifyOtpAndRegister(@RequestBody AuthDto.VerifyOTPRegisterRequest request) {
        if (!otpService.verifyOtp(request.getEmail(), request.getOtp())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(java.util.Map.of("success", false, "message", "Invalid or expired OTP"));
        }
        
        AuthDto.RegisterRequest regReq = new AuthDto.RegisterRequest();
        regReq.setName(request.getName());
        regReq.setEmail(request.getEmail());
        regReq.setPassword(request.getPassword());
        regReq.setRole("STUDENT");
        if (request.getCollegeId() != null) {
            regReq.setCollegeId(String.valueOf(request.getCollegeId()));
        }
        
        AuthDto.AuthResponse response = authService.register(regReq);
        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("accessToken", response.getAccessToken());
        data.put("user", response.getUser());
        return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Registration successful", "data", data));
    }

    @PostMapping("/student/resend-otp")
    public ResponseEntity<Map<String, Object>> resendOtp(@RequestBody AuthDto.OTPRequest request) {
        return sendOtp(request);
    }
    
    @PostMapping("/student/forgot-password/send-otp")
    public ResponseEntity<Map<String, Object>> forgotPasswordSendOtp(@RequestBody AuthDto.OTPRequest request) {
        return sendOtp(request);
    }
    
    @PostMapping("/student/forgot-password/verify-otp-and-reset")
    public ResponseEntity<Map<String, Object>> forgotPasswordVerifyAndReset(@RequestBody AuthDto.ResetPasswordRequest request) {
        if (!otpService.verifyOtp(request.getEmail(), request.getOtp())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(java.util.Map.of("success", false, "message", "Invalid or expired OTP"));
        }
        
        authService.resetPassword(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Password reset successful"));
    }
    
    @PostMapping("/student/forgot-password/resend-otp")
    public ResponseEntity<Map<String, Object>> forgotPasswordResendOtp(@RequestBody AuthDto.OTPRequest request) {
        return sendOtp(request);
    }
}
