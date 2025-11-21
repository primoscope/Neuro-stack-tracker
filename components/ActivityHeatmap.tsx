"use client";

import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import { ActivityCalendar } from "react-activity-calendar";

export function ActivityHeatmap() {
  const { logEntries } = useStore();

  const heatmapData = useMemo(() => {
    // Group logs by date and calculate average functionality
    const dateMap = new Map<string, { functionality: number; anxiety: number; count: number }>();

    logEntries.forEach((log) => {
      const existing = dateMap.get(log.date);
      if (existing) {
        existing.functionality += log.functionality;
        existing.anxiety += log.anxiety;
        existing.count += 1;
      } else {
        dateMap.set(log.date, {
          functionality: log.functionality,
          anxiety: log.anxiety,
          count: 1,
        });
      }
    });

    // Convert to activity calendar format
    const data = Array.from(dateMap.entries()).map(([date, stats]) => {
      const avgFunctionality = stats.functionality / stats.count;
      const avgAnxiety = stats.anxiety / stats.count;
      
      // Level based on functionality (higher is better, darker green)
      // If anxiety is high, make it reddish
      let level = 0;
      if (avgAnxiety > 7) {
        // High anxiety days
        level = 1;
      } else if (avgFunctionality >= 8) {
        level = 4;
      } else if (avgFunctionality >= 6) {
        level = 3;
      } else if (avgFunctionality >= 4) {
        level = 2;
      } else {
        level = 1;
      }

      return {
        date,
        count: stats.count,
        level,
      };
    });

    return data;
  }, [logEntries]);

  if (heatmapData.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-slate-500">
        <p>Start logging to see your consistency heatmap!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <ActivityCalendar
        data={heatmapData}
        theme={{
          dark: ["#1e293b", "#0f766e", "#14b8a6", "#2dd4bf", "#5eead4"],
        }}
        labels={{
          legend: {
            less: "Low",
            more: "High Functionality",
          },
          totalCount: "{{count}} logs in the last year",
        }}
        showWeekdayLabels
        blockSize={14}
        blockMargin={4}
        fontSize={14}
      />
    </div>
  );
}
