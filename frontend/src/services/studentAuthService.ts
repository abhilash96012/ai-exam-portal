/**
 * Student Authentication Service
 * Handles student registration with OTP verification
 */

import api from './api';

interface SendOTPResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
    expiresIn: number;
  };
}

interface VerifyOTPResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      branch?: string | null;
      year?: number | null;
      registerNumber?: string | null;
      profileCompleted?: boolean;
    };
  };
}

interface ResendOTPResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
    expiresIn: number;
  };
}

interface ForgotPasswordSendOTPResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
    expiresIn: number;
  };
}

interface ForgotPasswordVerifyResponse {
  success: boolean;
  message: string;
  data?: Record<string, never>;
}

const studentAuthService = {
  /**
   * Send OTP to student email
   */
  async sendOTP(email: string): Promise<SendOTPResponse> {
    try {
      const response = await api.post('/auth/student/send-otp', { email });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to send OTP. Please try again.'
      );
    }
  },

  /**
   * Verify OTP and register student account
   */
  async verifyOTPAndRegister(
    email: string,
    otp: string,
    password: string,
    confirmPassword: string,
    name: string
  ): Promise<VerifyOTPResponse> {
    try {
      const response = await api.post('/auth/student/verify-otp-and-register', {
        email,
        otp,
        password,
        confirmPassword,
        name,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to verify OTP. Please try again.'
      );
    }
  },

  /**
   * Resend OTP to student email
   */
  async resendOTP(email: string): Promise<ResendOTPResponse> {
    try {
      const response = await api.post('/auth/student/resend-otp', { email });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to resend OTP. Please try again.'
      );
    }
  },

  /**
   * Send OTP for forgot password
   */
  async sendForgotPasswordOTP(email: string): Promise<ForgotPasswordSendOTPResponse> {
    try {
      const response = await api.post('/auth/student/forgot-password/send-otp', { email });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to send OTP. Please try again.'
      );
    }
  },

  /**
   * Verify OTP and reset student password
   */
  async verifyForgotPasswordOTPAndReset(
    email: string,
    otp: string,
    password: string,
    confirmPassword: string,
  ): Promise<ForgotPasswordVerifyResponse> {
    try {
      const response = await api.post('/auth/student/forgot-password/verify-otp-and-reset', {
        email,
        otp,
        password,
        confirmPassword,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to reset password. Please try again.'
      );
    }
  },

  /**
   * Resend forgot-password OTP
   */
  async resendForgotPasswordOTP(email: string): Promise<ForgotPasswordSendOTPResponse> {
    try {
      const response = await api.post('/auth/student/forgot-password/resend-otp', { email });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to resend OTP. Please try again.'
      );
    }
  },
};

export default studentAuthService;
