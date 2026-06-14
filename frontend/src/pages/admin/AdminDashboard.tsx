import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Eye,
  FileText,
  Layers3,
  Pencil,
  Trash2,
  Upload,
  UploadCloud,
} from "lucide-react";
import adminService from "../../services/adminService";
import n8nService from "../../services/n8nService";
import {
  extractTextFromFile,
  isValidFileFormat,
  isFileSizeValid,
} from "../../utils/textExtraction";
import type {
  AdminDashboardStats,
  SyllabusItem,
  SyllabusOptions,
  SyllabusOverview,
  SyllabusStatus,
} from "../../types/admin.types";
import Loader from "../../components/common/Loader";

interface SyllabusFormState {
  branch: string;
  department: string;
  year: string;
  subject: string;
}

const defaultStats: AdminDashboardStats = {
  totalStudents: 0,
  totalTeachers: 0,
  totalExams: 0,
  totalPublishedExams: 0,
};

const initialFormState: SyllabusFormState = {
  branch: "",
  department: "",
  year: "",
  subject: "",
};

const defaultBranchOptions = ["B.Tech"];
const defaultDepartmentOptions = [
  "CSD",
  "AIML",
  "AIDS",
  "CSIT",
  "CSE",
  "IT",
  "Mechanical",
  "Civil",
];
const defaultYearOptions = [
  { label: "First Year", value: "1" },
  { label: "Second Year", value: "2" },
  { label: "Third Year", value: "3" },
  { label: "Final Year", value: "4" },
];

const defaultSyllabusOptions: SyllabusOptions = {
  branches: [],
  departments: [],
  years: [],
  subjects: [],
};

const defaultSyllabusOverview: SyllabusOverview = {
  total_uploaded_syllabi: 0,
  total_branches: 0,
  total_departments: 0,
  total_subjects: 0,
  statusCounts: {
    UPLOADED: 0,
    PROCESSING: 0,
    READY: 0,
  },
};

