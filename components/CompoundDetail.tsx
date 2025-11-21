"use client";

import { CompoundDetail as CompoundDetailType } from "@/lib/compound-types";
import { formatOnsetPeakDuration } from "@/lib/compound-library";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  AlertTriangle,
  Activity,
  Moon,
  Sun,
  Shield,
  TrendingUp,
  Info,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

interface CompoundDetailProps {
  compound: CompoundDetailType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompoundDetail({ compound, open, onOpenChange }: CompoundDetailProps) {
  if (!compound) return null;

  const timing = formatOnsetPeakDuration(compound);

  // Get badge color based on effect type
  const getEffectTypeColor = (effectType: string) => {
    const type = effectType.toLowerCase();
    if (type.includes("stimulant")) return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    if (type.includes("anxiolytic")) return "bg-green-500/20 text-green-300 border-green-500/30";
    if (type.includes("wakefulness")) return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    if (type.includes("sleep")) return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    if (type.includes("nootropic")) return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
    return "bg-slate-500/20 text-slate-300 border-slate-500/30";
  };

  // Get evidence grade color
  const getEvidenceColor = (grade: string) => {
    if (grade === "A" || grade === "B") return "text-green-400";
    if (grade === "C" || grade === "D") return "text-yellow-400";
    return "text-red-400";
  };

  // Get daytime/nighttime icon
  const getDaytimeIcon = (timing: string) => {
    const lower = timing.toLowerCase();
    if (lower.includes("daytime")) return <Sun className="w-4 h-4" />;
    if (lower.includes("nighttime")) return <Moon className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  // Check if compound is recreational or has dependence risk
  const hasWarnings = 
    compound.recreational !== "No" || 
    compound.dependenceTolerance.toLowerCase().includes("high") ||
    compound.dependenceTolerance.toLowerCase().includes("moderate");

  // Generate mini Neuro-Curve data for this single compound
  const miniCurveData = generateMiniCurve(compound);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onClose={() => onOpenChange(false)}
        className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{compound.name}</DialogTitle>
          {compound.aliases.length > 0 && (
            <p className="text-sm text-slate-400 mt-1">
              Also known as: {compound.aliases.join(", ")}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Classification & Tags */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-2">Classification</h3>
            <div className="flex flex-wrap gap-2">
              <Badge className={getEffectTypeColor(compound.effectType)}>
                {compound.effectType}
              </Badge>
              {compound.categoryTags.map((tag) => (
                <Badge key={tag} variant="outline" className="border-slate-600">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Warnings */}
          {hasWarnings && (
            <Alert variant="destructive" className="border-yellow-500/50 bg-yellow-500/10">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <span className="font-semibold">Caution: </span>
                {compound.recreational !== "No" && `Recreational potential: ${compound.recreational}. `}
                {compound.dependenceTolerance}
              </AlertDescription>
            </Alert>
          )}

          {/* Primary Effects */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-2">Primary Effects</h3>
            <p className="text-slate-200">{compound.primaryEffects}</p>
          </div>

          {/* Mechanism */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-2">Mechanism of Action</h3>
            <p className="text-slate-200">{compound.mechanism}</p>
          </div>

          {/* Timing Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-300">Timing</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Onset:</span>
                  <span className="text-slate-200 font-medium">{timing.onset}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Peak:</span>
                  <span className="text-slate-200 font-medium">{timing.peak}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration:</span>
                  <span className="text-slate-200 font-medium">{timing.duration}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                  <span className="text-slate-400">Best time:</span>
                  <span className="flex items-center gap-1 text-slate-200 font-medium">
                    {getDaytimeIcon(compound.daytimeNighttime)}
                    {compound.daytimeNighttime}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-300">Scores</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Efficacy:</span>
                  <span className="text-slate-200 font-medium">{compound.efficacyScore}/10</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${compound.efficacyScore * 10}%` }}
                  />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-400">Safety:</span>
                  <span className="text-slate-200 font-medium">{compound.safetyScore}/10</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${compound.safetyScore * 10}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mini Neuro-Curve Visualization */}
          {miniCurveData.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-2">Effect Curve (Single Dose)</h3>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={miniCurveData}>
                    <defs>
                      <linearGradient id="effectGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="label" 
                      stroke="#64748b" 
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      interval={2}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      domain={[0, 1]}
                      ticks={[0, 0.5, 1]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#e2e8f0",
                      }}
                      labelStyle={{ color: "#94a3b8" }}
                      formatter={(value: number) => [(value * 100).toFixed(0) + "%", "Effect"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="effect"
                      stroke="#3b82f6"
                      fill="url(#effectGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Theoretical effect intensity over time after a single dose
                </p>
              </div>
            </div>
          )}

          {/* Acute Effect */}
          {compound.acuteEffect && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-slate-200">
                This compound has <span className="font-semibold">acute effects</span> after a single dose.
              </p>
            </div>
          )}

          {/* Interactions */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-3">Drug Interactions</h3>
            <div className="space-y-3">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-300">With Voxra (Bupropion)</p>
                    <p className="text-sm text-slate-400 mt-1">{compound.interactions.voxra}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-300">With SSRI (Escitalopram 10mg)</p>
                    <p className="text-sm text-slate-400 mt-1">{compound.interactions.ssri}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Evidence */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-2">Clinical Evidence</h3>
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Evidence Grade:</span>
                <span className={`text-xl font-bold ${getEvidenceColor(compound.evidence.strength)}`}>
                  {compound.evidence.strength}
                </span>
              </div>
              <p className="text-sm text-slate-300">{compound.evidence.summary}</p>
            </div>
          </div>

          {/* Disclaimer */}
          <Alert className="border-slate-700 bg-slate-800/50">
            <AlertDescription className="text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Medical Disclaimer:</span> This information is for educational purposes only and does not constitute medical advice. Always consult with qualified healthcare professionals before starting, stopping, or modifying any medication or supplement regimen.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Generate mini Neuro-Curve data for a single compound
 */
function generateMiniCurve(compound: CompoundDetailType): Array<{ time: number; label: string; effect: number }> {
  const onset = compound.onset?.onsetMin || 30; // minutes
  const peak = compound.onset?.peakMin || 60;
  const duration = compound.onset?.durationMin || 240;

  // If no timing data, return empty
  if (onset === 0 && peak === 0 && duration === 0) {
    return [];
  }

  const points: Array<{ time: number; label: string; effect: number }> = [];
  const totalTime = duration + 60; // Add 1 hour after duration
  const step = totalTime / 20; // 20 data points

  for (let i = 0; i <= 20; i++) {
    const time = i * step;
    let effect = 0;

    if (time < onset) {
      // Onset phase: linear ramp-up
      effect = (time / onset) * 0.3;
    } else if (time < peak) {
      // Rising to peak
      effect = 0.3 + ((time - onset) / (peak - onset)) * 0.7;
    } else if (time < duration) {
      // Decay from peak
      const decayProgress = (time - peak) / (duration - peak);
      effect = 1.0 * Math.exp(-2 * decayProgress); // Exponential decay
    } else {
      // After duration
      const timeSinceDuration = time - duration;
      effect = 0.1 * Math.exp(-timeSinceDuration / 30); // Tail-off
    }

    const hours = Math.floor(time / 60);
    const mins = Math.floor(time % 60);
    const label = hours > 0 ? `${hours}h${mins > 0 ? mins : ''}` : `${mins}m`;

    points.push({
      time,
      label,
      effect: Math.max(0, effect),
    });
  }

  return points;
}
