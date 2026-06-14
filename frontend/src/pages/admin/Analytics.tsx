import React, { useEffect, useState } from "react";
import adminService from "../../services/adminService";
import type { PlatformAnalytics } from "../../types/admin.types";
import Loader from "../../components/common/Loader";

const defaultAnalytics: PlatformAnalytics = {
  totalRegisteredStudents: 0,
  totalTeachers: 0,
  totalExamsCreated: 0,
  totalAttempts: 0,
  averageScore: 0,
  examsPerBranch: [],
  studentsPerDepartment: [],
  passFailRatio: { pass: 0, fail: 0 },
};

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] =
    useState<PlatformAnalytics>(defaultAnalytics);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await adminService.getAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to load analytics", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return <Loader fullScreen text="Loading analytics..." />;
  }

  const pass = analytics.passFailRatio.pass;
  const fail = analytics.passFailRatio.fail;
  const totalPassFail = pass + fail || 1;
  const passPercent = Math.round((pass / totalPassFail) * 100);
  const failPercent = Math.round((fail / totalPassFail) * 100);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Summary of platform usage and outcomes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Students</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {analytics.totalRegisteredStudents}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Teachers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {analytics.totalTeachers}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Exams</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {analytics.totalExamsCreated}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Attempts</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {analytics.totalAttempts}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Average Score</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {analytics.averageScore.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Exams Per Branch
          </h2>
          <div className="space-y-3">
            {analytics.examsPerBranch.map((item) => (
              <div key={item.branch}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700">{item.branch}</span>
                  <span className="font-medium text-gray-900">
                    {item.count}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-blue-500"
                    style={{
                      width: `${
                        (item.count /
                          Math.max(
                            1,
                            ...analytics.examsPerBranch.map((b) => b.count),
                          )) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {analytics.examsPerBranch.length === 0 && (
              <p className="text-sm text-gray-500">No exam data available.</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Students Per Department
          </h2>
          <div className="space-y-3">
            {analytics.studentsPerDepartment.map((item) => (
              <div key={item.department}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700">{item.department}</span>
                  <span className="font-medium text-gray-900">
                    {item.count}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-emerald-500"
                    style={{
                      width: `${
                        (item.count /
                          Math.max(
                            1,
                            ...analytics.studentsPerDepartment.map(
                              (d) => d.count,
                            ),
                          )) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {analytics.studentsPerDepartment.length === 0 && (
              <p className="text-sm text-gray-500">
                No department data available.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Pass / Fail Ratio
        </h2>
        <div className="h-4 w-full rounded-full overflow-hidden bg-gray-100 flex">
          <div
            className="bg-green-500"
            style={{ width: `${passPercent}%` }}
            title={`Pass: ${pass}`}
          />
          <div
            className="bg-red-500"
            style={{ width: `${failPercent}%` }}
            title={`Fail: ${fail}`}
          />
        </div>
        <div className="mt-3 flex items-center gap-4 text-sm">
          <p className="text-green-700">
            Pass: {pass} ({passPercent}%)
          </p>
          <p className="text-red-700">
            Fail: {fail} ({failPercent}%)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
