"use client";

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { Clock, TrendingUp, AlertTriangle } from 'lucide-react';

interface CompoundPharmacokinetics {
  name: string;
  color: string;
  onsetMinutes: number;    // Minutes from start
  peakMinutes: number;      // Minutes from start
  durationMinutes: number;  // Total duration
  doseTime: number;         // Hour of day (0-23)
}

interface NeuroCurveProps {
  compounds: CompoundPharmacokinetics[];
  onPeakOverload?: (time: number, compounds: string[]) => void;
}

/**
 * Neuro-Curve Visualization - Pharmacokinetics 2.0
 * Maps compound effects on a 24-hour timeline, showing overlapping peaks
 */
export default function NeuroCurveVisualization({ compounds, onPeakOverload }: NeuroCurveProps) {
  // Generate timeline data points (every 30 minutes)
  const timelineData = useMemo(() => {
    const dataPoints: any[] = [];
    const hoursInDay = 24;
    const intervalsPerHour = 2; // Every 30 minutes
    const totalIntervals = hoursInDay * intervalsPerHour;

    for (let i = 0; i < totalIntervals; i++) {
      const hour = i / intervalsPerHour;
      const dataPoint: any = {
        time: hour,
        timeLabel: formatHour(hour),
        aggregate: 0,
      };

      // Calculate effect intensity for each compound at this time
      compounds.forEach(compound => {
        const effectIntensity = calculateEffectIntensity(hour, compound);
        dataPoint[compound.name] = effectIntensity;
        dataPoint.aggregate += effectIntensity;
      });

      dataPoints.push(dataPoint);
    }

    return dataPoints;
  }, [compounds]);

  // Identify peak overload periods (aggregate > threshold)
  const overloadPeriods = useMemo(() => {
    const threshold = 2.5; // Aggregate effect threshold
    const periods: Array<{ start: number; end: number; compounds: string[] }> = [];
    
    if (compounds.length === 0) return periods;

    interface PeriodType { start: number; end: number; compounds: Set<string> }
    let currentPeriod: PeriodType | null = null;

    timelineData.forEach(point => {
      if (point.aggregate > threshold) {
        // Find which compounds are peaking
        const peakingCompounds = compounds
          .filter(c => point[c.name] > 0.6)
          .map(c => c.name);

        if (!currentPeriod) {
          currentPeriod = {
            start: point.time,
            end: point.time,
            compounds: new Set(peakingCompounds),
          };
        } else {
          currentPeriod.end = point.time;
          peakingCompounds.forEach(c => (currentPeriod as PeriodType).compounds.add(c));
        }
      } else if (currentPeriod) {
        periods.push({
          start: currentPeriod.start,
          end: currentPeriod.end,
          compounds: Array.from(currentPeriod.compounds),
        });
        currentPeriod = null;
      }
    });

    // Push last period if exists
    if (currentPeriod) {
      const period = currentPeriod as PeriodType;
      periods.push({
        start: period.start,
        end: period.end,
        compounds: Array.from(period.compounds),
      });
    }

    return periods;
  }, [timelineData, compounds]);

  // Identify crash periods (aggregate drops significantly)
  const crashPeriods = useMemo(() => {
    const periods: Array<{ time: number; severity: number }> = [];
    
    for (let i = 1; i < timelineData.length; i++) {
      const prev = timelineData[i - 1].aggregate;
      const curr = timelineData[i].aggregate;
      const drop = prev - curr;
      
      if (drop > 0.5 && prev > 1.5) {
        periods.push({
          time: timelineData[i].time,
          severity: drop,
        });
      }
    }

    return periods;
  }, [timelineData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-sm font-semibold text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            entry.dataKey !== 'aggregate' && entry.value > 0 && (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-300">{entry.dataKey}:</span>
                <span className="text-white font-medium">
                  {(entry.value * 100).toFixed(0)}%
                </span>
              </div>
            )
          ))}
          <div className="mt-2 pt-2 border-t border-slate-700">
            <div className="flex items-center gap-2 text-xs">
              <TrendingUp className="w-3 h-3 text-purple-400" />
              <span className="text-slate-400">Total Effect:</span>
              <span className="text-purple-400 font-semibold">
                {((payload[0]?.payload?.aggregate || 0) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">24-Hour Neuro-Curve</h3>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timelineData}>
            <defs>
              {compounds.map((compound, idx) => (
                <linearGradient key={idx} id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={compound.color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={compound.color} stopOpacity={0.1} />
                </linearGradient>
              ))}
              <linearGradient id="gradientAggregate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="timeLabel"
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              interval={3}
            />
            <YAxis
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              label={{ value: 'Effect Intensity', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Aggregate effect area */}
            <Area
              type="monotone"
              dataKey="aggregate"
              stroke="#a78bfa"
              strokeWidth={3}
              fill="url(#gradientAggregate)"
              name="Total Effect"
            />

            {/* Individual compound lines */}
            {compounds.map((compound, idx) => (
              <Area
                key={idx}
                type="monotone"
                dataKey={compound.name}
                stroke={compound.color}
                strokeWidth={2}
                fill={`url(#gradient-${idx})`}
              />
            ))}

            {/* Reference lines for overload zones */}
            <ReferenceLine
              y={2.5}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{ value: 'Overload Threshold', fill: '#ef4444', fontSize: 10 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Warnings & Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Peak Overload Warnings */}
        {overloadPeriods.length > 0 && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <h4 className="font-semibold text-red-300">Peak Overload Periods</h4>
            </div>
            <div className="space-y-2">
              {overloadPeriods.map((period, idx) => (
                <div key={idx} className="text-sm">
                  <div className="text-red-200 font-medium">
                    {formatHour(period.start)} - {formatHour(period.end)}
                  </div>
                  <div className="text-red-300/80 text-xs">
                    Multiple compounds peaking: {period.compounds.join(', ')}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-red-400/70 mt-3">
              ⚠️ Consider spacing these compounds to avoid overstimulation
            </p>
          </div>
        )}

        {/* Crash Periods */}
        {crashPeriods.length > 0 && (
          <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-orange-400 rotate-180" />
              <h4 className="font-semibold text-orange-300">Potential Crash Periods</h4>
            </div>
            <div className="space-y-2">
              {crashPeriods.map((period, idx) => (
                <div key={idx} className="text-sm">
                  <div className="text-orange-200 font-medium">
                    Around {formatHour(period.time)}
                  </div>
                  <div className="text-orange-300/80 text-xs">
                    Effect drops significantly (severity: {period.severity.toFixed(1)})
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-orange-400/70 mt-3">
              💡 Consider adding compounds to bridge these gaps
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 items-center text-sm">
        <span className="text-slate-400">Compounds:</span>
        {compounds.map((compound, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: compound.color }}
            />
            <span className="text-slate-300">{compound.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Calculate effect intensity at a given time for a compound
 * Uses a bell curve approximation based on onset, peak, and duration
 */
function calculateEffectIntensity(
  currentHour: number,
  compound: CompoundPharmacokinetics
): number {
  const doseHour = compound.doseTime;
  const onsetHour = doseHour + compound.onsetMinutes / 60;
  const peakHour = doseHour + compound.peakMinutes / 60;
  const endHour = doseHour + compound.durationMinutes / 60;

  // Before onset
  if (currentHour < onsetHour || currentHour > endHour) {
    return 0;
  }

  // Rising phase (onset to peak)
  if (currentHour < peakHour) {
    const progress = (currentHour - onsetHour) / (peakHour - onsetHour);
    return progress; // Linear rise
  }

  // Falling phase (peak to end)
  const progress = (currentHour - peakHour) / (endHour - peakHour);
  return Math.max(0, 1 - Math.pow(progress, 1.5)); // Exponential decay
}

/**
 * Format hour as 12-hour time
 */
function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
}

/**
 * Parse pharmacokinetic string (e.g., "30-60 min / 2-3 hrs / 6-8 hrs")
 * Returns onset, peak, and duration in minutes
 */
export function parsePharmacokineticString(pkString: string): {
  onsetMinutes: number;
  peakMinutes: number;
  durationMinutes: number;
} {
  const parts = pkString.split('/').map(s => s.trim());
  
  const parseTime = (timeStr: string): number => {
    const match = timeStr.match(/(\d+)(?:-(\d+))?\s*(min|hr|hour)/i);
    if (!match) return 0;
    
    const value = match[2] ? (parseInt(match[1]) + parseInt(match[2])) / 2 : parseInt(match[1]);
    const unit = match[3].toLowerCase();
    
    return unit.startsWith('hr') ? value * 60 : value;
  };

  return {
    onsetMinutes: parts[0] ? parseTime(parts[0]) : 30,
    peakMinutes: parts[1] ? parseTime(parts[1]) : 120,
    durationMinutes: parts[2] ? parseTime(parts[2]) : 360,
  };
}
