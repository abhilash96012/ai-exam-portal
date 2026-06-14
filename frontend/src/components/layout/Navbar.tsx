import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Settings, X } from "lucide-react";
import adminService from "../../services/adminService";
import type { SystemSettings } from "../../types/admin.types";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "./ProtectedLayout";

const defaultSystemSettings: SystemSettings = {
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  smtpPassword: "",
  geminiApiKey: "",
  ollamaUrl: "http://localhost:11434",
  defaultQuestionCount: "20",
  defaultDifficulty: "Medium",
  emailNotifications: true,
};

const Navbar: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { toggle } = useSidebar();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(
    defaultSystemSettings,
  );
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  const updateSetting = <K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K],
  ) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      [key]: value,
    }));
  };

  const closeSettingsDrawer = () => {
    setIsSettingsOpen(false);
    setSettingsError(null);
    setSettingsSuccess(null);
  };

  useEffect(() => {
    const loadSystemSettings = async () => {
      if (!isSettingsOpen || user?.role !== "ADMIN") {
        return;
      }

      setIsSettingsLoading(true);
      setSettingsError(null);
      setSettingsSuccess(null);

      try {
        const persistedSettings = await adminService.getSystemSettings();
        setSettings((prevSettings) => ({
          ...prevSettings,
          ...persistedSettings,
        }));
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load system settings";
        setSettingsError(message);
      } finally {
        setIsSettingsLoading(false);
      }
    };

    loadSystemSettings();
  }, [isSettingsOpen, user?.role]);

  const handleSaveSettings = async () => {
    if (user?.role !== "ADMIN") {
      return;
    }

    setIsSettingsSaving(true);
    setSettingsError(null);
    setSettingsSuccess(null);

    try {
      const updated = await adminService.updateSystemSettings(settings);
      setSettings(updated);
      setSettingsSuccess("System settings saved successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save settings";
      setSettingsError(message);
    } finally {
      setIsSettingsSaving(false);
    }
  };

  const settingsFormDisabled = isSettingsLoading || isSettingsSaving;

  return (
    <>
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          {/* Hamburger menu - mobile only */}
          <button
            onClick={toggle}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg md:hidden"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Right side content */}
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            {isAuthenticated && user && (
              <>
                {/* Notification Icons - hidden on smallest screens */}
                <div className="hidden sm:flex items-center gap-2">
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </button>
                </div>

                {user.role === "ADMIN" && (
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    aria-label="Open system settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}

                {/* User Info */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-400 flex items-center justify-center text-[#1e293b] font-bold text-sm sm:text-base">
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-gray-800">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.role.toLowerCase()}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSettingsDrawer}
              className="absolute inset-0 bg-slate-900/35 backdrop-blur-[1px]"
              aria-label="Close settings drawer"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="relative h-full w-full max-w-xl border-l border-blue-100 bg-gradient-to-b from-white to-blue-50/70 shadow-2xl overflow-y-auto"
              aria-label="System settings drawer"
            >
              <div className="sticky top-0 z-10 border-b border-blue-100 bg-white/90 backdrop-blur-sm px-5 sm:px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    System Settings
                  </h2>
                  <p className="text-xs text-slate-500">
                    Configure platform defaults and integrations
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeSettingsDrawer}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  aria-label="Close settings"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-6">
                {isSettingsLoading && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    Loading system settings...
                  </div>
                )}

                {settingsError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {settingsError}
                  </div>
                )}

                {settingsSuccess && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {settingsSuccess}
                  </div>
                )}

                <section className="rounded-2xl border border-blue-100 bg-white p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    SMTP Settings
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="SMTP Host"
                      value={settings.smtpHost}
                      disabled={settingsFormDisabled}
                      onChange={(event) =>
                        updateSetting("smtpHost", event.target.value)
                      }
                      className="h-10 rounded-xl border border-blue-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                      type="text"
                      placeholder="SMTP Port"
                      value={settings.smtpPort}
                      disabled={settingsFormDisabled}
                      onChange={(event) =>
                        updateSetting("smtpPort", event.target.value)
                      }
                      className="h-10 rounded-xl border border-blue-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                      type="email"
                      placeholder="SMTP User"
                      value={settings.smtpUser}
                      disabled={settingsFormDisabled}
                      onChange={(event) =>
                        updateSetting("smtpUser", event.target.value)
                      }
                      className="h-10 rounded-xl border border-blue-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                      type="password"
                      placeholder="SMTP Password"
                      value={settings.smtpPassword}
                      disabled={settingsFormDisabled}
                      onChange={(event) =>
                        updateSetting("smtpPassword", event.target.value)
                      }
                      className="h-10 rounded-xl border border-blue-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-blue-100 bg-white p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Gemini API Key
                  </h3>
                  <input
                    type="password"
                    placeholder="Enter Gemini API key"
                    value={settings.geminiApiKey}
                    disabled={settingsFormDisabled}
                    onChange={(event) =>
                      updateSetting("geminiApiKey", event.target.value)
                    }
                    className="h-10 w-full rounded-xl border border-blue-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </section>

                <section className="rounded-2xl border border-blue-100 bg-white p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Ollama URL
                  </h3>
                  <input
                    type="url"
                    placeholder="http://localhost:11434"
                    value={settings.ollamaUrl}
                    disabled={settingsFormDisabled}
                    onChange={(event) =>
                      updateSetting("ollamaUrl", event.target.value)
                    }
                    className="h-10 w-full rounded-xl border border-blue-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </section>

                <section className="rounded-2xl border border-blue-100 bg-white p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Question Defaults
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="text-xs font-medium text-slate-600">
                      Default Question Count
                      <input
                        type="number"
                        min={1}
                        value={settings.defaultQuestionCount}
                        disabled={settingsFormDisabled}
                        onChange={(event) =>
                          updateSetting(
                            "defaultQuestionCount",
                            event.target.value,
                          )
                        }
                        className="mt-1 h-10 w-full rounded-xl border border-blue-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <label className="text-xs font-medium text-slate-600">
                      Default Difficulty
                      <select
                        value={settings.defaultDifficulty}
                        disabled={settingsFormDisabled}
                        onChange={(event) =>
                          updateSetting(
                            "defaultDifficulty",
                            event.target
                              .value as SystemSettings["defaultDifficulty"],
                          )
                        }
                        className="mt-1 h-10 w-full rounded-xl border border-blue-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </label>
                  </div>
                </section>

                <section className="rounded-2xl border border-blue-100 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Email Notification Toggle
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Send upload and exam lifecycle notifications over email.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={settingsFormDisabled}
                      onClick={() =>
                        updateSetting(
                          "emailNotifications",
                          !settings.emailNotifications,
                        )
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.emailNotifications
                          ? "bg-blue-600"
                          : "bg-slate-300"
                      }`}
                      aria-label="Toggle email notifications"
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          settings.emailNotifications
                            ? "translate-x-[22px]"
                            : "translate-x-[2px]"
                        }`}
                      />
                    </button>
                  </div>
                </section>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeSettingsDrawer}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={settingsFormDisabled}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                  >
                    {isSettingsSaving ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
