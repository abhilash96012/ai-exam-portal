package com.examify.backend.config;

import com.examify.backend.entity.College;
import com.examify.backend.entity.User;
import com.examify.backend.repository.CollegeRepository;
import com.examify.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CollegeRepository collegeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Ensure default college exists
        College defaultCollege;
        if (collegeRepository.count() == 0) {
            defaultCollege = new College();
            defaultCollege.setName("SASTRA Deemed University");
            defaultCollege.setDomain("sastra.ac.in");
            defaultCollege = collegeRepository.save(defaultCollege);
        } else {
            defaultCollege = collegeRepository.findAll().get(0);
        }

        // Clean up legacy non-institutional student accounts (alice@gmail.com)
        userRepository.findByEmail("alice@gmail.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("alice@example.com").ifPresent(userRepository::delete);

        // 1. Teacher Accounts (Password: 123456789)
        seedOrUpdateUser("mahadev1@gmail.com", "Mahadev Teacher", "123456789", "TEACHER", defaultCollege);
        seedOrUpdateUser("ganesh@sastra.ac.in", "Ganesh J", "123456789", "TEACHER", defaultCollege);

        // 2. Official SASTRA Student Accounts (Password: student123)
        seedOrUpdateStudent("alice@sastra.ac.in", "Alice Student", "student123", "REG2024001", "Computer Science Engineering", "School of Computing", defaultCollege);
        seedOrUpdateStudent("227003031@sastra.ac.in", "Boganadham Jaya Abhilash", "student123", "227003031", "Computer Science Engineering", "School of Computing", defaultCollege);

        // 3. Admin Accounts (Password: admin123)
        seedOrUpdateUser("admin@gmail.com", "Admin User", "admin123", "ADMIN", defaultCollege);
        seedOrUpdateUser("admin@sastra.ac.in", "Sastra Admin", "admin123", "ADMIN", defaultCollege);
    }

    private void seedOrUpdateUser(String email, String name, String rawPassword, String role, College college) {
        User user = userRepository.findByEmail(email).orElse(new User());
        user.setEmail(email);
        user.setName(name);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setCollege(college);
        user.setIsActive(true);
        user.setProfileCompleted(true);
        userRepository.save(user);
        System.out.println("✅ Database Account Ready: " + email + " | Role: " + role + " | Password: " + rawPassword);
    }

    private void seedOrUpdateStudent(String email, String name, String rawPassword, String regNo, String branch, String dept, College college) {
        User user = userRepository.findByEmail(email).orElse(new User());
        user.setEmail(email);
        user.setName(name);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole("STUDENT");
        user.setRegisterNumber(regNo);
        user.setBranch(branch);
        user.setDepartment(dept);
        user.setYear(3);
        user.setSection("A");
        user.setCollege(college);
        user.setIsActive(true);
        user.setProfileCompleted(true);
        userRepository.save(user);
    }
}
