package com.examify.backend.config;

import com.examify.backend.entity.User;
import com.examify.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Seed Teacher Account
        if (userRepository.findByEmail("mahadev1@gmail.com").isEmpty()) {
            User teacher = new User();
            teacher.setName("Mahadev Teacher");
            teacher.setEmail("mahadev1@gmail.com");
            teacher.setPassword(passwordEncoder.encode("123456789"));
            teacher.setRole("TEACHER");
            teacher.setIsActive(true);
            teacher.setProfileCompleted(true);
            userRepository.save(teacher);
            System.out.println("✅ Seeded default Teacher account: mahadev1@gmail.com / 123456789");
        }

        // Seed Admin Account
        if (userRepository.findByEmail("admin@gmail.com").isEmpty()) {
            User admin = new User();
            admin.setName("Admin User");
            admin.setEmail("admin@gmail.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            admin.setIsActive(true);
            admin.setProfileCompleted(true);
            userRepository.save(admin);
            System.out.println("✅ Seeded default Admin account: admin@gmail.com / admin123");
        }

        // Seed Student Account
        if (userRepository.findByEmail("alice@example.com").isEmpty()) {
            User student = new User();
            student.setName("Alice Student");
            student.setEmail("alice@example.com");
            student.setPassword(passwordEncoder.encode("student123"));
            student.setRole("STUDENT");
            student.setRegisterNumber("REG2024001");
            student.setBranch("CSE");
            student.setYear(3);
            student.setSection("A");
            student.setIsActive(true);
            student.setProfileCompleted(true);
            userRepository.save(student);
            System.out.println("✅ Seeded default Student account: alice@example.com / student123");
        }
    }
}
