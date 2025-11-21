"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, AlertTriangle, Clock, Zap, AlertCircle } from "lucide-react";
import { getCompoundInsight } from "@/lib/ai/actions";
import type { CompoundContext, CompoundInsight } from "@/lib/ai/types";

interface CompoundInsightPopoverProps {
  compoundName: string;
  compoundCategory: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStack?: Array<{ name: string; dose: string }>;
  recentLogs?: Array<{
    date: string;
    anxiety: number;
    functionality: number;
    compounds: string[];
  }>;
}

export function CompoundInsightPopover({
  compoundName,
  compoundCategory,
  open,
  onOpenChange,
  currentStack,
  recentLogs,
}: CompoundInsightPopoverProps) {
  const [insight, setInsight] = useState<CompoundInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load insight when dialog opens
  const handleOpenChange = async (isOpen: boolean) => {
    onOpenChange(isOpen);
    
    if (isOpen && !insight && !loading) {
      setLoading(true);
      setError(null);

      try {
        const context: CompoundContext = {
          compoundName,
          category: compoundCategory,
          currentStack,
          recentLogs,
        };

        const result = await getCompoundInsight(context);

        if (result.success && result.data) {
          setInsight(result.data);
        } else {
          setError(result.error || "Failed to generate insight");
        }
      } catch (err) {
        console.error("Insight error:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
  };

  const resetAndClose = () => {
    setInsight(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Insights: {compoundName}
          </DialogTitle>
          <p className="text-sm text-slate-400">
            Powered by Gemini 3.0
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
              <p className="text-sm text-slate-400">Analyzing compound pharmacology...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <span className="font-semibold">Error: </span>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Insight Content */}
          {insight && !loading && (
            <div className="space-y-4">
              {/* Mechanism of Action */}
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-semibold text-cyan-300">Mechanism of Action</h3>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{insight.mechanism}</p>
              </div>

              {/* Pharmacokinetics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-semibold text-slate-400">Half-Life</h4>
                  </div>
                  <p className="text-sm text-slate-200 font-medium">{insight.halfLife}</p>
                </div>

                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-green-400" />
                    <h4 className="text-xs font-semibold text-slate-400">Onset</h4>
                  </div>
                  <p className="text-sm text-slate-200 font-medium">{insight.onset}</p>
                </div>

                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <h4 className="text-xs font-semibold text-slate-400">Duration</h4>
                  </div>
                  <p className="text-sm text-slate-200 font-medium">{insight.duration}</p>
                </div>
              </div>

              {/* Interactions */}
              {insight.interactions && insight.interactions.length > 0 && (
                <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <h3 className="font-semibold text-yellow-300">Potential Interactions</h3>
                  </div>
                  <ul className="space-y-2">
                    {insight.interactions.map((interaction, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex gap-2">
                        <span className="text-yellow-400 font-bold">•</span>
                        <span>{interaction}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Safety Note */}
              <Alert className="border-slate-700 bg-slate-800/50">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-xs text-slate-300 leading-relaxed">
                  {insight.safetyNote}
                </AlertDescription>
              </Alert>

              {/* Disclaimer */}
              <Alert className="border-red-500/30 bg-red-500/5">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <AlertDescription className="text-xs text-slate-400">
                  <span className="font-semibold text-red-400">Medical Disclaimer: </span>
                  This is AI-generated educational information only. It is NOT medical advice. Always consult with qualified healthcare professionals before starting, stopping, or modifying any medication or supplement regimen.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Action Button */}
          {(insight || error) && (
            <div className="flex justify-end pt-2">
              <Button onClick={resetAndClose} variant="outline">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
