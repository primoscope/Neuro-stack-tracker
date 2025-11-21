"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, AreaChart, ResponsiveContainer, ReferenceLine } from "recharts";
import { CompoundDetail } from "@/lib/compound-types";
import { Compound, DoseItem } from "@/lib/types";
import { AlertTriangle } from "lucide-react";

interface StackTimelineProps {
  compounds: Compound[];
  doseItems: DoseItem[];
  libraryCompounds?: Map<string, CompoundDetail>;
  className?: string;
}

interface TimePoint {
  hour: number;
  timeLabel: string;
  neuroLoad: number;
  activeDoses: number;
  crashRisk: number;
}

/**
 * StackTimeline Component
 * Visualizes the aggregate "Neuro-Load" or "Stimulation Curve" over a 24-hour period
 * Shows the superposition of Onset, Peak, and Duration windows for all active compounds
 */
export function StackTimeline({
  compounds,
  doseItems,
  libraryCompounds,
  className = "",
}: StackTimelineProps) {
  const timelineData = useMemo(() => {
    // Generate data points for 24 hours (every 30 minutes)
    const points: TimePoint[] = [];
    const now = new Date();
    
    for (let i = 0; i <= 48; i++) {
      const hour = i * 0.5;
      const timeLabel = formatHour(hour);
      
      let neuroLoad = 0;
      let activeDoses = 0;
      let wearingOff = 0; // Track compounds ending

      // Calculate contribution from each dose
      doseItems.forEach((doseItem) => {
        const compound = compounds.find((c) => c.id === doseItem.compoundId);
        if (!compound) return;

        // Get pharmacokinetic data from library if available
        const libraryCompound = libraryCompounds?.get(compound.name.toLowerCase());
        
        // Use library data or defaults
        const onset = libraryCompound?.onset?.onsetMin || 30; // minutes
        const peak = libraryCompound?.onset?.peakMin || 60;
        const duration = libraryCompound?.onset?.durationMin || 240;

        // Calculate time since dose (in minutes)
        const timeSinceDose = (hour * 60) - ((new Date(doseItem.timestamp).getHours() + new Date(doseItem.timestamp).getMinutes() / 60) * 60);
        
        // Calculate effect curve using a simplified model
        let effect = 0;
        
        if (timeSinceDose >= 0) {
          if (timeSinceDose < onset) {
            // Onset phase: linear ramp-up
            effect = (timeSinceDose / onset) * 0.3;
          } else if (timeSinceDose < peak) {
            // Rising to peak
            effect = 0.3 + ((timeSinceDose - onset) / (peak - onset)) * 0.7;
          } else if (timeSinceDose < duration) {
            // Decay from peak
            const decayProgress = (timeSinceDose - peak) / (duration - peak);
            effect = 1.0 * Math.exp(-2 * decayProgress); // Exponential decay
            
            // Check if ending soon (last 25% of duration)
            if (decayProgress > 0.75 && effect > 0.2) {
              wearingOff += effect;
            }
          }
          
          if (effect > 0.1) {
            activeDoses += 1;
          }
        }
        
        neuroLoad += effect;
      });

      // Calculate crash risk (when multiple compounds wear off simultaneously)
      const crashRisk = wearingOff > 1.5 ? wearingOff : 0;

      points.push({
        hour,
        timeLabel,
        neuroLoad: Math.round(neuroLoad * 100) / 100,
        activeDoses,
        crashRisk: Math.round(crashRisk * 100) / 100,
      });
    }

    return points;
  }, [compounds, doseItems, libraryCompounds]);

  // Find crash zones (when crashRisk > 0)
  const crashZones = useMemo(() => {
    const zones: Array<{ start: number; end: number; risk: number }> = [];
    let currentZone: { start: number; end: number; risk: number } | null = null;

    timelineData.forEach((point) => {
      if (point.crashRisk > 0) {
        if (!currentZone) {
          currentZone = { start: point.hour, end: point.hour, risk: point.crashRisk };
        } else {
          currentZone.end = point.hour;
          currentZone.risk = Math.max(currentZone.risk, point.crashRisk);
        }
      } else if (currentZone) {
        zones.push(currentZone);
        currentZone = null;
      }
    });

    if (currentZone) zones.push(currentZone);
    return zones;
  }, [timelineData]);

  const maxNeuroLoad = useMemo(() => {
    return Math.max(...timelineData.map((d) => d.neuroLoad), 1);
  }, [timelineData]);

  if (doseItems.length === 0) {
    return (
      <div className={`text-center py-8 text-slate-400 ${className}`}>
        <p>No active doses to visualize</p>
        <p className="text-sm mt-2">Log compounds to see your Neuro-Load curve</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Crash Warnings */}
      {crashZones.length > 0 && (
        <div className="mb-4 space-y-2">
          {crashZones.map((zone, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-400 text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>
                Potential crash zone detected: {zone.start.toFixed(1)}h - {zone.end.toFixed(1)}h
                (Risk: {zone.risk.toFixed(1)})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Timeline Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={timelineData}>
          <defs>
            <linearGradient id="neuroLoadGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="crashRiskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="timeLabel"
            stroke="#64748b"
            tick={{ fill: "#64748b", fontSize: 12 }}
            interval={3}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fill: "#64748b", fontSize: 12 }}
            domain={[0, maxNeuroLoad * 1.2]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#e2e8f0",
            }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(value: number, name: string) => {
              if (name === "neuroLoad") return [value.toFixed(2), "Neuro-Load"];
              if (name === "crashRisk") return [value.toFixed(2), "Crash Risk"];
              if (name === "activeDoses") return [value, "Active Doses"];
              return [value, name];
            }}
          />
          <Legend
            wrapperStyle={{ color: "#94a3b8" }}
            iconType="circle"
          />
          <Area
            type="monotone"
            dataKey="neuroLoad"
            stroke="#3b82f6"
            fill="url(#neuroLoadGradient)"
            strokeWidth={2}
            name="Neuro-Load"
          />
          <Area
            type="monotone"
            dataKey="crashRisk"
            stroke="#f97316"
            fill="url(#crashRiskGradient)"
            strokeWidth={2}
            name="Crash Risk"
          />
          {/* Current time marker */}
          <ReferenceLine
            x={formatHour(new Date().getHours() + new Date().getMinutes() / 60)}
            stroke="#10b981"
            strokeDasharray="3 3"
            label={{ value: "Now", fill: "#10b981", fontSize: 12 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 text-xs text-slate-400 space-y-1">
        <p>
          <span className="text-blue-400">●</span> Neuro-Load: Aggregate stimulation/effect intensity from all compounds
        </p>
        <p>
          <span className="text-orange-400">●</span> Crash Risk: Indicates when multiple compounds wear off simultaneously
        </p>
      </div>
    </div>
  );
}

/**
 * Helper to format hour as HH:MM
 */
function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
