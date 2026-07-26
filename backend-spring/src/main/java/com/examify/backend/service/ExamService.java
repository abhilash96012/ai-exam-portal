package com.examify.backend.service;

import com.examify.backend.dto.ExamDto;
import com.examify.backend.entity.Exam;
import com.examify.backend.entity.User;
import com.examify.backend.repository.ExamRepository;
import com.examify.backend.repository.UserRepository;
import com.examify.backend.repository.ExamAttemptRepository;
import com.examify.backend.repository.QuestionRepository;
import com.examify.backend.repository.AnswerRepository;
import com.examify.backend.entity.ExamAttempt;
import com.examify.backend.entity.Question;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamRepository examRepository;
    private final UserRepository userRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;

    public List<Exam> getTeacherExams(String email) {
        User teacher = userRepository.findByEmail(email).orElseThrow();
        return examRepository.findByCreatedByOrderByCreatedAtDesc(teacher);
    }

    public Exam getExamById(Long examId) {
        return examRepository.findById(examId).orElseThrow();
    }

    @Transactional
    public Exam createExam(String email, ExamDto.CreateExamRequest request) {
        User teacher = userRepository.findByEmail(email).orElseThrow();
        Exam exam = new Exam();
        exam.setTitle(request.getTitle());
        exam.setDescription(request.getDescription());
        exam.setDuration(request.getDuration() != null ? request.getDuration() : 60);
        exam.setTotalMarks(request.getTotalMarks() != null ? request.getTotalMarks() : 100);
        exam.setBranch(request.getBranch());
        exam.setYear(request.getYear());
        exam.setSection(request.getSection());
        exam.setCollege(teacher.getCollege());
        exam.setCreatedBy(teacher);
        exam.setIsPublished(false);
        
        if (request.getStartTime() != null && !request.getStartTime().isEmpty()) {
            exam.setStartTime(LocalDateTime.parse(request.getStartTime()));
        }
        if (request.getEndTime() != null && !request.getEndTime().isEmpty()) {
            exam.setEndTime(LocalDateTime.parse(request.getEndTime()));
        }
        
        return examRepository.save(exam);
    }

    @Transactional
    public Exam updateExam(Long examId, ExamDto.UpdateExamRequest request) {
        Exam exam = examRepository.findById(examId).orElseThrow();
        if (request.getTitle() != null) exam.setTitle(request.getTitle());
        if (request.getDescription() != null) exam.setDescription(request.getDescription());
        if (request.getDuration() != null) exam.setDuration(request.getDuration());
        if (request.getTotalMarks() != null) exam.setTotalMarks(request.getTotalMarks());
        if (request.getBranch() != null) exam.setBranch(request.getBranch());
        if (request.getYear() != null) exam.setYear(request.getYear());
        if (request.getSection() != null) exam.setSection(request.getSection());
        if (request.getIsPublished() != null) exam.setIsPublished(request.getIsPublished());
        
        if (request.getStartTime() != null && !request.getStartTime().isEmpty()) {
            exam.setStartTime(LocalDateTime.parse(request.getStartTime()));
        }
        if (request.getEndTime() != null && !request.getEndTime().isEmpty()) {
            exam.setEndTime(LocalDateTime.parse(request.getEndTime()));
        }
        return examRepository.save(exam);
    }

    @Transactional
    public void deleteExam(Long examId) {
        // 1. Find all attempts for this exam
        List<ExamAttempt> attempts = examAttemptRepository.findByExamId(examId);
        
        // 2. Delete all answers for these attempts
        for (ExamAttempt attempt : attempts) {
            answerRepository.deleteAll(answerRepository.findByAttemptId(attempt.getId()));
        }
        
        // 3. Delete all attempts
        examAttemptRepository.deleteAll(attempts);
        
        // 4. Delete all questions for this exam
        List<Question> questions = questionRepository.findByExamId(examId);
        questionRepository.deleteAll(questions);
        
        // 5. Delete the exam itself
        examRepository.deleteById(examId);
    }

    @Transactional
    public Exam publishExam(Long examId) {
        Exam exam = examRepository.findById(examId).orElseThrow();
        exam.setIsPublished(true);
        return examRepository.save(exam);
    }
    
    @Transactional
    public void saveSyllabusText(Long examId, String text) {
        Exam exam = examRepository.findById(examId).orElseThrow();
        exam.setSyllabusText(text);
        examRepository.save(exam);
    }
    
    public Map<String, Object> getExamStatistics(Long examId) {
        Exam exam = examRepository.findById(examId).orElseThrow();
        long totalAttempts = examAttemptRepository.findByExamId(examId).size();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAttempts", totalAttempts);
        stats.put("averageScore", 0);
        stats.put("highestScore", 0);
        stats.put("lowestScore", 0);
        return stats;
    }
}
