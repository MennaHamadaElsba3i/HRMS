import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiSearch,
  FiX,
  FiCheck,
  FiUsers,
  FiBriefcase,
  FiLayers,
} from "react-icons/fi";
import {
  createDepartment,
  changeDepartmentStatus,
  getDepartmentManagers,
  getDepartments,
  getEmployees,
  updateDepartment,
  updateEmployeeHRFields,
} from "../api";

const content = {
  en: {
    title: "Departments & Teams",
    subtitle: "Manage organizational structure, leaders, and workstreams.",
    createBtn: "Create Department",
    editBtn: "Edit Department",
    changeStatusBtn: "Set {status}",
    searchPlaceholder: "Search departments...",

    headPrefix: "Head: ",
    headcountLabel: "Headcount",

    manageMembersBtn: "Manage Members",
    transferEmployeeBtn: "Transfer Employee",

    totalDepartments: "Total Departments",
    totalEmployees: "Total Employees",

    modalTitle: "Create Department",
    detailsLabel: "Department Name",
    detailsPlaceholder: "Enter department name",
    ownerLabel: "Department Head / Owner",

    cancelBtn: "Cancel",
    saveBtn: "Save changes",

    successTitle: "Saved successfully",
    successSubtitle: "The new department has been added successfully.",
    updateSuccess: "Department updated successfully.",
    statusSuccess: "Department status updated successfully.",
    doneBtn: "Done",

    noResults: "No departments found",
    results: "results",

    membersTitle: "Department Members",
    membersSubtitle: "Overview of current active headcount and capacity.",
    closeBtn: "Close",

    transferTitle: "Transfer Employee",
    transferSubtitle:
      "Select an employee and transfer them to this department.",
    employeePlaceholder: "Select employee",
    transferJobTitle: "Job title",
    transferJobTitlePlaceholder: "Enter the employee's job title",
    transferJobTitleRequired: "Enter a job title before transferring.",
    transferBtn: "Transfer Employee",
    loading: "Loading...",
    loadError: "Failed to load departments.",
    retry: "Retry",
    noEmployees: "No employees are currently assigned to this department.",
    noEmployeesToTransfer: "No employees are available to transfer.",
    unassigned: "Unassigned",
    active: "Active",
    inactive: "Inactive",
    selectHead: "Select a department head (optional)",
    noDepartmentHead: "No department head",
    createSuccess: "Department created successfully.",
    transferSuccess: "Employee transferred successfully.",
    requiredDepartmentName: "Enter a department name.",
  },

  ar: {
    title: "الأقسام والفرق",
    subtitle: "إدارة الهيكل التنظيمي، القادة، ومسارات العمل.",
    createBtn: "إنشاء قسم",
    editBtn: "تعديل القسم",
    changeStatusBtn: "تغيير الحالة إلى {status}",
    searchPlaceholder: "بحث عن الأقسام...",

    headPrefix: "رئيس القسم: ",
    headcountLabel: "عدد الموظفين",

    manageMembersBtn: "إدارة الأعضاء",
    transferEmployeeBtn: "نقل موظف",

    totalDepartments: "إجمالي الأقسام",
    totalEmployees: "إجمالي الموظفين",

    modalTitle: "إنشاء قسم جديد",
    detailsLabel: "اسم القسم",
    detailsPlaceholder: "أدخل اسم القسم",
    ownerLabel: "رئيس القسم / المسؤول",

    cancelBtn: "إلغاء",
    saveBtn: "حفظ التغييرات",

    successTitle: "تم الحفظ بنجاح",
    successSubtitle: "تمت إضافة القسم الجديد بنجاح.",
    updateSuccess: "تم تحديث القسم بنجاح.",
    statusSuccess: "تم تحديث حالة القسم بنجاح.",
    doneBtn: "تم",

    noResults: "لم يتم العثور على أقسام",
    results: "نتائج",

    membersTitle: "أعضاء القسم",
    membersSubtitle: "نظرة عامة على عدد الموظفين والسعة الحالية للقسم.",
    closeBtn: "إغلاق",

    transferTitle: "نقل موظف",
    transferSubtitle: "اختر موظفًا لنقله إلى هذا القسم.",
    employeePlaceholder: "اختر الموظف",
    transferJobTitle: "المسمى الوظيفي",
    transferJobTitlePlaceholder: "أدخل المسمى الوظيفي للموظف",
    transferJobTitleRequired: "أدخل المسمى الوظيفي قبل نقل الموظف.",
    transferBtn: "نقل الموظف",
    loading: "جاري التحميل...",
    loadError: "تعذر تحميل الأقسام.",
    retry: "إعادة المحاولة",
    noEmployees: "لا يوجد موظفون مسجلون حاليًا في هذا القسم.",
    noEmployeesToTransfer: "لا يوجد موظفون متاحون للنقل.",
    unassigned: "غير محدد",
    active: "نشط",
    inactive: "غير نشط",
    selectHead: "اختر رئيس القسم (اختياري)",
    noDepartmentHead: "بدون رئيس قسم",
    createSuccess: "تم إنشاء القسم بنجاح.",
    transferSuccess: "تم نقل الموظف بنجاح.",
    requiredDepartmentName: "أدخل اسم القسم.",
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: { duration: 0.18 },
  },
};

