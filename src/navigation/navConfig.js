import {
  MdDashboard,
  MdTrackChanges,
  MdPeople,
  MdAttachMoney,
  MdLocationCity,
  MdEventNote,
  MdNotifications,
  MdAssessment,
  MdHistory,
  MdCalendarMonth,
  MdAccountBalanceWallet,
  MdCardGiftcard,
  MdEventAvailable,
  MdWeb,
} from "react-icons/md";

import {
  FiHome,
  FiClock,
  FiCheckSquare,
  FiCalendar,
  FiTrendingUp,
  FiBookOpen,
  FiUser,
  FiBell,
  FiTarget,
  FiDollarSign,
  FiAward,
} from "react-icons/fi";

import {
  MdGridView,
  MdChecklist,
  MdDescription,
  MdAssignmentTurnedIn,
  MdInsights,
  MdCalendarToday,
  MdDateRange,
} from "react-icons/md";

import { LuSparkles } from "react-icons/lu";

export const navConfig = {
  // ==================================================
  // ==================== ADMIN ========================
  // ==================================================

  admin: [
    // ================= OPERATIONS =================
    {
      titleKey: "portal.dashboard",
      title: "Dashboard",
      path: "/admin/dashboard",
      icon: MdDashboard,
      section: "OPERATIONS",
    },
    {
      titleKey: "portal.users",
      title: "Users",
      path: "/admin/users",
      icon: MdPeople,
      section: "OPERATIONS",
    },
    {
      titleKey: "portal.branches",
      title: "Branches",
      path: "/admin/branches",
      icon: MdLocationCity,
      section: "OPERATIONS",
    },
    {
      titleKey: "portal.departmentsTeams",
      title: "Departments & Teams",
      path: "/admin/departments",
      icon: MdLocationCity,
      section: "OPERATIONS",
    },
    {
      titleKey: "portal.submissionReviews",
      title: "Submission Reviews",
      path: "/admin/submissions",
      icon: MdDescription,
      section: "OPERATIONS",
    },
    {
      titleKey: "portal.taskManagement",
      title: "Task Management",
      path: "/admin/tasks",
      icon: MdChecklist,
      section: "OPERATIONS",
    },

    // ================= FINANCIAL & REWARDS =================
    {
      titleKey: "portal.advancesDeductions",
      title: "Advances & Deductions",
      path: "/admin/advances-deductions",
      icon: MdAccountBalanceWallet,
      section: "FINANCIAL & REWARDS",
    },
    {
      titleKey: "portal.payroll",
      title: "Payroll",
      path: "/admin/payroll",
      icon: MdAttachMoney,
      section: "FINANCIAL & REWARDS",
    },
    {
      titleKey: "portal.rewardsBonuses",
      title: "Rewards & Bonuses",
      path: "/admin/rewards",
      icon: MdCardGiftcard,
      section: "FINANCIAL & REWARDS",
    },

    // ================= GROWTH & GOVERNANCE =================
    {
      titleKey: "portal.performance",
      title: "Performance",
      path: "/admin/performance",
      icon: MdAssessment,
      section: "GROWTH & GOVERNANCE",
    },
    {
      titleKey: "portal.goals",
      title: "Goals",
      path: "/admin/goals",
      icon: MdAssessment,
      section: "GROWTH & GOVERNANCE",
    },
    {
      titleKey: "portal.evaluations",
      title: "Evaluations",
      path: "/admin/evaluations",
      icon: MdTrackChanges,
      section: "GROWTH & GOVERNANCE",
    },
    {
      titleKey: "portal.companyPolicies",
      title: "Company Policies",
      path: "/admin/policies",
      icon: FiBookOpen,
      section: "GROWTH & GOVERNANCE",
    },
    {
      titleKey: "portal.attendance",
      title: "Attendance",
      path: "/admin/attendance",
      icon: MdCalendarMonth,
      section: "GROWTH & GOVERNANCE",
    },
    {
      titleKey: "portal.leaveRequests",
      title: "Leave Requests",
      path: "/admin/leave-requests",
      icon: MdEventNote,
      section: "GROWTH & GOVERNANCE",
    },
    {
      titleKey: "portal.holidays",
      title: "Holidays & Seasons",
      path: "/admin/holidays",
      icon: MdEventAvailable,
      section: "GROWTH & GOVERNANCE",
    },
    {
      titleKey: "portal.calendar",
      title: "Calendar",
      path: "/admin/calendar",
      icon: MdCalendarMonth,
      section: "GROWTH & GOVERNANCE",
    },
    {
      titleKey: "portal.companyEvents",
      title: "Company Events",
      path: "/admin/events",
      icon: FiAward,
      section: "GROWTH & GOVERNANCE",
    },
        {
      titleKey: "portal.aiAssistant",
      title: "AI Assistant",
      path: "/admin/ai-assistant",
      icon: LuSparkles,
      section: "GROWTH & GOVERNANCE",
    },
    {
      titleKey: "portal.auditLogs",
      title: "Audit Logs",
      path: "/admin/audit",
      icon: MdHistory,
      section: "GROWTH & GOVERNANCE",
    },
    {
      titleKey: "portal.notifications",
      title: "Notifications",
      path: "/admin/notifications",
      icon: MdNotifications,
      section: "GROWTH & GOVERNANCE",
    },
    {
      titleKey: "portal.profileSettings",
      title: "Profile & Settings",
      path: "/admin/settings",
      icon: FiUser,
      section: "GROWTH & GOVERNANCE",
    },

    {
      titleKey: "portal.landingPage",
      title: "Landing Page",
      path: "/admin/landing-page",
      icon: MdWeb,
      section: "GROWTH & GOVERNANCE",
    },
  ],

  // ==================================================
  // ====================== HR =========================
  // ==================================================

  hr: [
    // ================= OPERATIONS =================
    {
      titleKey: "portal.dashboard",
      path: "/hr/dashboard",
      icon: MdDashboard,
      section: "OPERATIONS",
    },
    {
      titleKey: "portal.employees",
      path: "/hr/employees",
      icon: MdPeople,
      section: "OPERATIONS",
    },
    {
      titleKey: "portal.departmentsTeams",
      path: "/hr/departments",
      icon: MdLocationCity,
      section: "OPERATIONS",
    },
    {
      titleKey: "portal.attendance",
      path: "/hr/attendance",
      icon: MdCalendarMonth,
      section: "OPERATIONS",
    },
    {
      titleKey: "portal.calendar",
      title: "Calendar",
      path: "/hr/calendar",
      icon: MdCalendarMonth,
      section: "OPERATIONS",
    },
    {
      titleKey: "portal.companyEvents",
      title: "Company Events",
      path: "/hr/events",
      icon: FiAward,
      section: "OPERATIONS",
    },
    {
      titleKey: "portal.leaveRequests",
      path: "/hr/leave-requests",
      icon: MdEventNote,
      section: "OPERATIONS",
    },
    {
      titleKey: "portal.submissionReviews",
      title: "Submission Reviews",
      path: "/hr/submissions",
      icon: MdDescription,
      section: "OPERATIONS",
    },
    {
      titleKey: "portal.taskManagement",
      title: "Task Management",
      path: "/hr/tasks",
      icon: MdChecklist,
      section: "OPERATIONS",
    },

    // ================= FINANCIAL & REWARDS =================
    {
      titleKey: "portal.advancesDeductions",
      path: "/hr/advances-deductions",
      icon: MdAccountBalanceWallet,
      section: "FINANCIAL & REWARDS",
    },
    {
      titleKey: "portal.payroll",
      path: "/hr/payroll",
      icon: MdAttachMoney,
      section: "FINANCIAL & REWARDS",
    },
    {
      titleKey: "portal.rewardsBonuses",
      path: "/hr/rewards",
      icon: MdCardGiftcard,
      section: "FINANCIAL & REWARDS",
    },

    // ================= GROWTH & GOVERNANCE =================
    {
      titleKey: "portal.goals",
      title: "Goals",
      path: "/hr/goals",
      icon: MdTrackChanges,
      section: "GROWTH & GOVERNANCE",
    },
    {
      titleKey: "portal.evaluations",
      title: "Evaluations",
      path: "/hr/evaluations",
      icon: MdAssessment,
      section: "GROWTH & GOVERNANCE",
    },
    {
      titleKey: "portal.performanceMetrics",
      title: "Performance Metrics",
      path: "/hr/performance-metrics",
      icon: MdAssessment,
      section: "GROWTH & GOVERNANCE",
    },
    {
      titleKey: "portal.aiInsights",
      title: "AI Insights",
      path: "/hr/ai-insights",
      icon: LuSparkles,
      section: "GROWTH & GOVERNANCE",
    },
    {
      titleKey: "portal.companyPolicies",
      title: "Company Policies",
      path: "/hr/company-policies",
      icon: FiBookOpen,
      section: "GROWTH & GOVERNANCE",
    },
    {
      titleKey: "portal.holidays",
      title: "Holidays & Seasons",
      path: "/hr/holidays",
      icon: MdEventAvailable,
      section: "GROWTH & GOVERNANCE",
    },
    {
      titleKey: "portal.reports",
      title: "Reports",
      path: "/hr/reports",
      icon: MdDescription,
      section: "GROWTH & GOVERNANCE",
    },
    {
      titleKey: "portal.auditLogs",
      title: "Audit Logs",
      path: "/hr/audit",
      icon: MdHistory,
      section: "GROWTH & GOVERNANCE",
    },
    {
      titleKey: "portal.notifications",
      path: "/hr/notifications",
      icon: MdNotifications,
      section: "GROWTH & GOVERNANCE",
    },
    {
      titleKey: "portal.profileSettings",
      title: "Profile & Settings",
      path: "/hr/settings",
      icon: FiUser,
      section: "GROWTH & GOVERNANCE",
    },
  ],

  // ==================================================
  // ==================== MANAGER ======================
  // ==================================================

  manager: [
    {
      titleKey: "portal.teamDashboard",
      title: "Team Dashboard",
      path: "/manager/dashboard",
      icon: MdGridView,
    },
    {
      titleKey: "portal.teamMembers",
      title: "Team Members",
      path: "/manager/members",
      icon: MdPeople,
    },
    {
      titleKey: "portal.taskManagement",
      title: "Task Management",
      path: "/manager/tasks",
      icon: MdChecklist,
    },
    {
      titleKey: "portal.submissionReviews",
      title: "Submission Reviews",
      path: "/manager/submissions",
      icon: MdDescription,
    },
    {
      titleKey: "portal.teamEvaluations",
      title: "Team Evaluations",
      path: "/manager/evaluations",
      icon: MdAssignmentTurnedIn,
    },
    {
      titleKey: "portal.teamGoalsOkrs",
      title: "Team Goals & OKRs",
      path: "/manager/goals",
      icon: MdTrackChanges,
    },
    {
      titleKey: "portal.performanceAnalytics",
      title: "Performance Analytics",
      path: "/manager/analytics",
      icon: MdInsights,
    },
    {
      titleKey: "portal.teamAttendance",
      title: "Team Attendance",
      path: "/manager/attendance",
      icon: MdCalendarToday,
    },
    {
      titleKey: "portal.departmentsTeams",
      title: "Departments & Teams",
      path: "/manager/departments",
      icon: MdLocationCity,
    },
    {
      titleKey: "portal.teamLeaveApprovals",
      title: "Team Leave Approvals",
      path: "/manager/leave-approvals",
      icon: MdEventAvailable,
    },
    {
      titleKey: "portal.companyPolicies",
      title: "Company Policies",
      path: "/manager/policies",
      icon: FiBookOpen,
    },
    {
      titleKey: "portal.holidays",
      title: "Official Holidays",
      path: "/manager/holidays",
      icon: MdDateRange,
    },
    {
      titleKey: "portal.calendar",
      title: "Calendar",
      path: "/manager/calendar",
      icon: MdCalendarMonth,
    },
    {
      titleKey: "portal.companyEvents",
      title: "Company Events",
      path: "/manager/events",
      icon: FiAward,
    },
    {
      titleKey: "portal.aiTeamInsights",
      title: "AI Team Insights",
      path: "/manager/ai-insights",
      icon: LuSparkles,
    },
    {
      titleKey: "portal.notifications",
      title: "Notifications",
      path: "/manager/notifications",
      icon: MdNotifications,
    },
    {
      titleKey: "portal.profileSettings",
      title: "Profile & Settings",
      path: "/manager/profile",
      icon: FiUser,
    },
  ],

  // ==================================================
  // ==================== EMPLOYEE =====================
  // ==================================================

  employee: [
    {
      titleKey: "portal.homeDashboard",
      title: "Home Dashboard",
      path: "/employee/dashboard",
      icon: FiHome,
    },
    {
      titleKey: "portal.myAttendance",
      title: "My Attendance",
      path: "/employee/attendance",
      icon: FiClock,
    },
    {
      titleKey: "portal.departmentsTeams",
      title: "Departments & Teams",
      path: "/employee/departments",
      icon: MdLocationCity,
    },
    {
      titleKey: "portal.myTasks",
      title: "My Tasks",
      path: "/employee/tasks",
      icon: FiCheckSquare,
    },
    {
      titleKey: "portal.leaveBalances",
      title: "Leave & Balances",
      path: "/employee/leaves",
      icon: FiCalendar,
    },
    {
      titleKey: "portal.holidays",
      title: "Company Holidays",
      path: "/employee/holidays",
      icon: MdEventAvailable,
    },
    {
      titleKey: "portal.calendar",
      title: "Calendar",
      path: "/employee/calendar",
      icon: FiCalendar,
    },
    {
      titleKey: "portal.companyEvents",
      title: "Company Events",
      path: "/employee/events",
      icon: FiAward,
    },
    {
      titleKey: "portal.myPerformance",
      title: "My Performance",
      path: "/employee/performance",
      icon: FiTrendingUp,
    },
    {
      titleKey: "portal.myGoals",
      title: "My Goals",
      path: "/employee/goals",
      icon: FiTarget,
    },
    {
      titleKey: "portal.myEvaluations",
      title: "My Evaluations",
      path: "/employee/evaluations",
      icon: FiAward,
    },
    {
      titleKey: "portal.myFinancials",
      title: "My Financials",
      path: "/employee/financial",
      icon: FiDollarSign,
    },
    {
      titleKey: "portal.aiAssistant",
      title: "AI Assistant",
      path: "/employee/ai-assistant",
      icon: LuSparkles,
    },
    {
      titleKey: "portal.companyPolicies",
      title: "Company Policies",
      path: "/employee/policies",
      icon: FiBookOpen,
    },
    {
      titleKey: "portal.profileSettings",
      title: "Profile & Settings",
      path: "/employee/profile",
      icon: FiUser,
    },
    {
      titleKey: "portal.notifications",
      title: "Notifications",
      path: "/employee/notifications",
      icon: FiBell,
    },
  ],
};
