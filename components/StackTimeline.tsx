"use client";

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Clock, TrendingUp, Activity } from 'lucide-react';
import { CompoundDetail } from '@/lib/compound-types';
import {
  calculatePharmacokineticProfile,
  calculateCompositeLoad,
  type PharmacokineticProfile,
} from '@/lib/pharmacokinetics';

interface StackTimelineProps {
  compounds: Array<{
    compound: CompoundDetail;
    doseTime: number;
    colorHex?: string;
  }>;
  showComposite?: boolean;
  height?: number;
}

export default function StackTimeline({
  compounds,
  showComposite = true,
  height = 400,
}: StackTimelineProps) {
  const { profiles, compositeData, chartColors } = useMemo(() => {
    // Calculate pharmacokinetic profiles for each compound
    const profiles: PharmacokineticProfile[] = compounds.map((item) =>
      calculatePharmacokineticProfile(item.compound, item.doseTime)
    );

    // Calculate composite load
    const compositeData = calculateCompositeLoad(profiles);

    // Generate colors for each compound
    const chartColors = compounds.map((item, idx) => {
      if (item.colorHex) return item.colorHex;
      
      // Default color palette
      const palette = [
        '#3b82f6', // blue
        '#8b5cf6', // purple
        '#ec4899', // pink
        '#f59e0b', // amber
        '#10b981', // green
        '#06b6d4', // cyan
        '#f97316', // orange
        '#6366f1', // indigo
      ];
      return palette[idx % palette.length];
    });

    return { profiles, compositeData, chartColors };
  }, [compounds]);

  // Format time for display (HH:MM)
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-sm font-semibold text-slate-200 mb-2">
          Time: {formatTime(label)}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-300">{entry.name}:</span>
            <span className="text-white font-medium">{entry.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    );
  };

  if (compounds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Activity className="h-12 w-12 mb-3 opacity-50" />
        <p>No compounds to visualize</p>
        <p className="text-sm mt-1">Add compounds to see the timeline</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">
            Pharmacokinetic Timeline
          </h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock className="h-4 w-4" />
          <span>24-hour view</span>
        </div>
      </div>

      {/* Composite Load Chart */}
      {showComposite && (
        <div className="bg-gradient-to-br from-blue-900/10 to-purple-900/10 rounded-lg border border-blue-500/20 p-4">
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              Composite Load (All Compounds)
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Combined plasma concentration estimate
            </p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={compositeData}>
              <defs>
                <linearGradient id="compositeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                label={{
                  value: 'Concentration %',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#94a3b8', fontSize: '12px' },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="totalLoad"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#compositeGradient)"
                name="Total Load"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Individual Compound Curves */}
      <div className="bg-slate-900/50 rounded-lg border border-slate-700 p-4">
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-white">
            Individual Compound Curves
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Onset, peak, and duration for each compound
          </p>
        </div>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={compositeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="time"
              tickFormatter={formatTime}
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              label={{
                value: 'Plasma Concentration %',
                angle: -90,
                position: 'insideLeft',
                style: { fill: '#94a3b8', fontSize: '12px' },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="line"
            />
            {profiles.map((profile, idx) => (
              <Line
                key={profile.compoundId}
                type="monotone"
                dataKey={`compounds.${profile.compoundName}`}
                stroke={chartColors[idx]}
                strokeWidth={2}
                dot={false}
                name={profile.compoundName}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with timing info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {profiles.map((profile, idx) => (
          <div
            key={profile.compoundId}
            className="bg-slate-800/50 rounded-lg p-3 border border-slate-700"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: chartColors[idx] }}
              />
              <span className="text-sm font-medium text-white">
                {profile.compoundName}
              </span>
            </div>
            <div className="space-y-1 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Onset:</span>
                <span className="text-slate-200">{profile.onset} min</span>
              </div>
              <div className="flex justify-between">
                <span>Peak:</span>
                <span className="text-slate-200">{profile.peak} min</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="text-slate-200">
                  {(profile.duration / 60).toFixed(1)} hrs
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
