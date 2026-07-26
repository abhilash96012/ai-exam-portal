package com.examify.backend.service;

import com.examify.backend.dto.TeacherDto.GeneratedQuestion;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class OllamaService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String OLLAMA_URL = "http://localhost:11434/api/generate";
    private final String OLLAMA_MODEL = "llama3:latest"; // Or configured from properties

    public List<GeneratedQuestion> generateQuestions(String syllabusContent, int count, String subject, String defaultDifficulty, String questionType, String customPrompt) {
        List<GeneratedQuestion> allQuestions = new ArrayList<>();
        
        Map<String, Integer> difficultyCounts = extractDifficultyCounts(customPrompt);
        
        if (!difficultyCounts.isEmpty()) {
            int explicitCount = 0;
            for (Map.Entry<String, Integer> entry : difficultyCounts.entrySet()) {
                String diff = entry.getKey();
                int needed = entry.getValue();
                allQuestions.addAll(generateBatch(syllabusContent, needed, subject, diff, questionType, customPrompt));
                explicitCount += needed;
            }
            
            int remaining = count - explicitCount;
            if (remaining > 0) {
                 allQuestions.addAll(generateBatch(syllabusContent, remaining, subject, defaultDifficulty, questionType, customPrompt));
            }
        } else {
            allQuestions.addAll(generateBatch(syllabusContent, count, subject, defaultDifficulty, questionType, customPrompt));
        }
        
        if (allQuestions.size() > count) {
            return allQuestions.subList(0, count);
        }
        return allQuestions;
    }

    private List<GeneratedQuestion> generateBatch(String syllabusContent, int count, String subject, String difficulty, String questionType, String customPrompt) {
        if (count <= 0) return new ArrayList<>();
        
        List<GeneratedQuestion> allQuestions = new ArrayList<>();
        int attempts = 0;
        int maxAttempts = 3;

        while (allQuestions.size() < count && attempts < maxAttempts) {
            int needed = count - allQuestions.size();
            String prompt = buildPrompt(syllabusContent, needed, subject, difficulty, questionType, customPrompt);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", OLLAMA_MODEL);
            requestBody.put("prompt", prompt);
            requestBody.put("stream", false);
            requestBody.put("format", "json");

            Map<String, Object> options = new HashMap<>();
            options.put("temperature", 0.3);
            options.put("num_predict", -1);
            requestBody.put("options", options);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            try {
                ResponseEntity<String> response = restTemplate.postForEntity(OLLAMA_URL, entity, String.class);
                JsonNode root = objectMapper.readTree(response.getBody());
                String responseText = root.path("response").asText();
                
                List<GeneratedQuestion> batch = parseQuestions(responseText, questionType);
                if (batch.isEmpty()) break;
                
                // Force difficulty to match the requested batch difficulty
                for (GeneratedQuestion q : batch) {
                    q.setDifficulty(difficulty);
                }
                
                allQuestions.addAll(batch);
            } catch (Exception e) {
                if (allQuestions.isEmpty()) {
                    throw new RuntimeException("Failed to generate questions via Ollama: " + e.getMessage(), e);
                } else {
                    break;
                }
            }
            attempts++;
        }
        return allQuestions;
    }

    private Map<String, Integer> extractDifficultyCounts(String customPrompt) {
        Map<String, Integer> counts = new HashMap<>();
        if (customPrompt == null || customPrompt.trim().isEmpty()) {
            return counts;
        }
        
        String lower = customPrompt.toLowerCase();
        int easy = extractCount(lower, "easy");
        int medium = extractCount(lower, "medium");
        int hard = extractCount(lower, "hard", "difficult");
        
        if (easy > 0) counts.put("Easy", easy);
        if (medium > 0) counts.put("Medium", medium);
        if (hard > 0) counts.put("Hard", hard);
        
        return counts;
    }
    
    private int extractCount(String text, String... keywords) {
        for (String kw : keywords) {
            Matcher m = Pattern.compile("(\\d+)\\s+" + kw).matcher(text);
            if (m.find()) {
                return Integer.parseInt(m.group(1));
            }
        }
        return 0;
    }

    private String buildPrompt(String syllabusContent, int count, String subject, String difficulty, String questionType, String customPrompt) {
        StringBuilder sb = new StringBuilder();
        
        sb.append("You are an expert AI teacher. You must generate EXACTLY ").append(count)
          .append(" ").append(difficulty).append(" ").append(questionType)
          .append(" questions.\n\n");
          
        if (customPrompt != null && !customPrompt.trim().isEmpty()) {
            sb.append("Additional Instructions from teacher:\n");
            sb.append(customPrompt).append("\n\n");
            sb.append("CRITICAL REQUIREMENT: Focus on generating EXACTLY ").append(count)
              .append(" ").append(difficulty).append(" questions regardless of the teacher's instructions above. DO NOT stop generating until you have reached exactly ").append(count).append(" questions!\n\n");
        }
        
        sb.append("Text:\n").append(syllabusContent).append("\n\n");

        sb.append("CRITICAL REQUIREMENT:\n");
        if ("SUBJECTIVE".equalsIgnoreCase(questionType)) {
            sb.append("You are an expert exam question creator.\n");
            sb.append("IMPORTANT: Return ONLY a valid JSON array. Do not include any text before or after the JSON.\n");
            sb.append("Each question object must have this exact structure:\n");
            sb.append("{\n");
            sb.append("  \"question_text\": \"The question text here?\",\n");
            sb.append("  \"difficulty\": \"Easy\",\n");
            sb.append("  \"model_answer\": \"A detailed model answer or grading rubric that explains what a correct student response should contain.\"\n");
            sb.append("}");
        } else {
            sb.append("You are an expert exam question creator.\n");
            sb.append("CRITICAL INSTRUCTION: You MUST return ONLY a valid JSON object containing a 'questions' array. DO NOT output any introduction, explanation, or conversational text. Start your response with { and end with }.\n");
            sb.append("WARNING: You MUST assign each option to the specific JSON keys \"option_a\", \"option_b\", \"option_c\", and \"option_d\". Do NOT output raw strings like \"A. Option\" inside the object!\n");
            sb.append("The JSON MUST exactly match this format:\n");
            sb.append("{\n");
            sb.append("  \"questions\": [\n");
            sb.append("    {\n");
            sb.append("      \"question_text\": \"What is the capital of France?\",\n");
            sb.append("      \"difficulty\": \"Easy\",\n");
            sb.append("      \"option_a\": \"Berlin\",\n");
            sb.append("      \"option_b\": \"Madrid\",\n");
            sb.append("      \"option_c\": \"Paris\",\n");
            sb.append("      \"option_d\": \"Rome\",\n");
            sb.append("      \"correct_option\": \"C\"\n");
            sb.append("    }\n");
            sb.append("  ]\n");
            sb.append("}");
        }
        
        return sb.toString();
    }

    private List<GeneratedQuestion> parseQuestions(String responseText, String questionType) throws JsonProcessingException {
        List<GeneratedQuestion> result = new ArrayList<>();
        System.out.println("Ollama Response: " + responseText);
        
        JsonNode root;
        try {
            root = objectMapper.readTree(responseText);
        } catch (Exception e) {
            // fallback: try to find JSON object in text
            Matcher objMatcher = Pattern.compile("\\{[\\s\\S]*\\}").matcher(responseText);
            if (objMatcher.find()) {
                root = objectMapper.readTree(objMatcher.group());
            } else {
                return result;
            }
        }

        JsonNode arrayNode = root;
        if (root.isObject() && root.has("questions")) {
            arrayNode = root.get("questions");
        } else if (root.isObject() && !root.has("questions")) {
            // single question
            arrayNode = objectMapper.createArrayNode().add(root);
        }

        if (!arrayNode.isArray()) {
            return result;
        }

        for (JsonNode qNode : arrayNode) {
            GeneratedQuestion q = new GeneratedQuestion();
            if ("SUBJECTIVE".equalsIgnoreCase(questionType)) {
                q.setQuestion(qNode.path("question_text").asText(qNode.path("question").asText()));
                q.setModelAnswer(qNode.path("model_answer").asText());
                q.setDifficulty(qNode.path("difficulty").asText("Medium"));
                q.setQuestionType("SUBJECTIVE");
                q.setMarks(5);
            } else {
                q.setQuestion(qNode.path("question_text").asText(qNode.path("question").asText()));
                q.setDifficulty(qNode.path("difficulty").asText("Medium"));
                List<String> options = new ArrayList<>();
                options.add(qNode.path("option_a").asText(qNode.path("a").asText()));
                options.add(qNode.path("option_b").asText(qNode.path("b").asText()));
                options.add(qNode.path("option_c").asText(qNode.path("c").asText()));
                options.add(qNode.path("option_d").asText(qNode.path("d").asText()));
                q.setOptions(options);
                
                String correctStr = qNode.path("correct_option").asText(qNode.path("correctAnswer").asText("A")).toUpperCase();
                int correctIndex = 0;
                if (correctStr.contains("B")) correctIndex = 1;
                else if (correctStr.contains("C")) correctIndex = 2;
                else if (correctStr.contains("D")) correctIndex = 3;
                
                q.setCorrectAnswer(correctIndex);
                q.setQuestionType("MCQ");
                q.setMarks(1);
            }
            result.add(q);
        }
        
        return result;
    }

    public Map<String, Object> evaluateSubjectiveAnswer(String question, String modelAnswer, String studentAnswer, int maxMarks) {
        String prompt = "You are an expert teacher grading an exam.\n" +
                "You must grade the student's answer to the following question.\n\n" +
                "QUESTION: " + question + "\n" +
                "MODEL ANSWER (Expected Points): " + modelAnswer + "\n" +
                "STUDENT ANSWER: " + (studentAnswer != null && !studentAnswer.isEmpty() ? studentAnswer : "(No answer provided)") + "\n\n" +
                "You must assign a score from 0 to " + maxMarks + " (integers or half marks). \n" +
                "Also provide brief, constructive feedback on why this score was awarded.\n\n" +
                "IMPORTANT: Return ONLY a valid JSON object. Do not include any text before or after the JSON.\n" +
                "{\n" +
                "  \"score\": <number>,\n" +
                "  \"feedback\": \"<string>\"\n" +
                "}\n";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", OLLAMA_MODEL);
        requestBody.put("prompt", prompt);
        requestBody.put("stream", false);
        requestBody.put("format", "json");

        Map<String, Object> options = new HashMap<>();
        options.put("temperature", 0.1); // Low temp for consistent grading
        requestBody.put("options", options);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(OLLAMA_URL, entity, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            String responseText = root.path("response").asText();
            
            Matcher matcher = Pattern.compile("\\{[\\s\\S]*\\}").matcher(responseText);
            if (matcher.find()) {
                JsonNode evalNode = objectMapper.readTree(matcher.group());
                Map<String, Object> result = new HashMap<>();
                result.put("score", evalNode.path("score").asInt(0));
                result.put("feedback", evalNode.path("feedback").asText("Graded by AI."));
                return result;
            }
        } catch (Exception e) {
            System.err.println("AI grading failed: " + e.getMessage());
        }

        Map<String, Object> fallback = new HashMap<>();
        fallback.put("score", 0);
        fallback.put("feedback", "AI grading failed. Please review manually.");
        return fallback;
    }
}
