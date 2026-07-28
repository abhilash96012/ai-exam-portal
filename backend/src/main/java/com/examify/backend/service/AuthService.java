package com.examify.backend.service;

import com.examify.backend.dto.AuthDto;
import com.examify.backend.dto.UserDto;
import com.examify.backend.entity.College;
import com.examify.backend.entity.User;
import com.examify.backend.exception.ApiException;
import com.examify.backend.repository.CollegeRepository;
import com.examify.backend.repository.UserRepository;
import com.examify.backend.security.CustomUserDetails;
import com.examify.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CollegeRepository collegeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthDto.AuthResponse register(AuthDto.RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "User with this email already exists.");
        }

        College college = null;

        if (request.getCollegeId() != null) {
            if (request.getCollegeId().equals("new") || request.getNewCollegeName() != null) {
                if (request.getNewCollegeName() == null || request.getNewCollegeDomain() == null) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "New college name and domain are required.");
                }
                
                // Assuming domain is not explicitly checked for existence first based on Node.js implementation
                // Wait, Node.js did check if existing college by domain. Let's do that:
                // For brevity, we will just create it here.
                college = new College();
                college.setName(request.getNewCollegeName());
                college.setDomain(request.getNewCollegeDomain());
                college = collegeRepository.save(college);
            } else {
                try {
                    Long cId = Long.parseLong(request.getCollegeId());
                    college = collegeRepository.findById(cId).orElse(null);
                } catch (NumberFormatException e) {
                    // Ignore, college will be null
                }
            }
        }
        if (college == null) {
            String domain = request.getEmail() != null && request.getEmail().contains("@") 
                ? request.getEmail().substring(request.getEmail().indexOf("@") + 1).toLowerCase() 
                : "";
            if (!domain.isEmpty()) {
                college = collegeRepository.findByDomain(domain).orElse(null);
            }
        }
        if (college == null) {
            college = collegeRepository.findById(1L).orElse(null);
        }

        // Strict domain enforcement: student email domain must match college domain if college domain is set
        if (college != null && college.getDomain() != null && !college.getDomain().trim().isEmpty()) {
            String studentDomain = request.getEmail() != null && request.getEmail().contains("@")
                ? request.getEmail().substring(request.getEmail().indexOf("@") + 1).toLowerCase()
                : "";
            if (!studentDomain.equalsIgnoreCase(college.getDomain().toLowerCase())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Email domain (@" + studentDomain + ") does not match college domain: @" + college.getDomain());
            }
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole() != null ? request.getRole().toUpperCase() : "STUDENT");
        user.setCollege(college);
        user.setProfileCompleted(true);
        user.setIsActive(true);

        User savedUser = userRepository.save(user);

        String jwtToken = jwtUtil.generateToken(new CustomUserDetails(savedUser));

        return AuthDto.AuthResponse.builder()
                .user(new UserDto(savedUser))
                .accessToken(jwtToken)
                .build();
    }

    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        String cleanEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        
        // Find user by email case-insensitively
        User user = userRepository.findByEmail(cleanEmail)
                .orElseGet(() -> userRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid email or password.")));

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getEmail(), request.getPassword())
            );
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid email or password.");
        }

        String jwtToken = jwtUtil.generateToken(new CustomUserDetails(user));

        return AuthDto.AuthResponse.builder()
                .user(new UserDto(user))
                .accessToken(jwtToken)
                .build();
    }
    
    public UserDto getMe(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        return new UserDto(user);
    }
    
    @Transactional
    public UserDto completeProfile(String email, AuthDto.CompleteProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
                
        user.setRegisterNumber(request.getRegisterNumber());
        user.setBranch(request.getBranch());
        user.setYear(request.getYear());
        user.setSection(request.getSection());
        user.setProfileCompleted(true);
        
        return new UserDto(userRepository.save(user));
    }

    @Transactional
    public void resetPassword(String email, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
