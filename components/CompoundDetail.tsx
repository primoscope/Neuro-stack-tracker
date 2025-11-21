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

interface CompoundDetailProps {
  compound: CompoundDetailType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userStack?: CompoundDetailType[]; // User's current stack for interaction checking
}

export function CompoundDetail({ compound, open, onOpenChange, userStack = [] }: CompoundDetailProps) {
  if (!compound) return null;

  const timing = formatOnsetPeakDuration(compound);

  // Check for potential interactions with user's stack
  const stackInteractions = userStack
    .filter(stackCompound => {
      // Check if there are overlapping mechanistic tags that might cause issues
      const overlappingTags = stackCompound.mechanisticTags.filter(tag =>
        compound.mechanisticTags.includes(tag)
      );
      
      // Flag if both are stimulants, both are sedatives, or other concerning combinations
      const bothStimulants = 
        stackCompound.effectType.toLowerCase().includes('stimulant') &&
        compound.effectType.toLowerCase().includes('stimulant');
      
      const bothSedatives = 
        (stackCompound.effectType.toLowerCase().includes('sleep') ||
         stackCompound.categoryTags.some(t => t.toLowerCase().includes('gaba'))) &&
        (compound.effectType.toLowerCase().includes('sleep') ||
         compound.categoryTags.some(t => t.toLowerCase().includes('gaba')));

      return overlappingTags.length > 2 || bothStimulants || bothSedatives;
    })
    .map(sc => ({
      name: sc.name,
      concern: sc.effectType.toLowerCase().includes('stimulant') && compound.effectType.toLowerCase().includes('stimulant')
        ? 'Both are stimulants - may cause excessive CNS stimulation'
        : sc.effectType.toLowerCase().includes('sleep') && compound.effectType.toLowerCase().includes('sleep')
        ? 'Both are sedatives - may cause excessive sedation'
        : 'Similar mechanisms - potential for interaction',
    }));

  // Calculate safety rating (visual 1-10 scale)
  const safetyRating = compound.safetyScore;
  const safetyColor = safetyRating >= 8 ? 'text-green-400' : safetyRating >= 6 ? 'text-yellow-400' : 'text-red-400';
  const safetyBg = safetyRating >= 8 ? 'bg-green-500' : safetyRating >= 6 ? 'bg-yellow-500' : 'bg-red-500';

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

          {/* Stack Interaction Warnings */}
          {stackInteractions.length > 0 && (
            <Alert variant="destructive" className="border-orange-500/50 bg-orange-500/10">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <span className="font-semibold">Potential Interactions with Your Stack:</span>
                <ul className="mt-2 space-y-1">
                  {stackInteractions.map((interaction, idx) => (
                    <li key={idx} className="text-sm">
                      • <span className="font-medium">{interaction.name}</span>: {interaction.concern}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Safety Score Visual */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-300">Safety Rating</h3>
              </div>
              <span className={`text-2xl font-bold ${safetyColor}`}>
                {safetyRating}/10
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
              <div
                className={`${safetyBg} h-3 rounded-full transition-all`}
                style={{ width: `${safetyRating * 10}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              {safetyRating >= 8 && "Generally considered safe with proper usage"}
              {safetyRating >= 6 && safetyRating < 8 && "Use with caution and monitor effects"}
              {safetyRating < 6 && "Higher risk profile - medical supervision recommended"}
            </p>
          </div>

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
