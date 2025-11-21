"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  Clock,
  Plus,
  TrendingUp,
  AlertCircle,
  Info,
  CheckCircle,
} from "lucide-react";
import { optimizeStackWithGemini } from "@/lib/ai/actions";
import type { StackOptimization } from "@/lib/ai/types";

interface StackOptimizerProps {
  compounds: Array<{ name: string; dose: string; timing?: string }>;
  goals?: string[];
  onClose?: () => void;
  className?: string;
}

export function StackOptimizer({ compounds, goals, onClose, className = "" }: StackOptimizerProps) {
  const [optimization, setOptimization] = useState<StackOptimization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleOptimize = async () => {
    if (compounds.length === 0) {
      setError("Please add at least one compound to optimize");
      return;
    }

    setLoading(true);
    setError(null);
    setShowDialog(true);

    try {
      const result = await optimizeStackWithGemini(compounds, goals);

      if (result.success && result.data) {
        setOptimization(result.data);
      } else {
        setError(result.error || "Failed to optimize stack");
      }
    } catch (err) {
      console.error("Optimization error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowDialog(false);
    setOptimization(null);
    setError(null);
    onClose?.();
  };

  const getSeverityColor = (severity: "critical" | "moderate" | "minor") => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-300 border-red-500/50";
      case "moderate":
        return "bg-orange-500/20 text-orange-300 border-orange-500/50";
      case "minor":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
    }
  };

  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "bg-blue-500/20 text-blue-300 border-blue-500/50";
      case "medium":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/50";
      case "low":
        return "bg-slate-500/20 text-slate-300 border-slate-500/50";
    }
  };

  return (
    <>
      <Button
        onClick={handleOptimize}
        disabled={loading || compounds.length === 0}
        className={`bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Optimizing...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Auto-Optimize Stack
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Stack Optimization Results
            </DialogTitle>
            <p className="text-sm text-slate-400">
              AI-powered recommendations from Gemini 3.0
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                <p className="text-sm text-slate-400">
                  Analyzing your stack for optimal synergies and safety...
                </p>
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

            {/* Optimization Results */}
            {optimization && !loading && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-lg text-blue-300">Overall Assessment</h3>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{optimization.summary}</p>
                </div>

                {/* Warnings */}
                {optimization.warnings && optimization.warnings.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <h3 className="font-semibold text-lg text-red-300">Safety Warnings</h3>
                    </div>
                    <div className="space-y-3">
                      {optimization.warnings.map((warning, idx) => (
                        <Alert
                          key={idx}
                          className={`border-${warning.severity === "critical" ? "red" : warning.severity === "moderate" ? "orange" : "yellow"}-500/50 bg-${warning.severity === "critical" ? "red" : warning.severity === "moderate" ? "orange" : "yellow"}-500/10`}
                        >
                          <AlertTriangle className="w-4 h-4" />
                          <AlertDescription>
                            <div className="flex items-start gap-2 mb-2">
                              <Badge className={getSeverityColor(warning.severity)}>
                                {warning.severity.toUpperCase()}
                              </Badge>
                              <div className="flex flex-wrap gap-1">
                                {warning.compounds.map((comp) => (
                                  <Badge key={comp} variant="outline" className="text-xs">
                                    {comp}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-slate-200">{warning.message}</p>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                {/* Synergies */}
                {optimization.synergies && optimization.synergies.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <h3 className="font-semibold text-lg text-green-300">Synergistic Effects</h3>
                    </div>
                    <div className="grid gap-3">
                      {optimization.synergies.map((synergy, idx) => (
                        <div
                          key={idx}
                          className="bg-green-500/10 p-4 rounded-lg border border-green-500/30"
                        >
                          <div className="flex flex-wrap gap-1 mb-2">
                            {synergy.compounds.map((comp) => (
                              <Badge
                                key={comp}
                                variant="outline"
                                className="bg-green-500/20 text-green-300 border-green-500/50"
                              >
                                {comp}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-slate-300 mb-2">
                            <span className="font-semibold text-green-300">Benefit: </span>
                            {synergy.benefit}
                          </p>
                          <p className="text-sm text-slate-400">
                            <span className="font-semibold">Recommendation: </span>
                            {synergy.recommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timing Suggestions */}
                {optimization.timingSuggestions && optimization.timingSuggestions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-400" />
                      <h3 className="font-semibold text-lg text-blue-300">Timing Optimization</h3>
                    </div>
                    <div className="grid gap-3">
                      {optimization.timingSuggestions.map((timing, idx) => (
                        <div
                          key={idx}
                          className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                              {timing.compound}
                            </Badge>
                            {timing.currentTiming && (
                              <div className="text-xs text-slate-400">
                                Current: {timing.currentTiming}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-slate-300 mb-2">
                            <span className="font-semibold text-blue-300">Suggested: </span>
                            {timing.suggestedTiming}
                          </p>
                          <p className="text-xs text-slate-400">{timing.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Additions */}
                {optimization.additions && optimization.additions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Plus className="w-5 h-5 text-purple-400" />
                      <h3 className="font-semibold text-lg text-purple-300">Suggested Additions</h3>
                    </div>
                    <div className="grid gap-3">
                      {optimization.additions.map((addition, idx) => (
                        <div
                          key={idx}
                          className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/30"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                              {addition.compound}
                            </Badge>
                            <Badge className={getPriorityColor(addition.priority)}>
                              {addition.priority} priority
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-300">{addition.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <Alert className="border-red-500/30 bg-red-500/5">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <AlertDescription className="text-xs text-slate-400">
                    <span className="font-semibold text-red-400">Medical Disclaimer: </span>
                    These are AI-generated suggestions for educational purposes only. This is NOT
                    medical advice. Always consult with qualified healthcare professionals before
                    making any changes to your medication or supplement regimen.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Action Button */}
            {(optimization || error) && (
              <div className="flex justify-end pt-2 gap-2">
                <Button onClick={handleClose} variant="outline">
                  Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
