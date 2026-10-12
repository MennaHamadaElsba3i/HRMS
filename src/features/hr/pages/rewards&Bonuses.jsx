import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiDollarSign,
  FiClock,
  FiAward,
  FiX,
  FiCheck,
} from "react-icons/fi";

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: {
      duration: 0.18,
    },
  },
};

export default function RewardsAndBonuses({ isAdmin = false }) {
  const { i18n } = useTranslation();
  const location = useLocation();

  const currentLang = i18n.language || "en";
  const isArabic = currentLang?.startsWith("ar");

  const isSystemAdmin =
    isAdmin ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/owner");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [employee, setEmployee] = useState("");
  const [incentiveCategory, setIncentiveCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const content = {
    en: {
      title: "Rewards & Bonuses",
      subtitle:
        "Recognize performance and route approved incentives into payroll.",
      issueBtn: "Issue Employee Incentive",

      card1Title: "TOTAL BONUS POOL DISTRIBUTED",
      card1Amount: "$14,200",
      card1Sub: "September 2026",

      card2Title: "PENDING APPROVALS",
      card2Count: "3",
      card2Sub: "Awaiting manager review",

      card3Title: "TOP REWARDED DEPARTMENT",
      card3Dept: "Sales",
      card3Sub: "42% of issued incentives",

      tableTitle: "Incentive register",

      colEmployee: "EMPLOYEE",
      colRole: "ROLE",
      colType: "INCENTIVE TYPE",
      colAmount: "APPROVED AMOUNT",
      colMonth: "TARGET PAYROLL MONTH",
      colManager: "APPROVING MANAGER",
      colStatus: "STATUS",

      perfBonus: "Performance Bonus",
      salesComm: "Sales Commission",
      eidReward: "Seasonal Eid Reward",

      statusQueued: "Queued for Payroll",
      statusPaid: "Paid",

      modalTitle: "Issue Employee Incentive",
      labelEmployee: "Employee",
      placeholderEmployee: "Employee",
      labelCategory: "Incentive category",
      placeholderCategory: "Incentive category",
      labelAmount: "Amount",
      placeholderAmount: "Amount",
      labelReason: "Reason",
      placeholderReason: "Reason",

      cancelBtn: "Cancel",
      saveBtn: "Save changes",
      successTitle: "Incentive issued successfully",
      doneBtn: "Done",
    },

    ar: {
      title: "المكافآت والحوافز",
      subtitle: "تقدير الأداء وتوجيه الحوافز المعتمدة إلى كشوف المرتبات.",
      issueBtn: "صرف حافز للموظف",

      card1Title: "إجمالي إيرادات المكافآت الموزعة",
      card1Amount: "$14,200",
      card1Sub: "سبتمبر 2026",

      card2Title: "الموافقات المعلقة",
      card2Count: "3",
      card2Sub: "في انتظار مراجعة المدير",

      card3Title: "القسم الأكثر مكافأة",
      card3Dept: "المبيعات",
      card3Sub: "42% من الحوافز المصدرة",

      tableTitle: "سجل الحوافز",

      colEmployee: "الموظف",
      colRole: "الوظيفة",
      colType: "نوع الحافز",
      colAmount: "المبلغ المعتمد",
      colMonth: "شهر الرواتب المستهدف",
      colManager: "المدير الموافق",
      colStatus: "الحالة",

      perfBonus: "مكافأة أداء",
      salesComm: "عمولة مبيعات",
      eidReward: "مكافأة العيد الموسمية",

      statusQueued: "مدرج للرواتب",
      statusPaid: "مدفوع",

      modalTitle: "إصدار حافز للموظف",
      labelEmployee: "الموظف",
      placeholderEmployee: "الموظف",
      labelCategory: "فئة الحافز",
      placeholderCategory: "فئة الحافز",
      labelAmount: "المبلغ",
      placeholderAmount: "المبلغ",
      labelReason: "السبب",
      placeholderReason: "السبب",

      cancelBtn: "إلغاء",
      saveBtn: "حفظ التغييرات",
      successTitle: "تم إصدار الحافز بنجاح",
      doneBtn: "تم",
    },
  };

  const t = isArabic ? content.ar : content.en;

  const handleSave = (e) => {
    e.preventDefault();

    console.log({
      employee,
      incentiveCategory,
      amount,
      reason,
    });

    setIsSuccess(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsSuccess(false);
    setEmployee("");
    setIncentiveCategory("");
    setAmount("");
    setReason("");
  };

  return (
    <motion.div
      dir={isArabic ? "rtl" : "ltr"}
      className="w-full space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* ================= HEADER ================= */}
      <motion.div
        variants={pageVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div>
          <p className="text-[11px] font-bold tracking-wider text-[#6b879f] uppercase">
            {isSystemAdmin
              ? isArabic
                ? "إدارة النظام · المالية"
                : "Admin Management · Financial"
              : isArabic
                ? "الموارد البشرية · المالية"
                : "HR Management · Financial"}
          </p>

          <h1 className="mt-1 text-lg font-bold tracking-tight text-[#1e293b] md:text-[21px]">
            {t.title}
          </h1>

          <p className="mt-1 text-sm font-normal text-[#64748b]">
            {t.subtitle}
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setIsSuccess(false);
          }}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#243B53] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1c2f42]"
        >
          <FiPlus size={16} />
          {t.issueBtn}
        </button>
      </motion.div>

      {/* ================= STAT CARDS ================= */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1 */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4 }}
          className="rounded-2xl border border-[#e2e8f0]/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-shadow duration-200 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                {t.card1Title}
              </p>

              <p className="mt-2 text-[27px] font-bold tracking-tight text-[#0f172a]">
                {t.card1Amount}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#10b981]">
              <FiDollarSign size={17} />
            </div>
          </div>

          <p className="mt-4 text-xs font-normal text-[#64748b]">
            {t.card1Sub}
          </p>
        </motion.div>

        {/* Card 2 */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4 }}
          className="rounded-2xl border border-[#e2e8f0]/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-shadow duration-200 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                {t.card2Title}
              </p>

              <p className="mt-2 text-[27px] font-bold tracking-tight text-[#0f172a]">
                {t.card2Count}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff7ed] text-[#f97316]">
              <FiClock size={17} />
            </div>
          </div>

          <p className="mt-4 text-xs font-normal text-[#64748b]">
            {t.card2Sub}
          </p>
        </motion.div>

        {/* Card 3 */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -4 }}
          className="rounded-2xl border border-[#e2e8f0]/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-shadow duration-200 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                {t.card3Title}
              </p>

              <p className="mt-2 text-[27px] font-bold tracking-tight text-[#0f172a]">
                {t.card3Dept}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5f3ff] text-[#8b5cf6]">
              <FiAward size={17} />
            </div>
          </div>

          <p className="mt-4 text-xs font-normal text-[#64748b]">
            {t.card3Sub}
          </p>
        </motion.div>
      </div>

      {/* ================= INCENTIVE REGISTER ================= */}
      <motion.div
        variants={itemVariants}
        className="overflow-hidden rounded-2xl border border-[#e2e8f0]/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
      >
        {/* Section Header */}
        <div className="flex items-center gap-3 border-b border-[#f1f5f9] p-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eff6ff] text-[#3b82f6]">
            <FiAward size={17} />
          </div>

          <h2 className="text-base font-bold text-[#1e293b]">{t.tableTitle}</h2>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table
            className={`w-full min-w-[1000px] border-collapse ${
              isArabic ? "text-right" : "text-left"
            }`}
          >
            <thead>
              <tr className="border-b border-[#f1f5f9]">
                <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                  {t.colEmployee}
                </th>

                <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                  {t.colRole}
                </th>

                <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                  {t.colType}
                </th>

                <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                  {t.colAmount}
                </th>

                <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                  {t.colMonth}
                </th>

                <th className="p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
                  {t.colManager}
                </th>

                <th
                  className={`p-5 text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase ${
                    isArabic ? "text-left" : "text-right"
                  }`}
                >
                  {t.colStatus}
                </th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {/* ================= ROW 1 ================= */}
              <tr className="border-b border-[#f1f5f9] transition hover:bg-[#f8fafc]">
                <td className="p-5 font-bold text-[#1e293b]">Mariam Hassan</td>

                <td className="p-5 text-xs text-[#64748b]">
                  Engineering Manager
                </td>

                <td className="p-5">
                  <span className="inline-flex rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#475569]">
                    {t.perfBonus}
                  </span>
                </td>

                <td className="p-5 font-bold text-[#0f172a]">$2,500</td>

                <td className="p-5 text-[#64748b]">September 2026</td>

                <td className="p-5 text-[#475569]">Sarah Ahmed</td>

                <td className={`p-5 ${isArabic ? "text-left" : "text-right"}`}>
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-full
                      border border-[#fed7aa]
                      bg-[#fff7ed]
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      text-[#c2410c]
                    "
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#f97316]" />
                    {t.statusQueued}
                  </span>
                </td>
              </tr>

              {/* ================= ROW 2 ================= */}
              <tr className="border-b border-[#f1f5f9] transition hover:bg-[#f8fafc]">
                <td className="p-5 font-bold text-[#1e293b]">Omar Khaled</td>

                <td className="p-5 text-xs text-[#64748b]">Sales Executive</td>

                <td className="p-5">
                  <span className="inline-flex rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#475569]">
                    {t.salesComm}
                  </span>
                </td>

                <td className="p-5 font-bold text-[#0f172a]">$1,800</td>

                <td className="p-5 text-[#64748b]">September 2026</td>

                <td className="p-5 text-[#475569]">Mariam Hassan</td>

                <td className={`p-5 ${isArabic ? "text-left" : "text-right"}`}>
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-full
                      border border-[#d1fae5]
                      bg-[#ecfdf5]
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      text-[#059669]
                    "
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                    {t.statusPaid}
                  </span>
                </td>
              </tr>

              {/* ================= ROW 3 ================= */}
              <tr className="transition hover:bg-[#f8fafc]">
                <td className="p-5 font-bold text-[#1e293b]">Nour Adel</td>

                <td className="p-5 text-xs text-[#64748b]">
                  People Ops Specialist
                </td>

                <td className="p-5">
                  <span className="inline-flex rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#475569]">
                    {t.eidReward}
                  </span>
                </td>

                <td className="p-5 font-bold text-[#0f172a]">$600</td>

                <td className="p-5 text-[#64748b]">September 2026</td>

                <td className="p-5 text-[#475569]">Sarah Ahmed</td>

                <td className={`p-5 ${isArabic ? "text-left" : "text-right"}`}>
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-full
                      border border-[#d1fae5]
                      bg-[#ecfdf5]
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      text-[#059669]
                    "
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                    {t.statusPaid}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ================= MODAL ================= */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/40 p-4 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#e2e8f0]/80 bg-white shadow-xl"
            >
              {!isSuccess ? (
                <>
                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-[#f1f5f9] px-6 py-5">
                    <div>
                      <h3 className="text-base font-bold text-[#1e293b]">
                        {t.modalTitle}
                      </h3>

                      <p className="mt-1 text-xs text-[#64748b] sm:text-sm">
                        {t.issueBtn}
                      </p>
                    </div>

                    <button
                      onClick={handleCloseModal}
                      className="rounded-lg p-2 text-[#94a3b8] transition hover:bg-[#f8fafc] hover:text-[#475569]"
                    >
                      <FiX size={18} />
                    </button>
                  </div>

                  {/* Modal Form */}
                  <form onSubmit={handleSave} className="space-y-5 p-6">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      {/* Employee */}
                      <div>
                        <label className="mb-2 block text-[11px] font-bold tracking-wider text-[#64748b] uppercase">
                          {t.labelEmployee}
                        </label>

                        <input
                          type="text"
                          value={employee}
                          onChange={(e) => setEmployee(e.target.value)}
                          placeholder={t.placeholderEmployee}
                          className="
                            w-full
                            rounded-lg
                            border border-[#e2e8f0]
                            bg-white
                            px-3
                            py-2.5
                            text-xs
                            text-[#475569]
                            outline-none
                            transition
                            placeholder:text-[#94a3b8]
                            focus:border-[#94a3b8]
                            focus:ring-2
                            focus:ring-[#f1f5f9]
                          "
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="mb-2 block text-[11px] font-bold tracking-wider text-[#64748b] uppercase">
                          {t.labelCategory}
                        </label>

                        <input
                          type="text"
                          value={incentiveCategory}
                          onChange={(e) => setIncentiveCategory(e.target.value)}
                          placeholder={t.placeholderCategory}
                          className="
                            w-full
                            rounded-lg
                            border border-[#e2e8f0]
                            bg-white
                            px-3
                            py-2.5
                            text-xs
                            text-[#475569]
                            outline-none
                            transition
                            placeholder:text-[#94a3b8]
                            focus:border-[#94a3b8]
                            focus:ring-2
                            focus:ring-[#f1f5f9]
                          "
                        />
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="mb-2 block text-[11px] font-bold tracking-wider text-[#64748b] uppercase">
                          {t.labelAmount}
                        </label>

                        <input
                          type="text"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder={t.placeholderAmount}
                          className="
                            w-full
                            rounded-lg
                            border border-[#e2e8f0]
                            bg-white
                            px-3
                            py-2.5
                            text-xs
                            text-[#475569]
                            outline-none
                            transition
                            placeholder:text-[#94a3b8]
                            focus:border-[#94a3b8]
                            focus:ring-2
                            focus:ring-[#f1f5f9]
                          "
                        />
                      </div>

                      {/* Reason */}
                      <div>
                        <label className="mb-2 block text-[11px] font-bold tracking-wider text-[#64748b] uppercase">
                          {t.labelReason}
                        </label>

                        <input
                          type="text"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder={t.placeholderReason}
                          className="
                            w-full
                            rounded-lg
                            border border-[#e2e8f0]
                            bg-white
                            px-3
                            py-2.5
                            text-xs
                            text-[#475569]
                            outline-none
                            transition
                            placeholder:text-[#94a3b8]
                            focus:border-[#94a3b8]
                            focus:ring-2
                            focus:ring-[#f1f5f9]
                          "
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 border-t border-[#f1f5f9] pt-4">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="
                          rounded-lg
                          border border-[#e2e8f0]
                          bg-white
                          px-4
                          py-2.5
                          text-xs
                          font-semibold
                          text-[#475569]
                          transition
                          hover:bg-[#f8fafc]
                        "
                      >
                        {t.cancelBtn}
                      </button>

                      <button
                        type="submit"
                        className="
                          rounded-lg
                          bg-[#243B53]
                          px-4
                          py-2.5
                          text-xs
                          font-semibold
                          text-white
                          transition
                          hover:bg-[#1c2f42]
                        "
                      >
                        {t.saveBtn}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                /* ================= SUCCESS ================= */
                <div className="flex flex-col items-center justify-center p-10 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#10b981]">
                    <FiCheck size={26} strokeWidth={2.5} />
                  </div>

                  <h3 className="mt-5 text-base font-bold text-[#1e293b]">
                    {t.successTitle}
                  </h3>

                  <button
                    onClick={handleCloseModal}
                    className="
                      mt-6
                      w-full
                      max-w-[180px]
                      rounded-lg
                      bg-[#243B53]
                      px-4
                      py-2.5
                      text-sm
                      font-semibold
                      text-white
                      transition
                      hover:bg-[#1c2f42]
                    "
                  >
                    {t.doneBtn}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