const statusLabelMap: Record<SyllabusStatus, string> = {
  UPLOADED: "Uploaded",
  PROCESSING: "Processing",
  READY: "Ready",
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) {
    return "0 KB";
  }

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(2)} MB`;
};

const getStatusBadgeStyles = (status: SyllabusStatus) => {
  if (status === "READY") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }

  if (status === "PROCESSING") {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }

  return "bg-blue-50 text-blue-700 border border-blue-200";
};

const toYearLabel = (year: number) => {
  if (year === 1) {
    return "First Year";
  }

  if (year === 2) {
    return "Second Year";
  }

  if (year === 3) {
    return "Third Year";
  }

  if (year === 4) {
    return "Final Year";
  }

  return `Year ${year}`;
};

const getNextStatus = (status: SyllabusStatus): SyllabusStatus => {
  if (status === "UPLOADED") {
    return "PROCESSING";
  }

  if (status === "PROCESSING") {
    return "READY";
  }

  return "UPLOADED";
};

const AdminDashboard: React.FC = () => {
  const location = useLocation();

  const [stats, setStats] = useState<AdminDashboardStats>(defaultStats);
  const [isLoading, setIsLoading] = useState(true);

  const [formState, setFormState] =
    useState<SyllabusFormState>(initialFormState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [syllabi, setSyllabi] = useState<SyllabusItem[]>([]);
  const [syllabusOverview, setSyllabusOverview] = useState<SyllabusOverview>(
    defaultSyllabusOverview,
  );
  const [syllabusOptions, setSyllabusOptions] = useState<SyllabusOptions>(
    defaultSyllabusOptions,
  );

  const [isSyllabusLoading, setIsSyllabusLoading] = useState(true);
  const [syllabusError, setSyllabusError] = useState<string | null>(null);
  const [isUploadingSyllabus, setIsUploadingSyllabus] = useState(false);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const syllabusSectionRef = useRef<HTMLElement | null>(null);

  const resolvedBranchOptions = syllabusOptions.branches.length
    ? syllabusOptions.branches
    : defaultBranchOptions;
  const resolvedDepartmentOptions = syllabusOptions.departments.length
    ? syllabusOptions.departments
    : defaultDepartmentOptions;
  const resolvedYearOptions = syllabusOptions.years.length
    ? syllabusOptions.years.map((year) => ({
        label: toYearLabel(year),
        value: String(year),
      }))
    : defaultYearOptions;

  const loadSyllabusData = useCallback(async () => {
    setIsSyllabusLoading(true);
    setSyllabusError(null);

    try {
      const [libraryData, optionData] = await Promise.all([
        adminService.getSyllabusLibrary({ page: 1, limit: 100 }),
        adminService.getSyllabusOptions(),
      ]);

      setSyllabi(libraryData.syllabi || []);
      setSyllabusOverview(libraryData.overview || defaultSyllabusOverview);
      setSyllabusOptions(optionData || defaultSyllabusOptions);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load syllabus library";
      setSyllabusError(message);
    } finally {
      setIsSyllabusLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const [dashboardStats] = await Promise.all([
          adminService.getDashboardStats(),
          loadSyllabusData(),
        ]);

        setStats(dashboardStats);
      } catch (error) {
        console.error("Failed to load admin dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPageData();
  }, [loadSyllabusData]);

  useEffect(() => {
    if (location.pathname === "/admin/syllabus") {
      syllabusSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [location.pathname]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSelectedFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const [file] = files;

    if (!isValidFileFormat(file)) {
      setSyllabusError("Only PDF, DOC, and DOCX files are allowed");
      return;
    }

    if (!isFileSizeValid(file)) {
      setSyllabusError("File size must be less than 50 MB");
      return;
    }

    setSyllabusError(null);
    setSelectedFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    handleSelectedFiles(event.dataTransfer.files);
  };

  const handleUploadSyllabus = async () => {
    if (
      !formState.branch ||
      !formState.department ||
      !formState.year ||
      !formState.subject ||
      !selectedFile
    ) {
      setSyllabusError(
        "Please fill all fields and select a file before upload",
      );
      return;
    }

    setIsUploadingSyllabus(true);
    setSyllabusError(null);
    let uploadedSyllabusId: string | null = null;

    try {
      // Extract text from the selected file
      const syllabusText = await extractTextFromFile(selectedFile);

      if (!syllabusText || syllabusText.trim().length === 0) {
        setSyllabusError(
          "Could not extract text from the uploaded file. Please ensure the file contains readable content.",
        );
        return;
      }

      const uploadedSyllabus = await adminService.uploadSyllabus({
        subject: formState.subject,
        branch: formState.branch,
        department: formState.department,
        year: formState.year,
        file: selectedFile,
      });

      uploadedSyllabusId = uploadedSyllabus.id;

      // Send to n8n webhook with metadata and extracted text
      await n8nService.uploadSyllabusToN8N({
        type: "admin",
        syllabusId: uploadedSyllabus.id,
        branch: formState.branch,
        department: formState.department,
        year: formState.year,
        subject: formState.subject,
        unit: "General",
        syllabusText: syllabusText,
      });

      await adminService.updateSyllabusStatus(
        uploadedSyllabus.id,
        "PROCESSING",
      );

      setFormState(initialFormState);
      setSelectedFile(null);

      // Optionally refresh the syllabus library to show new entry
      // (n8n processes it in the background)
      await loadSyllabusData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload syllabus";

      if (uploadedSyllabusId) {
        setSyllabusError(
          `Syllabus saved, but n8n processing failed: ${message}`,
        );
        await loadSyllabusData();
        return;
      }

      setSyllabusError(message);
    } finally {
      setIsUploadingSyllabus(false);
    }
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteSyllabus = async (syllabusId: string) => {
    setActiveRowId(syllabusId);
    setSyllabusError(null);

    try {
      await adminService.deleteSyllabus(syllabusId);
      await loadSyllabusData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete syllabus";
      setSyllabusError(message);
    } finally {
      setActiveRowId(null);
    }
  };

  const handleUpdateStatus = async (record: SyllabusItem) => {
    setActiveRowId(record.id);
    setSyllabusError(null);

    try {
      await adminService.updateSyllabusStatus(
        record.id,
        getNextStatus(record.status),
      );
      await loadSyllabusData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update status";
      setSyllabusError(message);
    } finally {
      setActiveRowId(null);
    }
  };

  const handleDownloadSyllabus = async (record: SyllabusItem) => {
    setActiveRowId(record.id);
    setSyllabusError(null);

    try {
      const { blob, filename } = await adminService.downloadSyllabus(record.id);
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || record.originalFileName || "syllabus";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to download syllabus";
      setSyllabusError(message);
    } finally {
      setActiveRowId(null);
    }
  };

  const renderSyllabusTable = () => {
    if (isSyllabusLoading) {
      return (
        <div className="rounded-2xl border border-blue-100 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">Loading syllabus library...</p>
        </div>
      );
    }

    if (syllabi.length === 0) {
      return null;
    }

    return (
      <div className="overflow-x-auto rounded-2xl border border-blue-100">
        <table className="min-w-full text-sm">
          <thead className="bg-gradient-to-r from-blue-50 to-white text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Subject</th>
              <th className="px-4 py-3 text-left font-semibold">Branch</th>
              <th className="px-4 py-3 text-left font-semibold">Department</th>
              <th className="px-4 py-3 text-left font-semibold">Year</th>
              <th className="px-4 py-3 text-left font-semibold">Uploaded By</th>
              <th className="px-4 py-3 text-left font-semibold">Upload Date</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-50 bg-white/90">
            {syllabi.map((record) => (
              <tr
                key={record.id}
                className="hover:bg-blue-50/60 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-slate-800">
                  {record.subject}
                </td>
                <td className="px-4 py-3 text-slate-600">{record.branch}</td>
                <td className="px-4 py-3 text-slate-600">
                  {record.department}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {toYearLabel(record.year)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {record.uploadedByName || "Admin"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(record.uploadDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeStyles(record.status)}`}
                  >
                    {statusLabelMap[record.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadSyllabus(record)}
                      disabled={activeRowId === record.id}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors"
                      aria-label="View syllabus"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(record)}
                      disabled={activeRowId === record.id}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 hover:text-amber-600 hover:border-amber-200 transition-colors"
                      aria-label="Edit syllabus"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSyllabus(record.id)}
                      disabled={activeRowId === record.id}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 hover:text-red-600 hover:border-red-200 transition-colors"
                      aria-label="Delete syllabus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (isLoading) {
    return <Loader fullScreen text="Loading admin dashboard..." />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">
          Manage students, teachers, and platform-wide activity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          whileHover={{ y: -4 }}
          className="bg-white rounded-xl border border-gray-200 p-5"
        >
          <p className="text-sm text-gray-500 mb-1">Total Students</p>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalStudents}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          whileHover={{ y: -4 }}
          className="bg-white rounded-xl border border-gray-200 p-5"
        >
          <p className="text-sm text-gray-500 mb-1">Total Teachers</p>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalTeachers}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          whileHover={{ y: -4 }}
          className="bg-white rounded-xl border border-gray-200 p-5"
        >
          <p className="text-sm text-gray-500 mb-1">Total Exams</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalExams}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          whileHover={{ y: -4 }}
          className="bg-white rounded-xl border border-gray-200 p-5"
        >
          <p className="text-sm text-gray-500 mb-1">Published Exams</p>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalPublishedExams}
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Link
          to="/admin/students"
          className="rounded-xl border border-blue-200 bg-blue-50 p-5 hover:bg-blue-100 transition-colors"
        >
          <p className="font-semibold text-blue-900">Student Management</p>
          <p className="text-sm text-blue-700 mt-1">
            Upload CSV, search, update, and remove records.
          </p>
        </Link>
        <Link
          to="/admin/teachers"
          className="rounded-xl border border-amber-200 bg-amber-50 p-5 hover:bg-amber-100 transition-colors"
        >
          <p className="font-semibold text-amber-900">Teacher Management</p>
          <p className="text-sm text-amber-700 mt-1">
            Invite teachers and monitor invitation status.
          </p>
        </Link>
        <Link
          to="/admin/analytics"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 hover:bg-emerald-100 transition-colors"
        >
          <p className="font-semibold text-emerald-900">Platform Analytics</p>
          <p className="text-sm text-emerald-700 mt-1">
            View totals, score trends, and pass/fail ratio.
          </p>
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          whileHover={{ y: -4 }}
          className="rounded-xl border border-indigo-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <p className="font-semibold text-indigo-950">
              Departments & Subjects
            </p>
            <Layers3 className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-sm text-indigo-700 mt-1 mb-4">
            Configure academic hierarchy and syllabus coverage.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              className="rounded-lg bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-200 transition-colors"
            >
              Add Branch
            </button>
            <button
              type="button"
              className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200 transition-colors"
            >
              Add Department
            </button>
            <button
              type="button"
              className="rounded-lg bg-cyan-100 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-200 transition-colors"
            >
              Add Subject
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-indigo-50 p-3 border border-indigo-100">
              <p className="text-[11px] text-indigo-600">Total Branches</p>
              <p className="text-lg font-bold text-indigo-900">
                {syllabusOverview.total_branches}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
              <p className="text-[11px] text-blue-600">Total Departments</p>
              <p className="text-lg font-bold text-blue-900">
                {syllabusOverview.total_departments}
              </p>
            </div>
            <div className="rounded-lg bg-cyan-50 p-3 border border-cyan-100">
              <p className="text-[11px] text-cyan-600">Total Subjects</p>
              <p className="text-lg font-bold text-cyan-900">
                {syllabusOverview.total_subjects}
              </p>
            </div>
            <div className="rounded-lg bg-sky-50 p-3 border border-sky-100">
              <p className="text-[11px] text-sky-600">Total Uploaded Syllabi</p>
              <p className="text-lg font-bold text-sky-900">
                {syllabusOverview.total_uploaded_syllabi}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.section
        id="syllabus-library"
        ref={syllabusSectionRef}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="relative overflow-hidden rounded-2xl border border-blue-100/80 bg-white/90 shadow-[0_20px_50px_-30px_rgba(30,64,175,0.45)] backdrop-blur-sm"
      >
        <div className="pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="p-5 sm:p-7 space-y-6 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Syllabus Library
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Upload and manage branch-wise syllabus for future exam
                generation
              </p>
            </div>
            <button
              type="button"
              onClick={triggerFilePicker}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Syllabus
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(event) => handleSelectedFiles(event.target.files)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm font-medium text-slate-700">
              Branch
              <select
                name="branch"
                value={formState.branch}
                onChange={handleInputChange}
                className="mt-1 h-11 w-full rounded-xl border border-blue-200 bg-white/90 px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select branch</option>
                {resolvedBranchOptions.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Department
              <select
                name="department"
                value={formState.department}
                onChange={handleInputChange}
                className="mt-1 h-11 w-full rounded-xl border border-blue-200 bg-white/90 px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select department</option>
                {resolvedDepartmentOptions.map((department) => (
                  <option key={department} value={department}>
                    {department}
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
                className="mt-1 h-11 w-full rounded-xl border border-blue-200 bg-white/90 px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select year</option>
                {resolvedYearOptions.map((yearOption) => (
                  <option key={yearOption.value} value={yearOption.value}>
                    {yearOption.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Subject
              <input
                name="subject"
                type="text"
                placeholder="Enter subject"
                value={formState.subject}
                onChange={handleInputChange}
                className="mt-1 h-11 w-full rounded-xl border border-blue-200 bg-white/90 px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <div className="md:col-span-2">
              <div
                role="button"
                tabIndex={0}
                onClick={triggerFilePicker}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                }}
                onDrop={handleDrop}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    triggerFilePicker();
                  }
                }}
                className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                  dragActive
                    ? "border-blue-400 bg-blue-50"
                    : "border-blue-200 bg-gradient-to-b from-white to-blue-50/70"
                }`}
              >
                <UploadCloud className="w-10 h-10 mx-auto text-blue-500" />
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Drag and drop PDF or DOCX here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  or click to browse from your device
                </p>
              </div>

              {selectedFile && (
                <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleUploadSyllabus}
              disabled={isUploadingSyllabus}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              {isUploadingSyllabus ? "Uploading..." : "Upload"}
            </button>
          </div>

          {syllabusError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {syllabusError}
            </div>
          )}

          {renderSyllabusTable()}
        </div>
      </motion.section>
    </div>
  );
};

export default AdminDashboard;
