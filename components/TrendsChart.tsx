"use client";

import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function TrendsChart() {
  const { logEntries, compounds } = useStore();

  const chartData = useMemo(() => {
    // Group logs by date and calculate daily totals
    const dateMap = new Map<string, {
      date: string;
      anxiety: number;
      functionality: number;
      totalDose: number;
      count: number;
      logs: typeof logEntries;
    }>();

    logEntries.forEach((log) => {
      const existing = dateMap.get(log.date);
      const totalDose = log.doseItems.reduce((sum, item) => sum + item.dose, 0);

      if (existing) {
        existing.anxiety += log.anxiety;
        existing.functionality += log.functionality;
        existing.totalDose += totalDose;
        existing.count += 1;
        existing.logs.push(log);
      } else {
        dateMap.set(log.date, {
          date: log.date,
          anxiety: log.anxiety,
          functionality: log.functionality,
          totalDose,
          count: 1,
          logs: [log],
        });
      }
    });

    // Calculate averages and format for chart
    const data = Array.from(dateMap.values())
      .map((item) => ({
        date: new Date(item.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        anxiety: Number((item.anxiety / item.count).toFixed(1)),
        functionality: Number((item.functionality / item.count).toFixed(1)),
        totalDose: Number(item.totalDose.toFixed(0)),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days

    return data;
  }, [logEntries]);

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-500">
        <p>No data to display. Start logging to see trends!</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="date"
          stroke="#94a3b8"
          tick={{ fill: "#94a3b8" }}
          style={{ fontSize: "12px" }}
        />
        <YAxis
          yAxisId="left"
          stroke="#94a3b8"
          tick={{ fill: "#94a3b8" }}
          label={{ value: "Score (1-10)", angle: -90, position: "insideLeft", fill: "#94a3b8" }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#94a3b8"
          tick={{ fill: "#94a3b8" }}
          label={{ value: "Total Dose (mg)", angle: 90, position: "insideRight", fill: "#94a3b8" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            color: "#f1f5f9",
          }}
        />
        <Legend wrapperStyle={{ paddingTop: "20px" }} />
        <Bar
          yAxisId="right"
          dataKey="totalDose"
          fill="#3b82f6"
          opacity={0.6}
          name="Total Dose"
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="anxiety"
          stroke="#ff4444"
          strokeWidth={2}
          dot={{ fill: "#ff4444", r: 4 }}
          name="Anxiety"
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="functionality"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: "#10b981", r: 4 }}
          name="Functionality"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
