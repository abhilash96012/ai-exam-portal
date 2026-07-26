package com.examify.backend.service;

import com.examify.backend.dto.AttemptDto;
import com.examify.backend.entity.Answer;
import com.examify.backend.entity.Exam;
import com.examify.backend.entity.ExamAttempt;
import com.examify.backend.entity.Question;
import com.examify.backend.entity.User;
import com.examify.backend.exception.ApiException;
import com.examify.backend.repository.AnswerRepository;
import com.examify.backend.repository.ExamAttemptRepository;
import com.examify.backend.repository.ExamRepository;
import com.examify.backend.repository.QuestionRepository;
import com.examify.backend.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentAttemptService {

    private final ExamRepository examRepository;
    private final ExamAttemptRepository attemptRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final UserRepository userRepository;
    private final OllamaService ollamaService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<Map<String, Object>> getAvailableExams(String email) {
        User student = userRepository.findByEmail(email).orElseThrow();

        List<Exam> exams = examRepository.findByIsPublishedTrue();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Exam e : exams) {
            // Smart eligibility matching for branch, year, and section
            if (e.getBranch() != null && !e.getBranch().trim().isEmpty() &&
                student.getBranch() != null && !student.getBranch().trim().isEmpty() &&
                !e.getBranch().equalsIgnoreCase(student.getBranch())) {
                continue;
            }
            if (e.getYear() != null && e.getYear() != 0 &&
                student.getYear() != null && student.getYear() != 0 &&
                !e.getYear().equals(student.getYear())) {
                continue;
            }
            if (e.getSection() != null && !e.getSection().trim().isEmpty() &&
                student.getSection() != null && !student.getSection().trim().isEmpty() &&
                !e.getSection().equalsIgnoreCase(student.getSection())) {
                continue;
            }

            int totalQuestions = questionRepository.findByExamId(e.getId()).size();
            List<ExamAttempt> attempts = attemptRepository.findByExamIdAndStudentId(e.getId(), student.getId());
            String status = attempts.isEmpty() ? null : attempts.get(attempts.size() - 1).getStatus();

            Map<String, Object> map = new HashMap<>();
            map.put("id", e.getId());
            map.put("title", e.getTitle());
            map.put("description", e.getDescription());
            map.put("durationMinutes", e.getDuration());
            map.put("totalQuestions", totalQuestions);
            map.put("attemptStatus", status);
            result.add(map);
        }

        return result;
    }

    @Transactional
    public AttemptDto.StartExamResponse startExam(String email, Long examId) {
        User student = userRepository.findByEmail(email).orElseThrow();
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Exam not found"));

        if (!exam.getIsPublished()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Exam is not published");
        }

        LocalDateTime now = LocalDateTime.now();
        if (exam.getStartTime() != null && now.isBefore(exam.getStartTime())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Exam has not started yet");
        }
        if (exam.getEndTime() != null && now.isAfter(exam.getEndTime())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Exam has expired");
        }

        List<ExamAttempt> existingAttempts = attemptRepository.findByExamIdAndStudentId(examId, student.getId());
        if (existingAttempts != null && existingAttempts.stream().anyMatch(a -> "SUBMITTED".equals(a.getStatus()))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You have already submitted this exam.");
        }

        ExamAttempt attempt;
        Optional<ExamAttempt> startedOpt = existingAttempts != null ? existingAttempts.stream().filter(a -> "STARTED".equals(a.getStatus())).findFirst() : Optional.empty();
        if (startedOpt.isPresent()) {
            attempt = startedOpt.get();
        } else {
            attempt = new ExamAttempt();
            attempt.setExam(exam);
            attempt.setStudent(student);
            attempt.setStatus("STARTED");
            attempt.setStartTime(LocalDateTime.now());
            attempt = attemptRepository.save(attempt);
        }

        List<Question> questions = questionRepository.findByExamId(examId);
        List<AttemptDto.QuestionDto> questionDtos = questions.stream().map(q -> {
            List<String> options = new ArrayList<>();
            try {
                if (q.getOptions() != null && !q.getOptions().isEmpty()) {
                    options = objectMapper.readValue(q.getOptions(), new TypeReference<List<String>>() {});
                }
            } catch (Exception ignored) {}

            return AttemptDto.QuestionDto.builder()
                    .id(q.getId())
                    .exam_id(exam.getId())
                    .question_text(q.getQuestionText())
                    .question_type(q.getQuestionType() != null ? q.getQuestionType() : "MCQ")
                    .option_a(options.size() > 0 ? options.get(0) : "")
                    .option_b(options.size() > 1 ? options.get(1) : "")
                    .option_c(options.size() > 2 ? options.get(2) : "")
                    .option_d(options.size() > 3 ? options.get(3) : "")
                    .marks(q.getMarks())
                    .build();
        }).collect(Collectors.toList());

        Map<String, Object> examMap = new HashMap<>();
        examMap.put("id", exam.getId());
        examMap.put("title", exam.getTitle());
        examMap.put("durationMinutes", exam.getDuration());
        examMap.put("totalQuestions", questions.size());

        return AttemptDto.StartExamResponse.builder()
                .attempt(attempt)
                .exam(examMap)
                .questions(questionDtos)
                .build();
    }

    @Transactional
    public void saveAnswer(String email, Long attemptId, AttemptDto.SaveAnswerRequest request) {
        User student = userRepository.findByEmail(email).orElseThrow();
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Attempt not found"));

        if (!attempt.getStudent().getId().equals(student.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Unauthorized access to attempt");
        }

        Question question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Question not found"));

        Answer answer = answerRepository.findByAttemptIdAndQuestionId(attemptId, request.getQuestionId())
                .orElse(new Answer());

        answer.setAttempt(attempt);
        answer.setQuestion(question);
        answer.setSelectedOption(request.getSelectedOption());
        answer.setTextAnswer(request.getTextAnswer());

        answerRepository.save(answer);
    }

    @Transactional
    public Map<String, Object> submitExam(String email, Long attemptId, Integer tabSwitchCount) {
        User student = userRepository.findByEmail(email).orElseThrow();
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Attempt not found"));

        if (!attempt.getStudent().getId().equals(student.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Unauthorized");
        }
        if ("SUBMITTED".equals(attempt.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Exam already submitted");
        }

        List<Question> questions = questionRepository.findByExamId(attempt.getExam().getId());
        List<Answer> answers = answerRepository.findByAttemptId(attemptId);

        double score = 0.0;
        int maxScore = 0;

        for (Question q : questions) {
            maxScore += (q.getMarks() != null ? q.getMarks() : 1);
            Optional<Answer> ansOpt = answers.stream().filter(a -> a.getQuestion().getId().equals(q.getId())).findFirst();
            
            if (ansOpt.isPresent()) {
                Answer studentAns = ansOpt.get();
                boolean isMcq = q.getQuestionType() == null || q.getQuestionType().equals("MCQ");

                if (isMcq) {
                    boolean isCorrect = studentAns.getSelectedOption() != null && 
                            q.getCorrectOption() != null &&
                            studentAns.getSelectedOption().trim().equalsIgnoreCase(q.getCorrectOption().trim());
                    
                    if (isCorrect) {
                        int marks = q.getMarks() != null ? q.getMarks() : 1;
                        score += marks;
                        studentAns.setIsCorrect(true);
                        studentAns.setScore((double) marks);
                    } else {
                        studentAns.setIsCorrect(false);
                        studentAns.setScore(0.0);
                    }
                } else {
                    // Subjective evaluation using Ollama
                    try {
                        Map<String, Object> eval = ollamaService.evaluateSubjectiveAnswer(
                                q.getQuestionText(), q.getModelAnswer(), studentAns.getTextAnswer(), q.getMarks() != null ? q.getMarks() : 5);
                        
                        double awardedScore = Double.parseDouble(eval.get("score").toString());
                        score += awardedScore;
                        studentAns.setScore(awardedScore);
                        studentAns.setFeedback((String) eval.get("feedback"));
                    } catch (Exception e) {
                        studentAns.setScore(0.0);
                        studentAns.setFeedback("AI Grading failed: " + e.getMessage());
                    }
                }
                answerRepository.save(studentAns);
            }
        }

        attempt.setStatus("SUBMITTED");
        attempt.setScore(score);
        attempt.setMaxScore(maxScore);
        attempt.setTabSwitchCount(tabSwitchCount != null ? tabSwitchCount : 0);
        attempt.setEndTime(LocalDateTime.now());
        attemptRepository.save(attempt);

        return Map.of("score", score, "maxScore", maxScore);
    }

    public Map<String, Object> getAllStudentResults(String email) {
        User student = userRepository.findByEmail(email).orElseThrow();
        List<ExamAttempt> attempts = attemptRepository.findByStudentId(student.getId());

        List<Map<String, Object>> results = new ArrayList<>();
        for (ExamAttempt attempt : attempts) {
            if (!"SUBMITTED".equals(attempt.getStatus())) continue;

            Map<String, Object> map = new HashMap<>();
            map.put("attemptId", attempt.getId());
            map.put("examId", attempt.getExam().getId());
            map.put("examTitle", attempt.getExam().getTitle());
            map.put("branch", attempt.getExam().getBranch() != null ? attempt.getExam().getBranch() : "");
            map.put("year", attempt.getExam().getYear() != null ? attempt.getExam().getYear() : 0);
            
            double score = attempt.getScore() != null ? attempt.getScore() : 0.0;
            int maxScore = attempt.getMaxScore() != null ? attempt.getMaxScore() : 0;
            
            map.put("score", score);
            map.put("totalMarks", maxScore);
            map.put("percentage", maxScore > 0 ? (score / maxScore) * 100 : 0);
            map.put("passed", maxScore > 0 && (score / maxScore) >= 0.5);
            map.put("submittedAt", attempt.getEndTime() != null ? attempt.getEndTime().toString() : "");

            results.add(map);
        }

        return Map.of("results", results);
    }

    public Map<String, Object> getResultDetails(String email, Long attemptId) {
        User student = userRepository.findByEmail(email).orElseThrow();
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Attempt not found"));

        if (!attempt.getStudent().getId().equals(student.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Unauthorized");
        }

        return buildResultMap(attempt);
    }

    public Map<String, Object> getResultDetailsByExam(String email, Long examId) {
        User student = userRepository.findByEmail(email).orElseThrow();
        List<ExamAttempt> attempts = attemptRepository.findByExamIdAndStudentId(examId, student.getId());
        if (attempts == null || attempts.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "No attempt found for this exam");
        }
        ExamAttempt attempt = attempts.get(attempts.size() - 1);
        return buildResultMap(attempt);
    }

    private Map<String, Object> buildResultMap(ExamAttempt attempt) {
        Map<String, Object> result = new HashMap<>();
        result.put("attemptId", attempt.getId());
        result.put("score", attempt.getScore() != null ? attempt.getScore() : 0.0);
        result.put("totalMarks", attempt.getMaxScore() != null ? attempt.getMaxScore() : 0);
        
        double score = attempt.getScore() != null ? attempt.getScore() : 0.0;
        int maxScore = attempt.getMaxScore() != null ? attempt.getMaxScore() : 0;
        
        result.put("percentage", maxScore > 0 ? (score / maxScore) * 100 : 0);
        result.put("passed", maxScore > 0 && (score / maxScore) >= 0.5);

        List<Answer> answersList = answerRepository.findByAttemptId(attempt.getId());
        List<Map<String, Object>> answers = new ArrayList<>();
        
        for (Answer ans : answersList) {
            Question q = ans.getQuestion();
            Map<String, Object> aMap = new HashMap<>();
            aMap.put("id", q.getId());
            aMap.put("questionText", q.getQuestionText());
            aMap.put("questionType", q.getQuestionType());
            try {
                if (q.getOptions() != null && !q.getOptions().isEmpty()) {
                    aMap.put("options", objectMapper.readValue(q.getOptions(), new TypeReference<List<String>>() {}));
                } else {
                    aMap.put("options", new ArrayList<>());
                }
            } catch(Exception e) {
                aMap.put("options", new ArrayList<>());
            }
            aMap.put("selectedOption", ans.getSelectedOption());
            aMap.put("textAnswer", ans.getTextAnswer());
            aMap.put("correctOption", q.getCorrectOption());
            aMap.put("isCorrect", ans.getIsCorrect());
            aMap.put("modelAnswer", q.getModelAnswer());
            aMap.put("score", ans.getScore());
            aMap.put("maxScore", q.getMarks());
            aMap.put("feedback", ans.getFeedback());
            answers.add(aMap);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("result", result);
        response.put("answers", answers);
        response.put("attemptId", attempt.getId());
        return response;
    }
}