export default function DepartmentsAndTeams({ role = "hr" }) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith("ar");
  const lang = isArabic ? "ar" : "en";
  const t = content[isArabic ? "ar" : "en"];
  const queryClient = useQueryClient();
  const departmentsQuery = useQuery({
    queryKey: ["departments", lang],
    queryFn: () => fetchAllDepartments(lang),
  });
  const managersQuery = useQuery({
    queryKey: ["department-managers", lang],
    queryFn: async () => {
      const response = await getDepartmentManagers(lang);
      const managers = [response?.data, response?.data?.data, response].find(
        Array.isArray,
      );

      if (!managers) {
        throw new Error(
          isArabic
            ? "استجابة قائمة المديرين من الخادم غير صالحة."
            : "The managers response from the server is invalid.",
        );
      }

      return managers;
    },
  });
  const employeesQuery = useQuery({
    queryKey: ["employees", "departments-page", lang],
    queryFn: () => fetchAllEmployees(lang),
  });
  const departments = useMemo(
    () => departmentsQuery.data || [],
    [departmentsQuery.data],
  );
  const employees = useMemo(
    () => employeesQuery.data || [],
    [employeesQuery.data],
  );
  const managers = useMemo(
    () => managersQuery.data || [],
    [managersQuery.data],
  );

  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);

  const [details, setDetails] = useState("");
  const [managerId, setManagerId] = useState("");

  const [membersModal, setMembersModal] = useState(null);
  const [transferModal, setTransferModal] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [transferJobTitle, setTransferJobTitle] = useState("");
  const [transferJobTitleError, setTransferJobTitleError] = useState("");

  const createDepartmentMutation = useMutation({
    mutationFn: (departmentData) => createDepartment(departmentData, lang),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });
  const updateDepartmentMutation = useMutation({
    mutationFn: ({ id, departmentData }) =>
      updateDepartment(id, departmentData, lang),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });
  const changeDepartmentStatusMutation = useMutation({
    mutationFn: (id) => changeDepartmentStatus(id, lang),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });
  const transferEmployeeMutation = useMutation({
    mutationFn: ({ id, employeeData }) =>
      updateEmployeeHRFields(id, employeeData, lang),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["employees"] }),
        queryClient.invalidateQueries({ queryKey: ["departments"] }),
      ]);
    },
  });

  const filteredDepartments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return departments;

    return departments.filter((dept) => {
      const name = dept.name || "";
      const head = dept.manager?.name || "";
      return name.toLowerCase().includes(query) || head.toLowerCase().includes(query);
    });
  }, [departments, searchTerm]);

  const totalEmployees = employees.length;

  const handleCreateDepartment = () => {
    setEditingDepartment(null);
    setDetails("");
    setManagerId("");
    setIsSuccess(false);
    setIsModalOpen(true);
  };

  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
    setDetails(department.name || "");
    setManagerId(
      String(department.manager_id ?? department.manager?.id ?? ""),
    );
    setIsSuccess(false);
    setIsModalOpen(true);
  };

  const handleSaveDepartment = async (e) => {
    e.preventDefault();

    if (!details.trim()) {
      toast.error(t.requiredDepartmentName);
      return;
    }

    try {
      const departmentData = {
        name: details.trim(),
        description: editingDepartment?.description || null,
        manager_id: managerId ? Number(managerId) : null,
      };
      const response = editingDepartment
        ? await updateDepartmentMutation.mutateAsync({
            id: editingDepartment.id,
            departmentData,
          })
        : await createDepartmentMutation.mutateAsync(departmentData);
      setIsSuccess(true);
      toast.success(
        response?.message ||
          (editingDepartment ? t.updateSuccess : t.createSuccess),
      );
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          (isArabic
            ? editingDepartment
              ? "تعذر تحديث القسم."
              : "تعذر إنشاء القسم."
            : editingDepartment
              ? "Failed to update department."
              : "Failed to create department."),
      );
    }
  };

  const closeCreateModal = () => {
    setIsModalOpen(false);
    setIsSuccess(false);
    setEditingDepartment(null);
    setDetails("");
    setManagerId("");
  };

  const handleToggleDepartmentStatus = async (department) => {
    try {
      const response = await changeDepartmentStatusMutation.mutateAsync(
        department.id,
      );
      toast.success(response?.message || t.statusSuccess);
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          (isArabic
            ? "تعذر تحديث حالة القسم."
            : "Failed to update department status."),
      );
    }
  };

  const openMembersModal = (department) => {
    setMembersModal(department);
  };

  const openTransferModal = (department) => {
    setSelectedEmployee("");
    setTransferJobTitle("");
    setTransferJobTitleError("");
    setTransferModal(department);
  };

  const closeMembersModal = () => {
    setMembersModal(null);
  };

  const closeTransferModal = () => {
    setTransferModal(null);
    setSelectedEmployee("");
    setTransferJobTitle("");
    setTransferJobTitleError("");
  };

  const handleTransfer = async (e) => {
    e.preventDefault();

    if (!selectedEmployee || !transferModal) return;

    const employee = employees.find(
      (item) => String(item.id) === String(selectedEmployee),
    );
    if (!employee) {
      toast.error(
        isArabic
          ? "تعذر العثور على الموظف المحدد."
          : "The selected employee could not be found.",
      );
      return;
    }

    const jobTitle = transferJobTitle.trim();
    if (!jobTitle) {
      setTransferJobTitleError(t.transferJobTitleRequired);
      return;
    }

    try {
      const response = await transferEmployeeMutation.mutateAsync({
        id: employee.id,
        employeeData: {
          job_title: jobTitle,
          employment_type: employee.employment_type || "Full-time",
          status: String(employee.status || "active").toLowerCase(),
          department_id: Number(transferModal.id),
        },
      });
      toast.success(response?.message || t.transferSuccess);
      closeTransferModal();
    } catch (error) {
      const apiErrors =
        error?.response?.data?.errors ||
        error?.response?.data?.data?.errors ||
        {};
      const jobTitleError = [
        apiErrors.job_title,
        apiErrors["job_title.0"],
      ]
        .flat()
        .find((message) => typeof message === "string");

      if (jobTitleError) {
        setTransferJobTitleError(jobTitleError);
        return;
      }

      toast.error(error?.response?.data?.message ||
        (isArabic ? "تعذر نقل الموظف." : "Failed to transfer employee."));
    }
  };

  return (
    <motion.div
      dir={isArabic ? "rtl" : "ltr"}
      className="w-full space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* ==================== Header ==================== */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-wider text-[#6b879f] uppercase">
            {role === "owner"
              ? isArabic
                ? "مسؤول النظام / الأقسام والفرق"
                : "Admin Portal / Departments & Teams"
              : isArabic
                ? "الموارد البشرية / الأقسام والفرق"
                : "HR Portal / Departments & Teams"}
          </p>

          <h1 className="mt-1 text-lg font-bold tracking-tight text-[#1e293b] md:text-[21px]">
            {t.title}
          </h1>

          <p className="mt-1 text-sm font-normal text-[#64748b]">
            {t.subtitle}
          </p>
        </div>

        {/* Search + Create */}
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <div
              className={`pointer-events-none absolute inset-y-0 flex items-center ${
                isArabic ? "right-0 pr-3.5" : "left-0 pl-3.5"
              }`}
            >
              <FiSearch size={16} className="text-[#94a3b8]" />
            </div>

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full rounded-lg border border-[#e2e8f0] bg-white py-2.5 text-xs text-[#334155] outline-none transition-all placeholder:text-[#94a3b8] focus:border-[#94a3b8] focus:ring-2 focus:ring-[#f1f5f9] sm:text-sm ${
                isArabic ? "pr-9 pl-3" : "pl-9 pr-3"
              }`}
            />
          </div>

          <motion.button
            type="button"
            onClick={handleCreateDepartment}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#243B53] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1c2f42]"
          >
            <FiPlus className="h-4 w-4" />
            <span>{t.createBtn}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* ==================== Summary ==================== */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2"
      >
        {/* Total Departments */}
        <motion.div
          variants={itemVariants}
          whileHover={{
            y: -4,
            transition: { duration: 0.2, ease: "easeOut" },
          }}
          className="flex flex-col justify-between rounded-2xl border border-[#e2e8f0]/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-shadow duration-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
              {t.totalDepartments}
            </p>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5f3ff] text-[#8b5cf6]">
              <FiLayers className="h-[18px] w-[18px]" />
            </div>
          </div>

          <div className="mt-2">
            <p className="text-[27px] font-bold tracking-tight text-[#0f172a]">
              {departments.length}
            </p>

            <p className="mt-1 text-xs font-normal text-[#64748b]">
              {t.totalDepartments}
            </p>
          </div>
        </motion.div>

        {/* Total Employees */}
        <motion.div
          variants={itemVariants}
          whileHover={{
            y: -4,
            transition: { duration: 0.2, ease: "easeOut" },
          }}
          className="flex flex-col justify-between rounded-2xl border border-[#e2e8f0]/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-shadow duration-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">
              {t.totalEmployees}
            </p>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff] text-[#3b82f6]">
              <FiUsers className="h-[18px] w-[18px]" />
            </div>
          </div>

          <div className="mt-2">
            <p className="text-[27px] font-bold tracking-tight text-[#0f172a]">
              {totalEmployees}
            </p>

            <p className="mt-1 text-xs font-normal text-[#64748b]">
              {t.totalEmployees}
            </p>
          </div>
        </motion.div>

      </motion.div>

      {/* ==================== Results Header ==================== */}
      <motion.div variants={itemVariants}>
        <p className="text-xs font-normal text-[#64748b]">
          {departmentsQuery.isLoading
            ? t.loading
            : `${filteredDepartments.length} ${t.results}`}
        </p>
      </motion.div>

      {departmentsQuery.isError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">
            {departmentsQuery.error?.response?.data?.message || t.loadError}
          </p>
          <button
            type="button"
            onClick={() => departmentsQuery.refetch()}
            disabled={departmentsQuery.isFetching}
            className="shrink-0 text-sm font-semibold text-red-700 underline disabled:opacity-50"
          >
            {t.retry}
          </button>
        </div>
      )}

      {employeesQuery.isError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">
            {employeesQuery.error?.response?.data?.message ||
              (isArabic
                ? "تعذر تحميل الموظفين."
                : "Failed to load employees.")}
          </p>
          <button
            type="button"
            onClick={() => employeesQuery.refetch()}
            disabled={employeesQuery.isFetching}
            className="shrink-0 text-sm font-semibold text-red-700 underline disabled:opacity-50"
          >
            {t.retry}
          </button>
        </div>
      )}

      {/* ==================== Departments ==================== */}
      {departmentsQuery.isLoading ? (
        <p className="py-8 text-center text-sm text-[#64748b]">{t.loading}</p>
      ) : filteredDepartments.length > 0 ? (
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filteredDepartments.map((department) => {
            const departmentMembers = getDepartmentMembers(
              employees,
              department.id,
            );

            return (
              <motion.div
                key={department.id}
                variants={itemVariants}
                whileHover={{
                  y: -4,
                  transition: { duration: 0.2, ease: "easeOut" },
                }}
                className="group flex flex-col justify-between rounded-2xl border border-[#e2e8f0]/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-shadow duration-200 hover:shadow-md"
              >
                <div>
                  {/* Card Top */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5f3ff] text-[#8b5cf6]">
                        <FiBriefcase className="h-[18px] w-[18px]" />
                      </div>

                      <h3 className="truncate text-sm font-bold text-[#1e293b] sm:text-base">
                        {department.name}
                      </h3>

                      <p className="mt-1 truncate text-xs text-[#64748b]">
                        {t.headPrefix}
                        {department.manager?.name || t.unassigned}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold sm:text-xs ${
                        String(department.status).toLowerCase() === "active"
                          ? "bg-[#ecfdf5] text-[#16a34a]"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {String(department.status).toLowerCase() === "active"
                        ? t.active
                        : t.inactive}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#f8fafc] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#94a3b8] sm:text-xs">
                        {t.headcountLabel}
                      </p>

                      <p className="mt-1 text-base font-bold text-[#0f172a]">
                        {department.employees_count || departmentMembers.length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 space-y-2 border-t border-[#f1f5f9] pt-4">
                  <motion.button
                    type="button"
                    onClick={() => handleEditDepartment(department)}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-xs font-semibold text-[#475569] transition hover:bg-[#f8fafc]"
                  >
                    {t.editBtn}
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => handleToggleDepartmentStatus(department)}
                    disabled={changeDepartmentStatusMutation.isPending}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-xs font-semibold text-[#475569] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t.changeStatusBtn.replace(
                      "{status}",
                      String(department.status).toLowerCase() === "active"
                        ? t.inactive
                        : t.active,
                    )}
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => openMembersModal(department)}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#243B53] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1c2f42]"
                  >
                    <FiUsers className="h-3.5 w-3.5" />
                    {t.manageMembersBtn}
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => openTransferModal(department)}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-xs font-semibold text-[#475569] transition hover:bg-[#f8fafc]"
                  >
                    {t.transferEmployeeBtn}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white py-12 text-center"
        >
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f8fafc] text-[#94a3b8]">
            <FiSearch className="h-[18px] w-[18px]" />
          </div>

          <p className="mt-3 text-xs font-semibold text-[#64748b] sm:text-sm">
            {t.noResults}
          </p>
        </motion.div>
      )}

      {/* ==================== Create Department Modal ==================== */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCreateModal}
              className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-[2px]"
            />

            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[#e2e8f0]/80 bg-white shadow-xl"
            >
              {!isSuccess ? (
                <>
                  <div className="flex items-center justify-between border-b border-[#f1f5f9] px-6 py-5">
                    <div>
                      <h2 className="text-base font-bold text-[#1e293b]">
                        {editingDepartment ? t.editBtn : t.modalTitle}
                      </h2>

                      <p className="mt-1 text-xs text-[#64748b]">
                        {t.subtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={closeCreateModal}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] transition hover:bg-[#f8fafc] hover:text-[#475569]"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveDepartment} className="p-6">
                    <div className="space-y-5">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
                          {t.detailsLabel}
                        </label>

                        <input
                          type="text"
                          value={details}
                          onChange={(e) => setDetails(e.target.value)}
                          placeholder={t.detailsPlaceholder}
                          autoFocus
                          className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-xs text-[#334155] outline-none transition focus:border-[#94a3b8] focus:ring-2 focus:ring-[#f1f5f9] sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
                          {t.ownerLabel}
                        </label>

                        <select
                          value={managerId}
                          onChange={(e) => setManagerId(e.target.value)}
                          disabled={managersQuery.isLoading}
                          className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-xs text-[#334155] outline-none transition focus:border-[#94a3b8] focus:ring-2 focus:ring-[#f1f5f9] disabled:opacity-60 sm:text-sm"
                        >
                          <option value="">
                            {t.noDepartmentHead}
                          </option>
                          {managers.map((manager) => (
                            <option key={manager.id} value={manager.id}>
                              {manager.name}
                            </option>
                          ))}
                        </select>
                        {managersQuery.isError && (
                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <p className="text-xs text-red-600">
                              {managersQuery.error?.response?.data?.message ||
                                (isArabic
                                  ? "تعذر تحميل قائمة المديرين."
                                  : "Failed to load department heads.")}
                            </p>
                            <button
                              type="button"
                              onClick={() => managersQuery.refetch()}
                              disabled={managersQuery.isFetching}
                              className="shrink-0 text-xs font-semibold text-red-700 underline disabled:opacity-50"
                            >
                              {t.retry}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={closeCreateModal}
                        className="flex-1 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2.5 text-xs font-semibold text-[#64748b] transition hover:bg-[#f8fafc] sm:text-sm"
                      >
                        {t.cancelBtn}
                      </button>

                      <button
                        type="submit"
                        disabled={
                          !details.trim() ||
                          createDepartmentMutation.isPending ||
                          updateDepartmentMutation.isPending
                        }
                        className="flex-1 rounded-lg bg-[#243B53] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1c2f42] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                      >
                        {createDepartmentMutation.isPending ||
                        updateDepartmentMutation.isPending
                          ? t.loading
                          : t.saveBtn}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="px-6 py-9 text-center">
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ecfdf5] text-[#10b981]"
                  >
                    <FiCheck className="h-[26px] w-[26px]" />
                  </motion.div>

                  <h2 className="mt-4 text-base font-bold text-[#1e293b] sm:text-lg">
                    {t.successTitle}
                  </h2>

                  <p className="mx-auto mt-1 max-w-xs text-xs text-[#64748b] sm:text-sm">
                    {editingDepartment ? t.updateSuccess : t.successSubtitle}
                  </p>

                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="mt-6 w-full rounded-lg bg-[#243B53] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1c2f42] sm:text-sm"
                  >
                    {t.doneBtn}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== Manage Members Modal ==================== */}
      <AnimatePresence>
        {membersModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMembersModal}
              className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-[2px]"
            />

            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative z-10 w-full max-w-md rounded-2xl border border-[#e2e8f0]/80 bg-white p-6 shadow-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff6ff] text-[#3b82f6]">
                    <FiUsers className="h-[18px] w-[18px]" />
                  </div>

                  <h2 className="text-base font-bold text-[#1e293b]">
                    {t.membersTitle}
                  </h2>

                  <p className="mt-1 text-xs text-[#64748b] sm:text-sm">
                    {membersModal.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeMembersModal}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] transition hover:bg-[#f8fafc] hover:text-[#475569]"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-4 text-xs text-[#64748b] sm:text-sm">
                {t.membersSubtitle}
              </p>

              {employeesQuery.isLoading ? (
                <p className="mt-4 text-sm text-[#64748b]">{t.loading}</p>
              ) : employeesQuery.isError ? (
                <p className="mt-4 text-sm text-red-600">
                  {employeesQuery.error?.response?.data?.message ||
                    (isArabic
                      ? "تعذر تحميل الموظفين."
                      : "Failed to load employees.")}
                </p>
              ) : (
                <div className="mt-4 max-h-60 space-y-2 overflow-y-auto">
                  {getDepartmentMembers(employees, membersModal.id).map(
                    (employee) => (
                      <div
                        key={employee.id}
                        className="rounded-lg bg-[#f8fafc] px-3 py-2.5"
                      >
                        <p className="text-sm font-semibold text-[#1e293b]">
                          {employee.name}
                        </p>
                        <p className="mt-0.5 text-xs text-[#64748b]">
                          {employee.email}
                        </p>
                      </div>
                    ),
                  )}
                  {getDepartmentMembers(employees, membersModal.id).length ===
                    0 && (
                    <p className="text-sm text-[#64748b]">{t.noEmployees}</p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={closeMembersModal}
                className="mt-6 w-full rounded-lg bg-[#243B53] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1c2f42] sm:text-sm"
              >
                {t.closeBtn}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== Transfer Employee Modal ==================== */}
      <AnimatePresence>
        {transferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeTransferModal}
              className="absolute inset-0 bg-[#0f172a]/40 backdrop-blur-[2px]"
            />

            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[#e2e8f0]/80 bg-white shadow-xl"
            >
              <div className="flex items-start justify-between border-b border-[#f1f5f9] px-6 py-5">
                <div>
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff6ff] text-[#3b82f6]">
                    <FiUsers className="h-[18px] w-[18px]" />
                  </div>

                  <h2 className="text-base font-bold text-[#1e293b]">
                    {t.transferTitle}
                  </h2>

                  <p className="mt-1 text-xs text-[#64748b] sm:text-sm">
                    {transferModal.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeTransferModal}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] transition hover:bg-[#f8fafc] hover:text-[#475569]"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleTransfer} className="p-6">
                <p className="mb-5 text-xs text-[#64748b] sm:text-sm">
                  {t.transferSubtitle}
                </p>

                <label className="mb-1.5 block text-xs font-semibold text-[#475569]">
                  {t.employeePlaceholder}
                </label>

                <select
                  value={selectedEmployee}
                  onChange={(e) => {
                    const employeeId = e.target.value;
                    const employee = employees.find(
                      (item) => String(item.id) === employeeId,
                    );
                    setSelectedEmployee(employeeId);
                    setTransferJobTitle(
                      typeof employee?.job_title === "string"
                        ? employee.job_title
                        : "",
                    );
                    setTransferJobTitleError("");
                  }}
                  disabled={employeesQuery.isLoading || employeesQuery.isError}
                  className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-xs text-[#334155] outline-none transition focus:border-[#94a3b8] focus:ring-2 focus:ring-[#f1f5f9] disabled:opacity-60 sm:text-sm"
                >
                  <option value="" disabled hidden>
                    {t.employeePlaceholder}
                  </option>
                  {employees
                    .filter(
                      (employee) =>
                        String(getEmployeeDepartmentId(employee)) !==
                        String(transferModal.id),
                    )
                    .map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} · {employee.email}
                      </option>
                    ))}
                </select>
                {(employeesQuery.isLoading || employeesQuery.isError) && (
                  <p
                    className={`mt-1.5 text-xs ${
                      employeesQuery.isError ? "text-red-600" : "text-[#64748b]"
                    }`}
                  >
                    {employeesQuery.isLoading
                      ? t.loading
                      : employeesQuery.error?.response?.data?.message ||
                        (isArabic
                          ? "تعذر تحميل الموظفين."
                          : "Failed to load employees.")}
                  </p>
                )}
                {!employeesQuery.isLoading &&
                  !employeesQuery.isError &&
                  employees.filter(
                    (employee) =>
                      String(getEmployeeDepartmentId(employee)) !==
                      String(transferModal.id),
                  ).length === 0 && (
                    <p className="mt-1.5 text-xs text-[#64748b]">
                      {t.noEmployeesToTransfer}
                    </p>
                  )}

                <label
                  htmlFor="transfer-job-title"
                  className="mt-4 mb-1.5 block text-xs font-semibold text-[#475569]"
                >
                  {t.transferJobTitle}
                </label>
                <input
                  id="transfer-job-title"
                  type="text"
                  value={transferJobTitle}
                  onChange={(e) => {
                    setTransferJobTitle(e.target.value);
                    setTransferJobTitleError("");
                  }}
                  placeholder={t.transferJobTitlePlaceholder}
                  required
                  aria-invalid={Boolean(transferJobTitleError)}
                  className={`w-full rounded-lg border ${
                    transferJobTitleError
                      ? "border-red-500"
                      : "border-[#e2e8f0]"
                  } bg-white px-3 py-2.5 text-xs text-[#334155] outline-none transition focus:border-[#94a3b8] focus:ring-2 focus:ring-[#f1f5f9] sm:text-sm`}
                />
                {transferJobTitleError && (
                  <p
                    className="mt-1.5 text-xs font-medium text-red-600"
                    role="alert"
                  >
                    {transferJobTitleError}
                  </p>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={closeTransferModal}
                    className="flex-1 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2.5 text-xs font-semibold text-[#64748b] transition hover:bg-[#f8fafc] sm:text-sm"
                  >
                    {t.cancelBtn}
                  </button>

                  <button
                    type="submit"
                    disabled={
                      !selectedEmployee || transferEmployeeMutation.isPending
                    }
                    className="flex-1 rounded-lg bg-[#243B53] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1c2f42] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                  >
                    {transferEmployeeMutation.isPending
                      ? t.loading
                      : t.transferBtn}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

async function fetchAllDepartments(lang) {
  const departments = [];
  let page = 1;

  while (true) {
    const response = await getDepartments(lang, { page, per_page: 100 });
    const currentPage = [
      response?.data?.departments,
      response?.departments,
      response?.data?.data?.departments,
      response?.data?.data,
      response?.data,
      response,
    ].find(Array.isArray);

    if (!currentPage) {
      throw new Error("The departments response from the server is invalid.");
    }

    departments.push(...currentPage);

    const pagination = response?.data?.meta || response?.meta || response?.data;
    const responseLastPage = Number(pagination?.last_page);
    if (!Number.isFinite(responseLastPage) || responseLastPage <= page) {
      break;
    }
    page += 1;
  }

  return departments
    .filter((department) => department?.id != null)
    .map((department) => ({
      ...department,
      id: Number(department.id),
      name: department.name || "",
      employees_count: Number(department.employees_count || 0),
    }));
}

async function fetchAllEmployees(lang) {
  const employees = [];
  let page = 1;

  while (true) {
    const response = await getEmployees({ page, per_page: 100, lang });
    const currentPage = [
      response?.data?.employees,
      response?.employees,
      response?.data?.data?.employees,
      response?.data?.data,
      response?.data,
      response,
    ].find(Array.isArray);

    if (!currentPage) {
      throw new Error("The employees response from the server is invalid.");
    }

    employees.push(...currentPage);

    const pagination = response?.data?.meta || response?.meta || response?.data;
    const responseLastPage = Number(pagination?.last_page);
    if (!Number.isFinite(responseLastPage) || responseLastPage <= page) {
      break;
    }
    page += 1;
  }

  return employees;
}

function getEmployeeDepartmentId(employee) {
  return employee.department_id ?? employee.department?.id ?? "";
}

function getDepartmentMembers(employees, departmentId) {
  return employees.filter(
    (employee) =>
      String(getEmployeeDepartmentId(employee)) === String(departmentId),
  );
}
