package com.examify.backend.dto;

import com.examify.backend.entity.User;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private String role;
    private Long collegeId;
    private String branch;
    private String department;
    private Integer year;
    private String section;
    private String registerNumber;
    private Boolean profileCompleted;

    public UserDto(User user) {
        this.id = user.getId();
        this.name = user.getName();
        this.email = user.getEmail();
        this.role = user.getRole();
        this.collegeId = user.getCollege() != null ? user.getCollege().getId() : null;
        this.branch = user.getBranch();
        this.department = user.getDepartment() != null ? user.getDepartment() : user.getBranch();
        this.year = user.getYear();
        this.section = user.getSection();
        this.registerNumber = user.getRegisterNumber();
        this.profileCompleted = user.getProfileCompleted();
    }
}
