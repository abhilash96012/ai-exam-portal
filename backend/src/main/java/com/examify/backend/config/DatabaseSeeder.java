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
    private final com.examify.backend.repository.CollegeRepository collegeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Seed Default College
        if (collegeRepository.count() == 0) {
            com.examify.backend.entity.College college = new com.examify.backend.entity.College();
            college.setName("Main University Campus");
            college.setDomain("university.edu");
            collegeRepository.save(college);
            System.out.println("✅ Seeded default College: Main University Campus");
        }
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

        // Seed Student Account (alice@gmail.com and alice@example.com)
        if (userRepository.findByEmail("alice@gmail.com").isEmpty()) {
            User student1 = new User();
            student1.setName("Alice Student");
            student1.setEmail("alice@gmail.com");
            student1.setPassword(passwordEncoder.encode("student123"));
            student1.setRole("STUDENT");
            student1.setRegisterNumber("REG2024001");
            student1.setBranch("CSE");
            student1.setYear(3);
            student1.setSection("A");
            student1.setIsActive(true);
            student1.setProfileCompleted(true);
            userRepository.save(student1);
            System.out.println("✅ Seeded default Student account: alice@gmail.com / student123");
        }

        if (userRepository.findByEmail("alice@example.com").isEmpty()) {
            User student2 = new User();
            student2.setName("Alice Student");
            student2.setEmail("alice@example.com");
            student2.setPassword(passwordEncoder.encode("student123"));
            student2.setRole("STUDENT");
            student2.setRegisterNumber("REG2024002");
            student2.setBranch("CSE");
            student2.setYear(3);
            student2.setSection("A");
            student2.setIsActive(true);
            student2.setProfileCompleted(true);
            userRepository.save(student2);
            System.out.println("✅ Seeded default Student account: alice@example.com / student123");
        }
    }
}
