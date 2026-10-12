import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  FiMapPin,
  FiLogIn,
  FiLogOut,
  FiLoader,
  FiCheckCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { checkIn, checkOut } from "../features/employee/api/attendanceApi";
import {
  useTodayAttendance,
  getCurrentLocation,
} from "../features/employee/hooks/useTodayAttendance";

const parseWorkedTime = (timeString) => {
  if (!timeString) return 0;
  const parts = String(timeString).split(":").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return 0;
  const [h, m, s] = parts;
  return h * 3600 + m * 60 + s;
};

const formatTime = (totalSeconds) => {
  const s = Math.max(0, Number(totalSeconds) || 0);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
};

/**
 * Reusable Check-in / Check-out widget.
 * Works for Employee, HR, and Manager roles.
 * Uses the shared /api/attendance/check-in and /api/attendance/check-out endpoints.
 */
export default function CheckInOutWidget({ compact = false, className = "" }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    data: attendanceResponse,
    isLoading: attendanceLoading,
    refetch: refetchAttendance,
  } = useTodayAttendance();

  const attendance = attendanceResponse?.data || attendanceResponse;

  // Extract check-in / check-out times safely from backend
  const checkInTime = attendance?.check_in || attendance?.check_in_time || null;
  const checkOutTime = attendance?.check_out || attendance?.check_out_time || null;

  const hasCheckedIn = Boolean(checkInTime);
  const hasCheckedOut = Boolean(checkOutTime);

  const isOnShift = hasCheckedIn && !hasCheckedOut;
  const isShiftFinished = hasCheckedIn && hasCheckedOut;

  // Check In is disabled ONLY if already checked in today
  const isCheckInDisabled = hasCheckedIn;

  // Check Out is disabled if not checked in yet OR already checked out today
  const isCheckOutDisabled = !hasCheckedIn || hasCheckedOut;

  // Live timer
  const [secondsWorked, setSecondsWorked] = useState(0);

  useEffect(() => {
    setSecondsWorked(parseWorkedTime(attendance?.worked_time));
  }, [attendance?.worked_time, checkInTime, checkOutTime]);

  useEffect(() => {
    if (!isOnShift) return;
    const timer = setInterval(() => setSecondsWorked((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, [isOnShift]);

  // Check-in mutation
  const { mutate: doCheckIn, isPending: checkInLoading } = useMutation({
    mutationFn: async () => {
      const location = await getCurrentLocation({ required: true });
      return checkIn({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    },
    onSuccess: () => {
      refetchAttendance();
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          t("attendance.checkInError", "Unable to check in.")
      );
    },
  });

  // Check-out mutation
  const { mutate: doCheckOut, isPending: checkOutLoading } = useMutation({
    mutationFn: async () => {
      const location = await getCurrentLocation({ required: false });
      return checkOut({
        latitude: location?.latitude,
        longitude: location?.longitude,
      });
    },
    onSuccess: () => {
      refetchAttendance();
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          t("attendance.checkOutError", "Unable to check out.")
      );
    },
  });

  const isActionPending = checkInLoading || checkOutLoading;

  // ── COMPACT MODE (for dashboards & headers) ──────────
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Check In button */}
        <button
          type="button"
          onClick={() => !isCheckInDisabled && !isActionPending && doCheckIn()}
          disabled={isCheckInDisabled || isActionPending}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-sm ${
            isCheckInDisabled
              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-75"
              : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
          }`}
        >
          {checkInLoading ? (
            <FiLoader className="h-3.5 w-3.5 animate-spin" />
          ) : hasCheckedIn ? (
            <FiCheckCircle className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <FiLogIn className="h-3.5 w-3.5" />
          )}
          <span>
            {hasCheckedIn
              ? `${t("attendance.checkedIn", "Checked In")}${checkInTime ? ` (${checkInTime})` : ""}`
              : t("attendance.checkIn", "Check In")}
          </span>
        </button>

        {/* Check Out button */}
        <button
          type="button"
          onClick={() => !isCheckOutDisabled && !isActionPending && doCheckOut()}
          disabled={isCheckOutDisabled || isActionPending}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-sm ${
            isCheckOutDisabled
              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60"
              : "bg-rose-500 hover:bg-rose-600 text-white cursor-pointer"
          }`}
        >
          {checkOutLoading ? (
            <FiLoader className="h-3.5 w-3.5 animate-spin" />
          ) : hasCheckedOut ? (
            <FiCheckCircle className="h-3.5 w-3.5 text-slate-500" />
          ) : (
            <FiLogOut className="h-3.5 w-3.5" />
          )}
          <span>
            {hasCheckedOut
              ? `${t("attendance.checkedOut", "Checked Out")}${checkOutTime ? ` (${checkOutTime})` : ""}`
              : t("attendance.checkOut", "Check Out")}
          </span>
        </button>

        {isOnShift && (
          <span className="font-mono text-[11px] font-bold text-[#102a43] bg-slate-100 px-2 py-1 rounded-lg">
            {formatTime(secondsWorked)}
          </span>
        )}
      </div>
    );
  }

  // ── FULL MODE (for dedicated attendance pages) ────────
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1c364f]">
              {t("attendance.todayStatus", "Today's Attendance")}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Live badge */}
          {isOnShift && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        {/* Stats row */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Check-in
            </p>
            <p className="mt-1 text-sm font-bold text-[#1c364f]">
              {checkInTime || "—"}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Check-out
            </p>
            <p className="mt-1 text-sm font-bold text-[#1c364f]">
              {checkOutTime || "—"}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Worked
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-[#1c364f]">
              {isOnShift
                ? formatTime(secondsWorked)
                : attendance?.worked_time || "—"}
            </p>
          </div>
        </div>

        {/* Location badge */}
        {attendance?.distance_meters !== undefined &&
          attendance?.distance_meters !== null && (
            <div
              className={`mb-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium ${
                attendance?.is_inside_radius
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              <FiMapPin className="h-3.5 w-3.5 shrink-0" />
              {attendance?.is_inside_radius
                ? `Inside workplace radius · ${Number(
                    attendance.distance_meters
                  ).toFixed(0)}m from office`
                : `Outside workplace radius · ${Number(
                    attendance.distance_meters
                  ).toFixed(0)}m from office`}
            </div>
          )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Check In Button */}
          <motion.button
            type="button"
            onClick={() => !isCheckInDisabled && !isActionPending && doCheckIn()}
            disabled={isCheckInDisabled || isActionPending}
            whileTap={!isCheckInDisabled ? { scale: 0.98 } : {}}
            className={`flex-1 rounded-xl px-4 py-3 text-xs font-bold shadow-sm transition ${
              isCheckInDisabled
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-75"
                : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              {checkInLoading ? (
                <FiLoader className="h-4 w-4 animate-spin" />
              ) : hasCheckedIn ? (
                <FiCheckCircle className="h-4 w-4 text-emerald-600" />
              ) : (
                <FiLogIn className="h-4 w-4" />
              )}
              {checkInLoading
                ? t("attendance.loading", "Please wait...")
                : hasCheckedIn
                ? `${t("attendance.checkedIn", "Checked In")}${checkInTime ? ` (${checkInTime})` : ""}`
                : t("attendance.checkIn", "Check In")}
            </span>
          </motion.button>

          {/* Check Out Button */}
          <motion.button
            type="button"
            onClick={() => !isCheckOutDisabled && !isActionPending && doCheckOut()}
            disabled={isCheckOutDisabled || isActionPending}
            whileTap={!isCheckOutDisabled ? { scale: 0.98 } : {}}
            className={`flex-1 rounded-xl px-4 py-3 text-xs font-bold shadow-sm transition ${
              isCheckOutDisabled
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60"
                : "bg-rose-500 hover:bg-rose-600 text-white cursor-pointer"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              {checkOutLoading ? (
                <FiLoader className="h-4 w-4 animate-spin" />
              ) : hasCheckedOut ? (
                <FiCheckCircle className="h-4 w-4 text-slate-500" />
              ) : (
                <FiLogOut className="h-4 w-4" />
              )}
              {checkOutLoading
                ? t("attendance.loading", "Please wait...")
                : hasCheckedOut
                ? `${t("attendance.checkedOut", "Checked Out")}${checkOutTime ? ` (${checkOutTime})` : ""}`
                : t("attendance.checkOut", "Check Out")}
            </span>
          </motion.button>
        </div>

        {/* Shift finished status */}
        {isShiftFinished && (
          <div className="mt-3 w-full rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-center text-xs font-bold text-emerald-700 flex items-center justify-center gap-2">
            <FiCheckCircle className="h-4 w-4" />
            <span>
              {t(
                "attendance.shiftFinishedFull",
                "Shift completed for today. Thank you!"
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
