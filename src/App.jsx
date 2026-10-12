import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LanguageRouter from "./routes/LanguageRouter";
import { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute, { PublicRoute } from "./routes/ProtectedRoute";
import HrLayout from "./layouts/HrLayout";

// ==================== Home ====================
import Home from "./features/home";

// ==================== Auth ====================
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import VerifyOTP from "./features/auth/pages/VerifyOTP";
import ResetPassword from "./features/auth/pages/ResetPassword";
import PasswordResetSuccess from "./features/auth/pages/PasswordResetSuccess";

// ==================== Admin Pages ====================
import Branches from "./features/admin/pages/Branches";
import AdminDashboard from "./features/admin/pages/AdminDashboard";
import Notification from "./features/admin/pages/Notification";
import ActivityLog from "./features/admin/pages/AuditLogs";
import Users from "./features/admin/pages/Users";
import AdminPerformance from "./features/admin/pages/PerformancePage";
import AdminProfileSettings from "./features/admin/pages/ProfileSettings";
import Goals from "./features/admin/pages/Goals";
import AdminPayroll from "./features/admin/pages/Payroll";
import AdminAdvances from "./features/admin/pages/AdvancesDeductions";
import AdminRewards from "./features/admin/pages/Rewards";
import AdminAttendance from "./features/admin/pages/Attendance";
import AdminHolidays from "./features/admin/pages/Holidays";
import AdminPolicies from "./features/admin/pages/Policies";
import LandingPage from "./features/admin/pages/LandingPage";
import AdminAIAssistant from "./features/admin/pages/AIAssistant";
   
// ==================== Employee Pages ====================
import EmployeePerformance from "./features/employee/pages/Performance";
import PoliciesList from "./features/employee/pages/PoliciesList";
import Tasks from "./features/employee/pages/Tasks";
import EmployeeProfileSettings from "./features/employee/pages/ProfileSettings";
import HomeDashboard from "./features/employee/pages/home/HomeDashboard";
import Attendance from "./features/employee/pages/attendance/Attendance";
import LeaveBalances from "./features/employee/pages/Leave & balances";
import AIAssistant from "./features/employee/pages/AI Assistant";
import EmployeeGoals from "./features/employee/pages/Goals";
import EmployeeFinancial from "./features/employee/pages/Financial";
import EmployeeEvaluations from "./features/employee/pages/Evaluations";
import AdminEvaluations from "./features/admin/pages/Evaluations";

// ==================== Manager Pages ====================
import TeamDashboard from "./features/manager/pages/TeamDashboard";
import TaskManagement from "./features/manager/pages/TaskManagement";
import SubmissionReviews from "./features/manager/pages/SubmissionReviews";
import TeamEvaluations from "./features/manager/pages/TeamEvaluations";
import TeamGoals from "./features/manager/pages/TeamGoals";
import PerformanceAnalytics from "./features/manager/pages/PerformanceAnalytics";
import TeamAttendance from "./features/manager/pages/TeamAttendance";
import TeamMembers from "./features/manager/pages/TeamMembers";
import TeamLeaveApprovals from "./features/manager/pages/TeamLeaveApprovals";
import DepartmentDirectory from "./features/departments/pages/DepartmentDirectory";
import AITeamInsights from "./features/manager/pages/AITeamInsights";
import ProfileSetting from "./features/manager/pages/ProfileSetting";
import ManagerHolidays from "./features/manager/pages/Holidays";
import ManagerPolicies from "./features/manager/pages/CompanyPolicies";

// ==================== HR Pages ====================
import HrDashboard from "./features/hr/pages/hrDashboard";
import HrAttendance from "./features/hr/pages/attendance";
import HrAdvances from "./features/hr/pages/advances&Deductions";
import HrDepartments from "./features/hr/pages/departments&Teams";
import HrEmployees from "./features/hr/pages/employees";
import HrLeaveRequests from "./features/hr/pages/leaveRequests";
import HrPayroll from "./features/hr/pages/payroll";
import HrRewards from "./features/hr/pages/rewards&Bonuses";
import HrGoals from "./features/hr/pages/goals";
import HrEvaluations from "./features/hr/pages/evaluations";
import PerformanceMetrics from "./features/hr/pages/performanceMatrics";
import AIInsights from "./features/hr/pages/aiInsights";
import HrPolicies from "./features/hr/pages/managePolicies";
import HrHolidays from "./features/hr/pages/holidays";
import EmployeeHolidays from "./features/employee/pages/Holidays";
import Reports from "./features/hr/pages/reports";
import HrProfileSettings from "./features/hr/pages/ProfileSettings";
import CalendarPage from "./features/calendar/pages/CalendarPage";
import CompanyEventsPage from "./features/events/pages/CompanyEventsPage";

// ==================== Layout ====================
import DashboardLayout from "./layouts/DashboardLayout";

// ==================== Google OAuth hash handler ====================
(function handleGoogleHash() {
  const hash = window.location.hash;

  if (!hash.includes("token=")) return;

  const token = new URLSearchParams(hash.replace(/^#/, "")).get("token");

  if (!token) return;

  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");

    const payload = JSON.parse(atob(b64));

    const user = {
      id: payload.sub,
      role: payload.role,
    };

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("currentUser", JSON.stringify(user));
    localStorage.setItem("role", payload.role);
    localStorage.setItem("permissions", JSON.stringify([]));
    localStorage.setItem("rememberMe", "true");
  } catch (e) {
    console.error("Google token parse failed", e);
  }

  window.history.replaceState(null, "", window.location.pathname);
})();

// ==================== Language <-> URL (?lang=ar|en) ====================
// function LanguageUrlSync() {
//   const { i18n } = useTranslation();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const current = i18n.language?.startsWith("ar") ? "ar" : "en";

//   const prevLang = useRef(current);

//   const rawUrlLang = new URLSearchParams(location.search).get("lang");

//   const urlLang =
//     rawUrlLang === "ar" || rawUrlLang === "en" ? rawUrlLang : null;

//   // URL -> i18n
//   // أول تحميل / تعديل الرابط يدوي / back
//   useEffect(() => {
//     if (urlLang && urlLang !== current) {
//       i18n.changeLanguage(urlLang);
//     }

//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [urlLang]);

//   // i18n -> URL
//   // تغيير اللغة من الـ switcher أو التنقل بين الصفحات
//   useEffect(() => {
//     const langChanged = prevLang.current !== current;

//     prevLang.current = current;

//     if (urlLang === current) return;

//     if (urlLang && !langChanged) {
//       return;
//     }

//     const params = new URLSearchParams(location.search);

//     params.set("lang", current);

//     navigate(
//       {
//         pathname: location.pathname,
//         search: `?${params.toString()}`,
//         hash: location.hash,
//       },
//       {
//         replace: true,
//       },
//     );

//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [current, location.pathname, location.search]);

//   return null;
// }

// ==================== App ====================
function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const isArabic = i18n.language?.startsWith("ar");

    // HTML direction
    document.documentElement.dir = isArabic ? "rtl" : "ltr";

    document.documentElement.lang = isArabic ? "ar" : "en";

    // Body direction
    document.body.dir = isArabic ? "rtl" : "ltr";

    // Language classes
    document.documentElement.classList.toggle("rtl", isArabic);

    document.body.classList.toggle("rtl", isArabic);

    document.documentElement.classList.toggle("arabic-mode", isArabic);

    document.documentElement.classList.toggle("english-mode", !isArabic);
  }, [i18n.language]);

  return (
    <LanguageRouter>
      <AuthProvider>
        {/* ==================== Toast Notifications ==================== */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
          }}
        />

        <Routes>
          {/* ==================== Home ==================== */}
          <Route path="/" element={<Home />} />

          {/* ==================== Authentication ==================== */}

          {/* Normal Login: Employee, HR, Manager */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login isOwner={false} />
              </PublicRoute>
            }
          />

          {/* Owner Login */}
          <Route
            path="/owner/login"
            element={
              <PublicRoute>
                <Login isOwner={true} />
              </PublicRoute>
            }
          />

          {/* Owner redirect helper */}
          <Route
            path="/owner"
            element={<Navigate to="/owner/login" replace />}
          />

          {/* Owner Register */}
          <Route
            path="/owner/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Backward compatibility for /register */}
          <Route
            path="/register"
            element={<Navigate to="/owner/register" replace />}
          />

          {/* ==================== Password Reset ==================== */}

          <Route
            path="/ForgotPassword"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />

          <Route
            path="/activation"
            element={
              <PublicRoute allowAuthenticated>
                <ForgotPassword />
              </PublicRoute>
            }
          />

          <Route
            path="/VerifyOTP"
            element={
              <PublicRoute allowAuthenticated>
                <VerifyOTP />
              </PublicRoute>
            }
          />

          <Route
            path="/ResetPassword"
            element={
              <PublicRoute allowAuthenticated>
                <ResetPassword />
              </PublicRoute>
            }
          />

          <Route
            path="/password-reset-success"
            element={
              <PublicRoute>
                <PasswordResetSuccess />
              </PublicRoute>
            }
          />

          {/* ==================== Dashboard Layout ==================== */}
          <Route element={<DashboardLayout />}>
            {/* ================================================== */}
            {/* ==================== ADMIN (Owner Only) ========== */}
            {/* ================================================== */}

            <Route element={<ProtectedRoute allowedRoles={["Owner"]} />}>
              <Route
                path="/admin"
                element={<Navigate to="/admin/dashboard" replace />}
              />

              <Route path="/admin/dashboard" element={<AdminDashboard />} />

              <Route path="/admin/users" element={<Users />} />

              <Route path="/admin/branches" element={<Branches />} />

              <Route path="/admin/performance" element={<AdminPerformance />} />

              <Route path="/admin/notifications" element={<Notification />} />

              <Route path="/admin/audit" element={<ActivityLog />} />

              <Route path="/admin/attendance" element={<AdminAttendance />} />
              <Route path="/admin/ai-assistant" element={<AdminAIAssistant />} />
              <Route
                path="/admin/departments"
                element={<HrDepartments role="owner" />}
              />

              <Route
                path="/admin/leave-requests"
                element={<HrLeaveRequests role="owner" />}
              />

              <Route path="/admin/holidays" element={<AdminHolidays />} />

              <Route
                path="/admin/calendar"
                element={<CalendarPage customRole="admin" />}
              />

              <Route
                path="/admin/events"
                element={<CompanyEventsPage customRole="admin" />}
              />
              <Route
                path="/admin/company-events"
                element={<Navigate to="/admin/events" replace />}
              />

              <Route path="/admin/profile" element={<AdminProfileSettings />} />

              <Route path="/admin/goals" element={<Goals />} />

              <Route path="/admin/evaluations" element={<AdminEvaluations />} />
              <Route path="/admin/policies" element={<AdminPolicies />} />

              <Route
                path="/admin/settings"
                element={<AdminProfileSettings />}
              />

              <Route path="/admin/payroll" element={<AdminPayroll />} />

              <Route
                path="/admin/advances-deductions"
                element={<AdminAdvances />}
              />

              <Route path="/admin/rewards" element={<AdminRewards />} />

              <Route
                path="/admin/submissions"
                element={<SubmissionReviews role="Owner" />}
              />
              <Route
                path="/admin/tasks"
                element={<TaskManagement role="Owner" />}
              />

              <Route path="/admin/landing-page" element={<LandingPage />} />

              <Route path="/branches" element={<Branches />} />
            </Route>

            {/* ================================================== */}
            {/* ====================== HR (HR Only) ============== */}
            {/* ================================================== */}

            <Route element={<ProtectedRoute allowedRoles={["HR"]} />}>
              <Route path="/hr" element={<HrLayout />}>
                <Route
                  index
                  element={<Navigate to="/hr/dashboard" replace />}
                />

                <Route path="dashboard" element={<HrDashboard />} />

                <Route path="employees" element={<HrEmployees />} />

                <Route path="departments" element={<HrDepartments />} />

                <Route path="attendance" element={<HrAttendance />} />

                <Route path="leave-requests" element={<HrLeaveRequests />} />

                <Route path="advances-deductions" element={<HrAdvances />} />

                <Route path="payroll" element={<HrPayroll />} />

                <Route path="rewards" element={<HrRewards />} />

                <Route
                  path="submissions"
                  element={<SubmissionReviews role="HR" />}
                />

                <Route path="tasks" element={<TaskManagement role="HR" />} />
                <Route path="goals" element={<HrGoals />} />
                <Route path="evaluations" element={<HrEvaluations />} />
                <Route
                  path="evaluations-goals"
                  element={<Navigate to="/hr/evaluations" replace />}
                />

                <Route
                  path="performance-metrics"
                  element={<PerformanceMetrics />}
                />

                <Route path="ai-insights" element={<AIInsights />} />

                <Route path="company-policies" element={<HrPolicies />} />

                <Route path="holidays" element={<HrHolidays />} />

                <Route
                  path="calendar"
                  element={<CalendarPage customRole="hr" />}
                />

                <Route
                  path="events"
                  element={<CompanyEventsPage customRole="hr" />}
                />
                <Route
                  path="company-events"
                  element={<Navigate to="/hr/events" replace />}
                />

                <Route path="audit" element={<ActivityLog role="HR" />} />

                <Route path="reports" element={<Reports />} />

                <Route path="notifications" element={<Notification />} />

                <Route path="profile" element={<HrProfileSettings />} />

                <Route path="settings" element={<HrProfileSettings />} />
              </Route>
            </Route>

            {/* ================================================== */}
            {/* ==================== MANAGER (Manager Only) ====== */}
            {/* ================================================== */}

            <Route element={<ProtectedRoute allowedRoles={["Manager"]} />}>
              <Route
                path="/manager"
                element={<Navigate to="/manager/dashboard" replace />}
              />

              <Route path="/manager/dashboard" element={<TeamDashboard />} />

              <Route path="/manager/members" element={<TeamMembers />} />

              <Route path="/manager/tasks" element={<TaskManagement />} />

              <Route
                path="/manager/submissions"
                element={<SubmissionReviews />}
              />

              <Route
                path="/manager/evaluations"
                element={<TeamEvaluations />}
              />

              <Route path="/manager/goals" element={<TeamGoals />} />

              <Route
                path="/manager/analytics"
                element={<PerformanceAnalytics />}
              />

              <Route path="/manager/attendance" element={<TeamAttendance />} />

              <Route
                path="/manager/departments"
                element={<DepartmentDirectory />}
              />

              <Route
                path="/manager/leave-approvals"
                element={<TeamLeaveApprovals />}
              />

              <Route path="/manager/holidays" element={<ManagerHolidays />} />
              <Route
                path="/manager/calendar"
                element={<CalendarPage customRole="manager" />}
              />
              <Route
                path="/manager/events"
                element={<CompanyEventsPage customRole="manager" />}
              />
              <Route
                path="/manager/company-events"
                element={<Navigate to="/manager/events" replace />}
              />

              <Route path="/manager/ai-insights" element={<AITeamInsights />} />

              <Route path="/manager/policies" element={<ManagerPolicies />} />

              <Route path="/manager/notifications" element={<Notification />} />

              <Route path="/manager/profile" element={<ProfileSetting />} />
            </Route>

            {/* ================================================== */}
            {/* ==================== EMPLOYEE (Employee Only) ==== */}
            {/* ================================================== */}

            <Route element={<ProtectedRoute allowedRoles={["Employee"]} />}>
              <Route
                path="/employee"
                element={<Navigate to="/employee/dashboard" replace />}
              />

              <Route path="/employee/dashboard" element={<HomeDashboard />} />

              <Route path="/employee/attendance" element={<Attendance />} />

              <Route
                path="/employee/departments"
                element={<DepartmentDirectory />}
              />

              <Route path="/employee/tasks" element={<Tasks />} />

              <Route
                path="/employee/performance"
                element={<EmployeePerformance />}
              />

              <Route path="/employee/leaves" element={<LeaveBalances />} />

              <Route
                path="/employee/leave-balances"
                element={<Navigate to="/employee/leaves" replace />}
              />

              <Route path="/employee/holidays" element={<EmployeeHolidays />} />
              <Route
                path="/employee/calendar"
                element={<CalendarPage customRole="employee" />}
              />
              <Route
                path="/employee/events"
                element={<CompanyEventsPage customRole="employee" />}
              />
              <Route
                path="/employee/company-events"
                element={<Navigate to="/employee/events" replace />}
              />

              <Route path="/employee/ai-assistant" element={<AIAssistant />} />

              <Route
                path="/employee/assistant"
                element={<Navigate to="/employee/ai-assistant" replace />}
              />

              <Route
                path="/employee/notifications"
                element={<Notification />}
              />

              <Route path="/employee/policies" element={<PoliciesList />} />

              <Route path="/employee/goals" element={<EmployeeGoals />} />

              <Route
                path="/employee/evaluations"
                element={<EmployeeEvaluations />}
              />
              <Route
                path="/employee/financial"
                element={<EmployeeFinancial />}
              />

              <Route
                path="/employee/profile"
                element={<EmployeeProfileSettings />}
              />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </LanguageRouter>
  );
}

export default App;
