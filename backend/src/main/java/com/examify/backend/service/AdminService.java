package com.examify.backend.service;

import com.examify.backend.dto.AdminDto;
import com.examify.backend.dto.UserDto;
import com.examify.backend.entity.College;
import com.examify.backend.entity.User;
import com.examify.backend.exception.ApiException;
import com.examify.backend.repository.CollegeRepository;
import com.examify.backend.repository.ExamRepository;
import com.examify.backend.repository.UserRepository;
import com.opencsv.CSVReader;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ExamRepository examRepository;
    private final CollegeRepository collegeRepository;
    private final PasswordEncoder passwordEncoder;
    private final DocumentParsingService documentParsingService;
    private final AutomationService automationService;

    public AdminDto.DashboardStats getDashboardStats(Long adminCollegeId) {
        List<User> users = userRepository.findByCollegeId(adminCollegeId);
        int totalStudents = (int) users.stream().filter(u -> "STUDENT".equals(u.getRole())).count();
        int totalTeachers = (int) users.stream().filter(u -> "TEACHER".equals(u.getRole())).count();
        int totalExams = examRepository.findByCollegeIdAndIsPublishedTrue(adminCollegeId).size();
        
        return AdminDto.DashboardStats.builder()
                .totalStudents(totalStudents)
                .totalTeachers(totalTeachers)
                .totalExams(totalExams)
                .totalPublishedExams(totalExams)
                .build();
    }

    public List<UserDto> getStudents(Long collegeId) {
        return userRepository.findByCollegeId(collegeId).stream()
                .filter(u -> "STUDENT".equals(u.getRole()))
                .map(UserDto::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDto createStudent(Long adminCollegeId, AdminDto.CreateStudentRequest request) {
        College college = collegeRepository.findById(adminCollegeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "College not found"));

        String email = request.getEmail();
        if (college != null && college.getDomain() != null && !college.getDomain().trim().isEmpty()) {
            String studentDomain = email.contains("@") ? email.substring(email.indexOf("@") + 1) : "";
            if (!studentDomain.equalsIgnoreCase(college.getDomain())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Student email domain must match college domain: @" + college.getDomain());
            }
        }

        if (userRepository.findByEmail(email).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email address already registered");
        }

        User student = new User();
        student.setName(request.getName());
        student.setEmail(email);
        student.setPassword(passwordEncoder.encode("student123"));
        student.setRole("STUDENT");
        student.setRegisterNumber(request.getRegistration_number());
        student.setBranch(request.getBranch() != null ? request.getBranch() : request.getDepartment());
        student.setYear(1);
        student.setCollege(college);
        student.setProfileCompleted(true);
        student.setIsActive(true);

        return new UserDto(userRepository.save(student));
    }

    @Transactional
    public Map<String, Integer> uploadStudentsCsv(Long adminCollegeId, MultipartFile file) {
        College college = collegeRepository.findById(adminCollegeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "College not found"));

        int insertedCount = 0;
        int updatedCount = 0;
        int processedCount = 0;

        try (CSVReader csvReader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            String[] headers = csvReader.readNext();
            if (headers == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Empty CSV file");
            }

            // Map headers to indices
            Map<String, Integer> headerMap = new HashMap<>();
            for (int i = 0; i < headers.length; i++) {
                headerMap.put(headers[i].toLowerCase().trim(), i);
            }

            String[] record;
            while ((record = csvReader.readNext()) != null) {
                processedCount++;
                String email = getCsvValue(record, headerMap, "email");
                String name = getCsvValue(record, headerMap, "name", "student_name");
                
                if (email == null || name == null || email.isEmpty()) continue;

                String studentDomain = email.contains("@") ? email.substring(email.indexOf("@") + 1) : "";
                if (college != null && college.getDomain() != null && !college.getDomain().trim().isEmpty()) {
                    if (!studentDomain.equalsIgnoreCase(college.getDomain())) {
                        continue; // Skip emails that do not match the college domain
                    }
                }

                String reg = getCsvValue(record, headerMap, "register_number", "registration_number", "roll_no");
                String branch = getCsvValue(record, headerMap, "branch", "department");
                String rawPassword = getCsvValue(record, headerMap, "password");
                if (rawPassword == null || rawPassword.isEmpty()) rawPassword = "student123";

                Optional<User> existingOpt = userRepository.findByEmail(email);
                if (existingOpt.isPresent()) {
                    User user = existingOpt.get();
                    user.setName(name);
                    user.setRegisterNumber(reg);
                    user.setBranch(branch != null ? branch : "General");
                    if (getCsvValue(record, headerMap, "password") != null) {
                        user.setPassword(passwordEncoder.encode(rawPassword));
                    }
                    userRepository.save(user);
                    updatedCount++;
                } else {
                    User user = createBaseUser(name, email, reg, branch, passwordEncoder.encode(rawPassword), college);
                    userRepository.save(user);
                    insertedCount++;
                }
            }
        } catch (Exception e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Error processing CSV: " + e.getMessage());
        }

        Map<String, Integer> result = new HashMap<>();
        result.put("totalProcessed", processedCount);
        result.put("insertedCount", insertedCount);
        result.put("updatedCount", updatedCount);
        return result;
    }

    private static User createBaseUser(String name, String email, String reg, String branch, String encodedPassword, College college) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(encodedPassword);
        user.setRole("STUDENT");
        user.setRegisterNumber(reg);
        user.setBranch(branch != null ? branch : "General");
        user.setYear(1);
        user.setCollege(college);
        user.setProfileCompleted(true);
        user.setIsActive(true);
        return user;
    }

    private String getCsvValue(String[] record, Map<String, Integer> headerMap, String... keys) {
        for (String key : keys) {
            if (headerMap.containsKey(key) && record.length > headerMap.get(key)) {
                String val = record[headerMap.get(key)];
                if (val != null && !val.trim().isEmpty()) {
                    return val.trim();
                }
            }
        }
        return null;
    }

    public void uploadSyllabus(Long adminCollegeId, AdminDto.UploadSyllabusRequest request) throws Exception {
        String extractedText = documentParsingService.extractText(request.getDocument());
        
        if (extractedText == null || extractedText.trim().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Could not extract text from document");
        }

        Map<String, Object> payloadData = new HashMap<>();
        payloadData.put("subject", request.getSubject());
        payloadData.put("department", request.getDepartment());
        payloadData.put("year", request.getYear());
        payloadData.put("type", "admin");
        
        Map<String, Object> dataObj = new HashMap<>();
        dataObj.put("text", extractedText);
        payloadData.put("data", dataObj);

        // Trigger n8n webhook
        automationService.triggerN8nWebhook(payloadData, "admin");
    }
}
