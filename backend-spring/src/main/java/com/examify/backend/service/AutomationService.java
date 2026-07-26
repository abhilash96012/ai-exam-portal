package com.examify.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class AutomationService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.n8n.webhook-url:http://localhost:5678/webhook/upload-syllabus}")
    private String webhookUrl;

    public void triggerN8nWebhook(Map<String, Object> payloadData, String type) {
        if (webhookUrl == null || webhookUrl.isEmpty()) {
            System.err.println("Webhook URL not configured");
            return;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("timestamp", Instant.now().toString());
        payload.put("type", type);
        payload.put("data", payloadData);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        try {
            restTemplate.postForEntity(webhookUrl, entity, String.class);
            System.out.println("n8n webhook triggered successfully for type: " + type);
        } catch (Exception e) {
            System.err.println("Failed to trigger n8n webhook: " + e.getMessage());
            // We don't throw an exception to prevent breaking the main flow
        }
    }
}
