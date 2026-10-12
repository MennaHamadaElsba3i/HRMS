import { useEffect, useState } from "react";
import axiosInstance from "../../../utils/axiosInstance";

export default function PerformanceDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(
      "https://workwise-production-3941.up.railway.app/api/employee/performance-dashboard",
      {
        headers: {
          Accept: "application/json",
          "ngrok-skip-browser-warning": "true",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      },
    )
      .then((res) => res.json())
      .then((json) => setData(json.data))
      .catch(() => setError("حصل خطأ في الاتصال بالسيرفر"));
  }, []);

  if (error) return <h2>❌ {error}</h2>;
  if (!data) return <h2>⏳ جاري التحميل...</h2>;

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>📊 Dashboard أداء الموظف</h1>
      <p>الفترة: {data.period_name}</p>
      <h2>
        الدرجة الكلية: {data.overall.score}{" "}
        {data.overall.trend === "up" ? "📈" : "📉"}
      </h2>

      <h3>نظرة سريعة:</h3>
      <ul>
        <li>المهام: {data.at_a_glance.tasks_rate}%</li>
        <li>الجودة: {data.at_a_glance.quality_rate}%</li>
        <li>الحضور: {data.at_a_glance.attendance_rate}%</li>
      </ul>

      <h3>الحضور:</h3>
      <p>
        حاضر {data.metrics.attendance.present_days} يوم من{" "}
        {data.metrics.attendance.total_days} — متأخر{" "}
        {data.metrics.attendance.late_days}
      </p>

      <h3>المهام:</h3>
      <p>
        إجمالي {data.metrics.tasks.total_tasks} — مكتملة{" "}
        {data.metrics.tasks.completed_tasks} — متأخرة{" "}
        {data.metrics.tasks.overdue_tasks}
      </p>

      <h3>الأهداف:</h3>
      <p>
        مكتملة {data.metrics.goals.completed_goals} من{" "}
        {data.metrics.goals.total_goals}
      </p>

      <h3>التقييمات:</h3>
      <p>
        آخر تقييم {data.metrics.evaluations.latest_overall_score} — الاتجاه:{" "}
        {data.metrics.evaluations.trend}
      </p>
    </div>
  );
}
