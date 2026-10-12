import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiUsers,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiMail,
  FiPhone,
  FiMapPin,
  FiX,
  FiBriefcase,
  FiCalendar,
  FiTrash2,
  FiLoader,
} from "react-icons/fi";
import { useManagerEmployees } from "../hooks/useManagerData";
import { useDeleteEmployee } from "../../../hooks/useDeleteEmployee"; // adjust path if needed
import { useAuth } from "../../../context/AuthContext"; // adjust path if needed

/* ─── Animation presets ─── */
const fadeUp = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };

/* ─── Helpers ─── */
const initials = (name) =>
  (name || "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

const statusCfg = {
  Active: { cls: "bg-[#ecfdf5] text-[#059669]", dot: "bg-[#059669]" },
  Inactive: { cls: "bg-[#fef2f2] text-[#dc2626]", dot: "bg-[#dc2626]" },
};
const getStatusCfg = (s) =>
  statusCfg[s] ?? { cls: "bg-[#f1f5f9] text-[#475569]", dot: "bg-[#94a3b8]" };

const getStatusLabel = (status, t) =>
  status === "Active"
    ? t("teamMembers.statusActive", "Active")
    : status === "Inactive"
      ? t("teamMembers.statusInactive", "Inactive")
      : status;

const getEmploymentLabel = (type, t) => ({
  "Full-time": t("teamMembers.fullTime", "Full-time"),
  "Part-time": t("teamMembers.partTime", "Part-time"),
  Contract: t("teamMembers.contract", "Contract"),
}[type] || type);

const empTypeCfg = {
  "Full-time": "bg-[#eff6ff] text-[#3b82f6]",
  "Part-time": "bg-[#f5f3ff] text-[#7c3aed]",
  Contract: "bg-[#fff7ed] text-[#c2410c]",
};
const getEmpType = (t) => empTypeCfg[t] ?? "bg-[#f1f5f9] text-[#475569]";

/* ─── Employee Detail Drawer ─── */
const EmployeeDrawer = ({ employee, onClose, onDelete, canDelete, isArabic, t }) => {
  if (!employee) return null;
  const cfg = getStatusCfg(employee.status);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-sm sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden"
        dir={isArabic ? "rtl" : "ltr"}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f1f5f9]">
          <p className="text-sm font-bold text-[#1e293b]">
            {t("teamMembers.employeeDetails", "Employee Details")}
          </p>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#f1f5f9] transition"
          >
            <FiX className="h-4 w-4 text-[#94a3b8]" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            {employee.avatar_url ? (
              <img
                src={employee.avatar_url}
                alt={employee.name}
                className="h-16 w-16 rounded-full object-cover shrink-0 ring-2 ring-[#e2e8f0]"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5b8c6a] to-[#3d6b52] text-lg font-bold text-white">
                {initials(employee.name)}
              </div>
            )}
            <div>
              <p className="text-[17px] font-bold text-[#1e293b]">{employee.name}</p>
              <p className="text-sm text-[#64748b]">{employee.job_title || "—"}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.cls}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                  {getStatusLabel(employee.status, t)}
                </span>
                {employee.employment_type && (
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getEmpType(employee.employment_type)}`}>
                    {getEmploymentLabel(employee.employment_type, t)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: FiMail, label: t("teamMembers.email", "Email"), value: employee.email },
              { icon: FiPhone, label: t("teamMembers.phone", "Phone"), value: employee.phone },
              { icon: FiBriefcase, label: t("teamMembers.empCode", "Emp. Code"), value: employee.employee_code },
              { icon: FiCalendar, label: t("teamMembers.startDate", "Start Date"), value: employee.start_date },
              { icon: FiMapPin, label: t("teamMembers.address", "Address"), value: employee.address },
            ].map(({ icon: Icon, label, value }) =>
              value ? (
                <div key={label} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f1f5f9] text-[#486581]">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">{label}</p>
                    <p className="text-sm text-[#1e293b]">{value}</p>
                  </div>
                </div>
              ) : null
            )}
          </div>

          {/* Department + Location */}
          <div className="grid grid-cols-2 gap-3">
            {employee.department && (
              <div className="rounded-xl bg-[#f8fafc] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">
                  {t("teamMembers.department", "Department")}
                </p>
                <p className="text-sm font-medium text-[#1e293b] mt-0.5">{employee.department.name}</p>
              </div>
            )}
            {employee.company_location && (
              <div className="rounded-xl bg-[#f8fafc] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">
                  {t("teamMembers.location", "Location")}
                </p>
                <p className="text-sm font-medium text-[#1e293b] mt-0.5">{employee.company_location.name}</p>
              </div>
            )}
          </div>

          {/* Delete */}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(employee)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] py-2.5 text-sm font-semibold text-[#dc2626] hover:bg-[#fee2e2] transition"
            >
              <FiTrash2 className="h-4 w-4" />
              {t("teamMembers.deleteEmployee", "Delete employee")}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Main Component ─── */
const TeamMembers = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar");
  const lang = isArabic ? "ar" : "en";

  const { currentUser } = useAuth();

  // ── Filters ──
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [empType, setEmpType] = useState("");
  const [page, setPage] = useState(1);
  const [selectedEmployee, setSelected] = useState(null);

  // ── Delete ──
  const deleteEmployeeMutation = useDeleteEmployee(lang);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const isSelf = (emp) => String(emp?.id) === String(currentUser?.id);

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    if (isSelf(employeeToDelete)) return;

    try {
      const res = await deleteEmployeeMutation.mutateAsync(employeeToDelete.id);
      toast.success(
        res?.message ||
          t("teamMembers.deleteSuccess", "Employee deleted successfully."),
      );
      if (selectedEmployee?.id === employeeToDelete.id) setSelected(null);
      setEmployeeToDelete(null);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          t("teamMembers.deleteError", "Failed to delete employee."),
      );
      setEmployeeToDelete(null);
    }
  };

  // ── Query ──
  const {
    data,
    isLoading: loading,
    isError,
    error,
    refetch,
  } = useManagerEmployees({
    ...(search ? { search } : {}),
    ...(status ? { status } : {}),
    ...(empType ? { employment_type: empType } : {}),
    page,
    per_page: 15,
  });

  // ── Derived ──
  const employees = data?.employees ?? [];
  const meta = data?.meta ?? {};
  const lastPage = meta.last_page ?? 1;
  const total = meta.total ?? 0;

  return (
    <motion.div
      dir={isArabic ? "rtl" : "ltr"}
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="w-full space-y-6 pb-12 font-sans"
    >
      {/* ── HEADER ── */}
      <motion.div variants={fadeUp} transition={{ duration: 0.2, ease: "easeOut" }}>
        <p className="text-[11px] font-bold tracking-wider text-[#6b879f] uppercase">
          {t("teamMembers.breadcrumb", "Manager Portal / Team Members")}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-lg md:text-[21px] font-bold text-[#1e293b] tracking-tight">
            {t("teamMembers.title", "Team Members")}
          </h1>
          {!loading && (
            <span className="flex items-center gap-1 rounded-full bg-[#eef5f1] px-3 py-1 text-[11px] font-semibold text-[#2f6f4d]">
              <FiUsers className="h-3 w-3" />
              {total} {t("teamMembers.total", "total")}
            </span>
          )}
        </div>
        <p className="text-sm text-[#829ab1] mt-1 font-normal">
          {t("teamMembers.subtitle", "View and manage all employees under your team.")}
        </p>
      </motion.div>

      {/* ── FILTERS ── */}
      <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input
            type="text"
            id="team-members-search"
            placeholder={t("teamMembers.search", "Search name, email, ID…")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-[#e2e8f0] bg-white py-2.5 ps-9 pe-4 text-sm text-[#1e293b] placeholder-[#94a3b8] outline-none focus:border-[#5b8c6a] focus:ring-2 focus:ring-[#5b8c6a]/20 transition"
          />
        </div>

        {/* Status */}
        <div className="relative">
          <FiFilter className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <select
            id="team-members-status"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="rounded-xl border border-[#e2e8f0] bg-white py-2.5 ps-9 pe-4 text-sm text-[#1e293b] outline-none focus:border-[#5b8c6a] focus:ring-2 focus:ring-[#5b8c6a]/20 transition appearance-none cursor-pointer"
          >
            <option value="">{t("teamMembers.allStatuses", "All Statuses")}</option>
            <option value="active">{t("teamMembers.active", "Active")}</option>
            <option value="inactive">{t("teamMembers.inactive", "Inactive")}</option>
          </select>
        </div>

        {/* Employment type */}
        <div className="relative">
          <FiBriefcase className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <select
            id="team-members-emptype"
            value={empType}
            onChange={(e) => { setEmpType(e.target.value); setPage(1); }}
            className="rounded-xl border border-[#e2e8f0] bg-white py-2.5 ps-9 pe-4 text-sm text-[#1e293b] outline-none focus:border-[#5b8c6a] focus:ring-2 focus:ring-[#5b8c6a]/20 transition appearance-none cursor-pointer"
          >
            <option value="">{t("teamMembers.allTypes", "All Types")}</option>
            <option value="Full-time">{t("teamMembers.fullTime", "Full-time")}</option>
            <option value="Part-time">{t("teamMembers.partTime", "Part-time")}</option>
            <option value="Contract">{t("teamMembers.contract", "Contract")}</option>
          </select>
        </div>
      </motion.div>

      {/* ── LOADING ── */}
      {loading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <FiRefreshCw className="h-7 w-7 animate-spin text-[#627d98]" />
        </div>
      )}

      {/* ── ERROR ── */}
      {!loading && isError && (
        <motion.div
          variants={fadeUp}
          className="flex items-center justify-between gap-3 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4"
        >
          <div className="flex items-center gap-2">
            <FiAlertCircle className="h-4 w-4 text-[#dc2626] shrink-0" />
            <p className="text-sm text-[#b91c1c]">
              {error?.response?.data?.message || error?.message || t("teamMembers.loadError", "Failed to load team members.")}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="shrink-0 text-sm font-semibold text-[#dc2626] hover:underline"
          >
            {t("teamMembers.retry", "Retry")}
          </button>
        </motion.div>
      )}

      {/* ── DATA ── */}
      {!loading && !isError && (
        <>
          {/* ── CARD GRID ── */}
          {employees.length === 0 ? (
            <motion.div
              variants={fadeUp}
              className="flex flex-col items-center justify-center gap-3 py-20 text-[#94a3b8]"
            >
              <FiUsers className="h-12 w-12 opacity-30" />
              <p className="text-sm">{t("teamMembers.noEmployees", "No employees found.")}</p>
            </motion.div>
          ) : (
            <motion.div
              variants={stagger}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {employees.map((emp) => {
                const cfg = getStatusCfg(emp.status);
                return (
                  <motion.div
                    key={emp.id}
                    variants={fadeUp}
                    whileHover={{ y: -4, transition: { duration: 0.18 } }}
                    onClick={() => setSelected(emp)}
                    className="group cursor-pointer rounded-2xl border border-[#e2e8f0]/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow duration-200"
                  >
                    {/* Card header */}
                    <div className="flex items-start gap-3">
                      {emp.avatar_url ? (
                        <img
                          src={emp.avatar_url}
                          alt={emp.name}
                          className="h-11 w-11 rounded-full object-cover shrink-0 ring-2 ring-[#e2e8f0] group-hover:ring-[#5b8c6a]/40 transition"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5b8c6a] to-[#3d6b52] text-sm font-bold text-white">
                          {initials(emp.name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-bold text-[#1e293b]">{emp.name}</p>
                        <p className="truncate text-xs text-[#64748b]">{emp.job_title || "—"}</p>
                      </div>

                      {!isSelf(emp) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmployeeToDelete(emp);
                          }}
                          className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#fef2f2] hover:text-[#dc2626] transition"
                          title={t("teamMembers.delete", "Delete")}
                          aria-label={t("teamMembers.delete", "Delete")}
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        {getStatusLabel(emp.status, t)}
                      </span>
                      {emp.employment_type && (
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getEmpType(emp.employment_type)}`}>
                          {getEmploymentLabel(emp.employment_type, t)}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="mt-3 space-y-1.5">
                      {emp.email && (
                        <div className="flex items-center gap-2 text-xs text-[#64748b]">
                          <FiMail className="h-3.5 w-3.5 shrink-0 text-[#94a3b8]" />
                          <span className="truncate">{emp.email}</span>
                        </div>
                      )}
                      {emp.department?.name && (
                        <div className="flex items-center gap-2 text-xs text-[#64748b]">
                          <FiMapPin className="h-3.5 w-3.5 shrink-0 text-[#94a3b8]" />
                          <span className="truncate">{emp.department.name}</span>
                        </div>
                      )}
                      {emp.employee_code && (
                        <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
                          <FiBriefcase className="h-3.5 w-3.5 shrink-0" />
                          <span>{emp.employee_code}</span>
                        </div>
                      )}
                    </div>

                    {/* Start date */}
                    {emp.start_date && (
                      <div className="mt-3 flex items-center justify-between border-t border-[#f1f5f9] pt-3">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#94a3b8]">
                          <FiCalendar className="h-3.5 w-3.5" />
                          {t("teamMembers.joined", "Joined")} {emp.start_date}
                        </div>
                        <span className="text-[11px] font-semibold text-[#5b8c6a] opacity-0 group-hover:opacity-100 transition">
                          {t("teamMembers.viewDetails", "View →")}
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ── PAGINATION ── */}
          {lastPage > 1 && (
            <motion.div
              variants={fadeUp}
              className="flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white px-5 py-3"
            >
              <p className="text-xs text-[#94a3b8]">
                {t("common.page", "Page")} {meta.current_page ?? page} / {lastPage}
                {" · "}
                {total} {t("teamMembers.results", "results")}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {isArabic ? <FiChevronRight className="h-4 w-4" /> : <FiChevronLeft className="h-4 w-4" />}
                </button>
                <button
                  disabled={page >= lastPage}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {isArabic ? <FiChevronLeft className="h-4 w-4" /> : <FiChevronRight className="h-4 w-4" />}
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* ── DETAIL DRAWER ── */}
      <AnimatePresence>
        {selectedEmployee && (
          <EmployeeDrawer
            employee={selectedEmployee}
            isArabic={isArabic}
            t={t}
            onClose={() => setSelected(null)}
            canDelete={!isSelf(selectedEmployee)}
            onDelete={(emp) => setEmployeeToDelete(emp)}
          />
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRM MODAL ── */}
      <AnimatePresence>
        {employeeToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() =>
              !deleteEmployeeMutation.isPending && setEmployeeToDelete(null)
            }
          >
            <motion.div
              initial={{ scale: 0.95, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              dir={isArabic ? "rtl" : "ltr"}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            >
              <h3 className="text-[17px] font-bold text-[#1e293b]">
                {t("teamMembers.deleteEmployee", "Delete employee")}
              </h3>
              <p className="mt-2 text-sm text-[#64748b]">
                {t(
                  "teamMembers.deleteConfirm",
                  "Are you sure you want to delete {{name}}? This action cannot be undone.",
                  { name: employeeToDelete.name },
                )}
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEmployeeToDelete(null)}
                  disabled={deleteEmployeeMutation.isPending}
                  className="rounded-lg border border-[#e2e8f0] px-4 py-2.5 text-sm font-semibold text-[#475569] hover:bg-[#f8fafc] transition disabled:opacity-50"
                >
                  {t("teamMembers.cancel", "Cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteEmployeeMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#dc2626] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b91c1c] transition disabled:opacity-60"
                >
                  {deleteEmployeeMutation.isPending && (
                    <FiLoader className="h-4 w-4 animate-spin" />
                  )}
                  {t("teamMembers.delete", "Delete")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TeamMembers;