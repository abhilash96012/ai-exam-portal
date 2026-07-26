package com.examify.backend.service;

import com.examify.backend.dto.ExamDto;
import com.examify.backend.entity.College;
import com.examify.backend.entity.Exam;
import com.examify.backend.entity.Question;
import com.examify.backend.entity.User;
import com.examify.backend.entity.ExamAttempt;
import com.examify.backend.repository.ExamRepository;
import com.examify.backend.repository.QuestionRepository;
import com.examify.backend.repository.UserRepository;
import com.examify.backend.repository.ExamAttemptRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeacherExamService {

    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public Long publishGeneratedExam(String email, ExamDto.PublishGeneratedExamRequest request) throws JsonProcessingException {
        User teacher = userRepository.findByEmail(email).orElseThrow();
        College college = teacher.getCollege();

        Exam exam = new Exam();
        exam.setTitle(request.getExamName());
        exam.setDescription(request.getDescription());
        exam.setDuration(request.getDuration() != null ? request.getDuration() : 60);
        exam.setTotalMarks(request.getTotalMarks() != null ? request.getTotalMarks() : 100);
        exam.setBranch(request.getDepartment());
        if (request.getYear() != null && !request.getYear().isEmpty()) {
            try {
                exam.setYear(Integer.parseInt(request.getYear()));
            } catch (NumberFormatException ignored) {}
        }
        exam.setSection(request.getSection());
        exam.setCollege(college);
        exam.setCreatedBy(teacher);
        exam.setIsPublished(true);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        if (request.getStartDate() != null && !request.getStartDate().isEmpty()) {
            String time = request.getStartTime() != null && !request.getStartTime().isEmpty() ? request.getStartTime() : "00:00";
            if (time.length() == 5) time += ":00";
            exam.setStartTime(LocalDateTime.parse(request.getStartDate() + " " + time, formatter));
        }
        if (request.getEndDate() != null && !request.getEndDate().isEmpty()) {
            String time = request.getEndTime() != null && !request.getEndTime().isEmpty() ? request.getEndTime() : "23:59";
            if (time.length() == 5) time += ":00";
            exam.setEndTime(LocalDateTime.parse(request.getEndDate() + " " + time, formatter));
        }

        Exam savedExam = examRepository.save(exam);

        List<ExamDto.QuestionInput> questions = request.getQuestions();
        int marksPerQuestion = (questions != null && !questions.isEmpty()) ? (exam.getTotalMarks() / questions.size()) : 1;

        if (questions != null) {
            for (ExamDto.QuestionInput qInput : questions) {
                Question q = new Question();
                q.setExam(savedExam);
                q.setQuestionText(qInput.getQuestion());
                q.setDifficulty(qInput.getDifficulty());

                boolean isSubjective = (qInput.getOptions() == null || qInput.getOptions().isEmpty());
                q.setQuestionType(isSubjective ? "SUBJECTIVE" : "MCQ");
                q.setMarks(marksPerQuestion);

                if (!isSubjective) {
                    q.setOptions(objectMapper.writeValueAsString(qInput.getOptions()));
                    if (qInput.getCorrectAnswer() != null) {
                        q.setCorrectOption(String.valueOf((char)('A' + qInput.getCorrectAnswer())));
                    } else {
                        q.setCorrectOption("A");
                    }
                } else {
                    q.setModelAnswer(qInput.getModelAnswer() != null ? qInput.getModelAnswer() : "Expected answer provided by teacher");
                }
                questionRepository.save(q);
            }
        }

        return savedExam.getId();
    }

    public List<Map<String, Object>> getTeacherResultsSummary(String email) {
        User teacher = userRepository.findByEmail(email).orElseThrow();
        List<Exam> exams = examRepository.findByCreatedById(teacher.getId());
        List<Map<String, Object>> summary = new ArrayList<>();
        for (Exam e : exams) {
            Map<String, Object> map = new HashMap<>();
            map.put("examId", e.getId()); // frontend expects examId
            map.put("title", e.getTitle());
            map.put("createdAt", e.getCreatedAt() != null ? e.getCreatedAt().toString() : "");
            map.put("branch", e.getBranch());
            map.put("year", e.getYear());

            List<ExamAttempt> attempts = examAttemptRepository.findByExamId(e.getId());
            int totalAttempts = attempts.size();
            int completedAttempts = 0;
            double totalScore = 0.0;
            int passedCount = 0;

            for (ExamAttempt attempt : attempts) {
                if ("SUBMITTED".equals(attempt.getStatus())) {
                    completedAttempts++;
                    double score = attempt.getScore() != null ? attempt.getScore() : 0.0;
                    totalScore += score;
                    int maxScore = attempt.getMaxScore() != null ? attempt.getMaxScore() : 0;
                    if (maxScore > 0 && (score / maxScore) >= 0.5) {
                        passedCount++;
                    }
                }
            }

            map.put("totalAttempts", totalAttempts);
            map.put("completedAttempts", completedAttempts);
            map.put("averageScore", completedAttempts > 0 ? totalScore / completedAttempts : 0.0);
            map.put("passedCount", passedCount);
            map.put("status", e.getIsPublished() ? "Published" : "Draft");

            summary.add(map);
        }
        return summary;
    }

    public Map<String, Object> getTeacherExamResults(String email, Long examId) {
        User teacher = userRepository.findByEmail(email).orElseThrow();
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));

        if (!exam.getCreatedBy().getId().equals(teacher.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        List<ExamAttempt> attempts = examAttemptRepository.findByExamId(examId);
        
        int totalAttempts = 0;
        int passedCount = 0;
        double averageScore = 0.0;
        double totalScore = 0.0;
        int averagePercentage = 0;
        int maxMarks = 0;
        
        List<Map<String, Object>> results = new ArrayList<>();
        for (ExamAttempt attempt : attempts) {
            if (!"SUBMITTED".equals(attempt.getStatus())) continue;
            totalAttempts++;
            
            double score = attempt.getScore() != null ? attempt.getScore() : 0.0;
            int attemptMax = attempt.getMaxScore() != null ? attempt.getMaxScore() : 0;
            maxMarks = attemptMax;
            
            totalScore += score;
            if (attemptMax > 0 && (score / attemptMax) >= 0.5) {
                passedCount++;
            }
            
            Map<String, Object> row = new HashMap<>();
            row.put("attemptId", attempt.getId());
            row.put("studentId", attempt.getStudent().getId());
            row.put("studentName", attempt.getStudent().getName());
            row.put("registerNumber", attempt.getStudent().getRegisterNumber());
            row.put("submittedAt", attempt.getEndTime() != null ? attempt.getEndTime().toString() : "");
            row.put("score", score);
            row.put("totalMarks", attemptMax);
            
            results.add(row);
        }
        
        if (totalAttempts > 0) {
            averageScore = totalScore / totalAttempts;
            if (maxMarks > 0) {
                averagePercentage = (int)((averageScore / maxMarks) * 100);
            }
        }
        
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("totalAttempts", totalAttempts);
        statistics.put("averageScore", averageScore);
        statistics.put("averagePercentage", averagePercentage);
        statistics.put("passedCount", passedCount);
        
        Map<String, Object> examInfo = new HashMap<>();
        examInfo.put("title", exam.getTitle());
        examInfo.put("totalMarks", maxMarks);
        
        Map<String, Object> response = new HashMap<>();
        response.put("exam", examInfo);
        response.put("statistics", statistics);
        response.put("results", results);
        
        return response;
    }
}
