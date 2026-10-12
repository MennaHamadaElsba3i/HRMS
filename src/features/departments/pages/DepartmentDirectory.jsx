import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { FiBriefcase, FiSearch } from "react-icons/fi";
import { getDepartments } from "../../hr/api";

const copy = {
  en: {
    title: "Departments & Teams",
    subtitle: "Browse the departments and teams across your organization.",
    search: "Search departments or department heads...",
    loading: "Loading departments...",
    loadError: "Could not load departments.",
    retry: "Retry",
    noResults: "No departments found.",
    head: "Department head",
    unassigned: "Unassigned",
    employees: "Employees",
    active: "Active",
    inactive: "Inactive",
    results: "departments",
  },
  ar: {
    title: "الأقسام والفرق",
    subtitle: "استعرض أقسام وفرق المؤسسة.",
    search: "ابحث عن قسم أو رئيس القسم...",
    loading: "جارٍ تحميل الأقسام...",
    loadError: "تعذر تحميل الأقسام.",
    retry: "إعادة المحاولة",
    noResults: "لا توجد أقسام.",
    head: "رئيس القسم",
    unassigned: "غير محدد",
    employees: "الموظفون",
    active: "نشط",
    inactive: "غير نشط",
    results: "أقسام",
  },
};

const EMPTY_DEPARTMENTS = [];

export default function DepartmentDirectory() {
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.toLowerCase().startsWith("ar");
  const lang = isArabic ? "ar" : "en";
  const t = copy[lang];
  const [search, setSearch] = useState("");
  const departmentsQuery = useQuery({
    queryKey: ["departments", "directory", lang],
    queryFn: () => fetchAllDepartments(lang),
  });
  const departments = departmentsQuery.data || EMPTY_DEPARTMENTS;
  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(lang);
    if (!query) return departments;

    return departments.filter((department) =>
      [department.name, department.manager?.name]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase(lang).includes(query)),
    );
  }, [departments, lang, search]);

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="w-full space-y-6 pb-10">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b879f]">
          {isArabic ? "المؤسسة / الأقسام والفرق" : "Organization / Departments"}
        </p>
        <h1 className="mt-1 text-lg font-bold tracking-tight text-[#1e293b] md:text-[21px]">
          {t.title}
        </h1>
        <p className="mt-1 text-sm text-[#64748b]">{t.subtitle}</p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative w-full sm:max-w-sm">
          <FiSearch
            aria-hidden="true"
            className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8] ${
              isArabic ? "right-3" : "left-3"
            }`}
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.search}
            className={`w-full rounded-lg border border-[#e2e8f0] bg-white py-2.5 text-sm text-[#334155] outline-none focus:border-[#94a3b8] ${
              isArabic ? "pr-9 pl-3" : "pl-9 pr-3"
            }`}
          />
        </label>
        {!departmentsQuery.isLoading && !departmentsQuery.isError && (
          <p className="text-xs text-[#64748b]">
            {filteredDepartments.length} {t.results}
          </p>
        )}
      </div>

      {departmentsQuery.isError ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3"
        >
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
      ) : departmentsQuery.isLoading ? (
        <p className="py-8 text-center text-sm text-[#64748b]">{t.loading}</p>
      ) : filteredDepartments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white py-12 text-center text-sm text-[#64748b]">
          {t.noResults}
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDepartments.map((department) => {
            const isActive =
              String(department.status || "").toLowerCase() === "active";

            return (
              <article
                key={department.id}
                className="rounded-2xl border border-[#e2e8f0]/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5f3ff] text-[#8b5cf6]">
                      <FiBriefcase aria-hidden="true" className="h-[18px] w-[18px]" />
                    </div>
                    <h2 className="truncate text-sm font-bold text-[#1e293b] sm:text-base">
                      {department.name || "—"}
                    </h2>
                    <p className="mt-1 truncate text-xs text-[#64748b]">
                      {t.head}: {department.manager?.name || t.unassigned}
                    </p>
                  </div>
                  {department.status && (
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold sm:text-xs ${
                        isActive
                          ? "bg-[#ecfdf5] text-[#16a34a]"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isActive ? t.active : t.inactive}
                    </span>
                  )}
                </div>
                <div className="mt-5 rounded-xl bg-[#f8fafc] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#94a3b8] sm:text-xs">
                    {t.employees}
                  </p>
                  <p className="mt-1 text-base font-bold text-[#0f172a]">
                    {department.employees_count ?? 0}
                  </p>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
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
    const pagination =
      response?.data?.meta ||
      response?.data?.data?.meta ||
      response?.meta ||
      response?.data;
    const lastPage = Number(pagination?.last_page);

    if (!Number.isFinite(lastPage) || lastPage <= page) {
      break;
    }
    page += 1;
  }

  return departments
    .filter((department) => department?.id != null)
    .map((department) => ({
      ...department,
      id: Number(department.id),
      employees_count: Number(department.employees_count || 0),
    }));
}
