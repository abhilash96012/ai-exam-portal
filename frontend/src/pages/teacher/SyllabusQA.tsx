/**
 * Teacher Syllabus Q&A Page
 * Allows teachers to ask questions about syllabus content
 * Powered by n8n and PGVector search
 */

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Loader, AlertCircle } from "lucide-react";
import n8nService from "../../services/n8nService";

interface QAMessage {
  id: string;
  type: "question" | "answer";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface FormState {
  department: string;
  year: string;
  subject: string;
  chatInput: string;
}

const initialFormState: FormState = {
  department: "",
  year: "",
  subject: "",
  chatInput: "",
};

// Sample options - these could be fetched from backend
const departmentOptions = [
  "CSE",
  "AIML",
  "IT",
  "CSD",
  "AIDS",
  "CSIT",
  "Mechanical",
  "Civil",
];

const yearOptions = [
  { label: "First Year", value: "1-1" },
  { label: "First Year (II)", value: "1-2" },
  { label: "Second Year", value: "2-1" },
  { label: "Second Year (II)", value: "2-2" },
  { label: "Third Year", value: "3-1" },
  { label: "Third Year (II)", value: "3-2" },
  { label: "Final Year", value: "4-1" },
  { label: "Final Year (II)", value: "4-2" },
];

const SyllabusQA: React.FC = () => {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formState.department ||
      !formState.year ||
      !formState.subject ||
      !formState.chatInput.trim()
    ) {
      setError("Please fill all fields and enter a question");
      return;
    }

    setError(null);

    // Add question to messages
    const questionId = `msg-${Date.now()}`;
    const questionMessage: QAMessage = {
      id: questionId,
      type: "question",
      content: formState.chatInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, questionMessage]);
    setFormState((prev) => ({ ...prev, chatInput: "" }));
    setIsLoading(true);

    try {
      // Send question to n8n
      const response = await n8nService.askTeacherQuestion({
        type: "teacher",
        department: formState.department,
        year: formState.year,
        subject: formState.subject,
        chatInput: formState.chatInput,
      });

      // Add answer to messages
      const answerId = `msg-${Date.now()}-answer`;
      const answerMessage: QAMessage = {
        id: answerId,
        type: "answer",
        content: response.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, answerMessage]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get answer";
      setError(errorMessage);

      // Add error message to chat
      const errorId = `msg-${Date.now()}-error`;
      const errorMsg: QAMessage = {
        id: errorId,
        type: "answer",
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setError(null);
    setFormState(initialFormState);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Syllabus Q&A
            </h1>
          </div>
          <p className="text-slate-600">
            Ask questions about syllabus content using AI-powered search
          </p>
        </div>

        {/* Main Container */}
        <div className="rounded-2xl border border-blue-100/80 bg-white shadow-xl overflow-hidden">
          {/* Configuration Section */}
          <div className="border-b border-blue-50 bg-gradient-to-r from-blue-50 to-white p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Select Syllabus
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="text-sm font-medium text-slate-700">
                Department
                <select
                  name="department"
                  value={formState.department}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                >
                  <option value="">Select department</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Year
                <select
                  name="year"
                  value={formState.year}
                  onChange={handleInputChange}
                  className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                >
                  <option value="">Select year</option>
                  {yearOptions.map((yearOpt) => (
                    <option key={yearOpt.value} value={yearOpt.value}>
                      {yearOpt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Subject
                <input
                  type="text"
                  name="subject"
                  value={formState.subject}
                  onChange={handleInputChange}
                  placeholder="e.g., Operating Systems"
                  className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </label>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex flex-col h-[500px] bg-white">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 text-blue-200 mx-auto mb-3" />
                    <p className="text-slate-500">
                      Select a syllabus and ask your first question
                    </p>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === "question"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-3 max-w-xs sm:max-w-md lg:max-w-lg break-words ${
                      message.type === "question"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-900 border border-slate-200"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p
                      className={`text-xs mt-2 ${
                        message.type === "question"
                          ? "text-blue-100"
                          : "text-slate-500"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 text-slate-900 border border-slate-200 rounded-lg px-4 py-3 flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Finding answer...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-blue-50 bg-gradient-to-t from-blue-50/50 to-white p-4 sm:p-6">
              {error && (
                <div className="mb-3 flex items-start gap-3 rounded-lg bg-red-50 p-3 border border-red-100">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleAskQuestion} className="space-y-3">
                <textarea
                  name="chatInput"
                  value={formState.chatInput}
                  onChange={handleInputChange}
                  placeholder="Ask a question about the syllabus..."
                  disabled={
                    isLoading ||
                    !formState.department ||
                    !formState.year ||
                    !formState.subject
                  }
                  className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-50 disabled:text-slate-400 resize-none"
                  rows={3}
                />

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={resetChat}
                    className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    Clear Chat
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isLoading ||
                      !formState.department ||
                      !formState.year ||
                      !formState.subject ||
                      !formState.chatInput.trim()
                    }
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyllabusQA;
