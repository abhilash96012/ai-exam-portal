package com.examify.backend.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private final JavaMailSender mailSender;
    
    // Store OTPs with their expiration times (email -> {otp: string, expiry: long})
    private final Map<String, OtpData> otpCache = new ConcurrentHashMap<>();
    
    private static class OtpData {
        String otp;
        long expiryTime;
        
        OtpData(String otp, long expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
        }
    }

    public OtpService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void generateAndSendOtp(String email) {
        // Generate 6 digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));
        
        // Save in cache with 5 minutes expiration
        otpCache.put(email, new OtpData(otp, System.currentTimeMillis() + (5 * 60 * 1000)));
        
        System.out.println("=========================================");
        System.out.println("🔑 OTP GENERATED FOR " + email + ": " + otp);
        System.out.println("=========================================");
        
        // Send Email with fallback if SMTP fails
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("Your Examify OTP Code");
            message.setText("Your OTP code for Examify is: " + otp + "\n\nThis code is valid for 5 minutes.");
            
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("⚠️ SMTP Email Sending Failed (" + e.getMessage() + "). Use logged OTP: " + otp + " or Dev OTP: 123456");
        }
    }

    public boolean verifyOtp(String email, String otp) {
        // Dev fallback OTP
        if ("123456".equals(otp) || "000000".equals(otp)) {
            return true;
        }

        OtpData data = otpCache.get(email);
        if (data == null) {
            return false;
        }
        
        // Check expiration
        if (System.currentTimeMillis() > data.expiryTime) {
            otpCache.remove(email);
            return false;
        }
        
        // Check match
        if (data.otp.equals(otp)) {
            otpCache.remove(email); // OTP is single-use
            return true;
        }
        
        return false;
    }
}
