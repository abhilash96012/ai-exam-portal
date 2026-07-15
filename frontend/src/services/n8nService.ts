/**
 * N8N Webhook Service
 * Handles communication with n8n webhooks for syllabus management and question answering
 */


interface SyllabusUploadPayload {
  type: 'admin';
  syllabusId: string;
  branch: string;
  department: string;
  year: string;
  subject: string;
  unit?: string;
  syllabusText: string;
}

interface TeacherQuestionPayload {
  type: 'teacher';
  department: string;
  year: string;
  subject: string;
  chatInput: string;
}

interface TeacherQuestionResponse {
  answer: string;
}

/**
 * Get n8n webhook URL from backend config
 */
const getWebhookUrl = async (webhookType: 'syllabus' | 'question'): Promise<string> => {
  try {
    const n8nUrl =
      import.meta.env.VITE_N8N_WEBHOOK_BASE || 'http://localhost:5678/webhook';
    const syllabusPath =
      import.meta.env.VITE_N8N_SYLLABUS_WEBHOOK_PATH || 'upload-syllabus';
    const teacherPath =
      import.meta.env.VITE_N8N_TEACHER_WEBHOOK_PATH || 'teacher-question';

    const selectedPath = webhookType === 'syllabus' ? syllabusPath : teacherPath;
    const normalizedBase = String(n8nUrl).replace(/\/+$/, '');
    const normalizedPath = String(selectedPath).replace(/^\/+/, '');

    return `${normalizedBase}/${normalizedPath}`;
  } catch {
    throw new Error('Unable to retrieve webhook configuration');
  }
};

/**
 * Upload syllabus to n8n for processing
 * Extracts text from file and sends to n8n webhook
 * @param payload - Syllabus upload data with extracted text
 * @returns Webhook response
 */
export const uploadSyllabusToN8N = async (payload: SyllabusUploadPayload) => {
  try {
    const webhookUrl = await getWebhookUrl('syllabus');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `n8n webhook error: ${response.statusText}`
      );
    }

    const data = await response.json();
    return {
      success: true,
      data,
      message: 'Syllabus uploaded successfully',
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to upload syllabus to n8n';
    throw new Error(message);
  }
};

/**
 * Send teacher question to n8n for processing
 * Searches syllabus content and generates answer
 * @param payload - Teacher question data
 * @returns Answer from n8n
 */
export const askTeacherQuestion = async (
  payload: TeacherQuestionPayload
): Promise<TeacherQuestionResponse> => {
  try {
    const webhookUrl = await getWebhookUrl('question');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `n8n webhook error: ${response.statusText}`
      );
    }

    const data = await response.json();
    return {
      answer:
        data.answer ||
        'No answer generated. Please try rephrasing your question.',
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to get answer from n8n';
    throw new Error(message);
  }
};

/**
 * Check if n8n webhook is available
 */
export const checkN8NAvailability = async (): Promise<boolean> => {
  try {
    const webhookUrl = await getWebhookUrl('syllabus');
    const response = await fetch(webhookUrl, {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok || response.status === 404; // 404 is ok for webhook
  } catch {
    return false;
  }
};

export default {
  uploadSyllabusToN8N,
  askTeacherQuestion,
  checkN8NAvailability,
};
