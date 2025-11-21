"use client";

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  generatePharmacokineticCurve,
  calculateAggregateEffect,
  identifyOverloadPeriods,
  identifyCrashPeriods,
  formatTime,
  type PharmacokineticParameters,
  type PharmacokineticCurvePoint,
} from '@/lib/pharmacokinetics';

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
 * Maps compound effects on a 24-hour timeline using bi-exponential absorption-elimination model
 */
export default function NeuroCurveVisualization({ compounds, onPeakOverload }: NeuroCurveProps) {
  // Generate pharmacokinetic curves for each compound using advanced math
  const compoundCurves = useMemo(() => {
    return compounds.map(compound => {
      const params: PharmacokineticParameters = {
        onsetMinutes: compound.onsetMinutes,
        peakMinutes: compound.peakMinutes,
        durationMinutes: compound.durationMinutes,
        doseTime: compound.doseTime,
      };
      return {
        name: compound.name,
        color: compound.color,
        curve: generatePharmacokineticCurve(params, 2), // 2 points per hour = every 30 min
      };
    });
  }, [compounds]);

  // Calculate aggregate effect curve
  const aggregateCurve = useMemo(() => {
    const curves = compoundCurves.map(c => c.curve);
    return calculateAggregateEffect(curves);
  }, [compoundCurves]);

  // Generate timeline data for the chart
  const timelineData = useMemo(() => {
    if (compoundCurves.length === 0) return [];

    const dataPoints: any[] = [];
    const pointCount = compoundCurves[0].curve.length;

    for (let i = 0; i < pointCount; i++) {
      const time = compoundCurves[0].curve[i].time;
      const dataPoint: any = {
        time,
        timeLabel: formatTime(time),
        aggregate: aggregateCurve[i]?.concentration || 0,
      };

      // Add each compound's concentration
      compoundCurves.forEach(({ name, curve }) => {
        dataPoint[name] = curve[i]?.concentration || 0;
      });

      dataPoints.push(dataPoint);
    }

    return dataPoints;
  }, [compoundCurves, aggregateCurve]);

  // Identify peak overload periods using advanced detection
  const overloadPeriods = useMemo(() => {
    const detectedPeriods = identifyOverloadPeriods(aggregateCurve, 2.5);
    
    return detectedPeriods.map(period => {
      // Find which compounds are contributing during this period
      const peakingCompounds = compounds
        .filter(compound => {
          const compoundCurve = compoundCurves.find(c => c.name === compound.name);
          if (!compoundCurve) return false;
          
          // Check if compound has significant effect during this period
          const relevantPoints = compoundCurve.curve.filter(
            point => point.time >= period.start && point.time <= period.end
          );
          return relevantPoints.some(point => point.concentration > 0.6);
        })
        .map(c => c.name);
      
      return {
        start: period.start,
        end: period.end,
        compounds: peakingCompounds,
        peak: period.peak,
      };
    });
  }, [aggregateCurve, compounds, compoundCurves]);

  // Identify crash periods using advanced detection
  const crashPeriods = useMemo(() => {
    return identifyCrashPeriods(aggregateCurve, 0.5);
  }, [aggregateCurve]);

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
 * Format hour as 12-hour time (alias for formatTime from pharmacokinetics lib)
 */
function formatHour(hour: number): string {
  return formatTime(hour);
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
