"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Loader2,
  MessageCircle,
  X,
  Lightbulb,
  TrendingUp,
  Activity,
  BookOpen,
  Settings,
  AlertCircle,
} from "lucide-react";
import { getRouteAwareInsight, checkAIAvailability } from "@/lib/ai/actions";
import type { RouteInsight, RouteContext } from "@/lib/ai/types";
import { useStore } from "@/store/useStore";

export function NeuroNavigator() {
  const pathname = usePathname();
  const { compounds, logEntries } = useStore();
  
  const [showDialog, setShowDialog] = useState(false);
  const [insight, setInsight] = useState<RouteInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState(false);

  // Check if AI is available on mount
  useEffect(() => {
    checkAIAvailability().then((result) => {
      setAiAvailable(result.available);
    });
  }, []);

  // Get route name for display
  const getRouteName = (path: string): string => {
    if (path === "/" || path === "") return "Dashboard";
    if (path === "/analytics") return "Analytics";
    if (path === "/library") return "Library";
    if (path === "/settings") return "Settings";
    return "App";
  };

  // Get route icon
  const getRouteIcon = (path: string) => {
    if (path === "/" || path === "") return Activity;
    if (path === "/analytics") return TrendingUp;
    if (path === "/library") return BookOpen;
    if (path === "/settings") return Settings;
    return MessageCircle;
  };

  // Build context for current route
  const buildContext = (): RouteContext => {
    const routeName = getRouteName(pathname);
    const recentLogs = logEntries
      .slice(-7)
      .map((log) => ({
        date: log.date,
        anxiety: log.anxiety,
        functionality: log.functionality,
      }));

    const avgAnxiety = recentLogs.length > 0
      ? recentLogs.reduce((sum, l) => sum + l.anxiety, 0) / recentLogs.length
      : 0;

    const avgFunctionality = recentLogs.length > 0
      ? recentLogs.reduce((sum, l) => sum + l.functionality, 0) / recentLogs.length
      : 0;

    // Calculate streak
    const sortedDates = [...new Set(logEntries.map((log) => log.date))].sort();
    let streak = 0;
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const date = sortedDates[i];
      const expectedDate = new Date(Date.now() - streak * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      if (date === expectedDate) {
        streak++;
      } else {
        break;
      }
    }

    return {
      route: pathname,
      routeName,
      data: {
        compounds: compounds.map((c) => ({
          name: c.name,
          dose: `${c.defaultDose}${c.unit}`,
        })),
        recentLogs,
        streak,
        avgAnxiety: parseFloat(avgAnxiety.toFixed(1)),
        avgFunctionality: parseFloat(avgFunctionality.toFixed(1)),
      },
    };
  };

  const handleOpen = async () => {
    setShowDialog(true);
    
    // Load insight if not already loaded
    if (!insight && !loading && aiAvailable) {
      setLoading(true);
      setError(null);

      try {
        const context = buildContext();
        const result = await getRouteAwareInsight(context);

        if (result.success && result.data) {
          setInsight(result.data);
        } else {
          setError(result.error || "Failed to generate insight");
        }
      } catch (err) {
        console.error("Navigator insight error:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    setShowDialog(false);
    // Don't clear insight immediately so it's available if reopened
  };

  const handleRefresh = async () => {
    setInsight(null);
    setLoading(true);
    setError(null);

    try {
      const context = buildContext();
      const result = await getRouteAwareInsight(context);

      if (result.success && result.data) {
        setInsight(result.data);
      } else {
        setError(result.error || "Failed to generate insight");
      }
    } catch (err) {
      console.error("Navigator refresh error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Don't show if AI is not available
  if (!aiAvailable) {
    return null;
  }

  const RouteIcon = getRouteIcon(pathname);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
        aria-label="Open AI Navigator"
      >
        <Sparkles className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">AI Navigator</span>
      </button>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <RouteIcon className="w-5 h-5 text-purple-400" />
              {getRouteName(pathname)} Assistant
            </DialogTitle>
            <p className="text-sm text-slate-400">
              AI-powered insights for your current page
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                <p className="text-sm text-slate-400">
                  Analyzing your {getRouteName(pathname).toLowerCase()} data...
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

            {/* Insight Content */}
            {insight && !loading && (
              <div className="space-y-4">
                {/* Main Insight */}
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 rounded-lg border border-purple-500/30">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-purple-300 mb-2">Key Insight</h3>
                      <p className="text-sm text-slate-300 leading-relaxed">{insight.insight}</p>
                    </div>
                  </div>
                </div>

                {/* Suggestions */}
                {insight.suggestions && insight.suggestions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <h3 className="font-semibold text-green-300">Suggestions</h3>
                    </div>
                    <div className="space-y-2">
                      {insight.suggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          className="bg-green-500/10 p-3 rounded-lg border border-green-500/30 flex gap-3"
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-300 text-xs font-bold mt-0.5">
                            {idx + 1}
                          </div>
                          <p className="text-sm text-slate-300">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up Questions */}
                {insight.questions && insight.questions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-blue-400" />
                      <h3 className="font-semibold text-blue-300">Explore Further</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {insight.questions.map((question, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="bg-blue-500/10 text-blue-300 border-blue-500/30 text-xs py-2 px-3 cursor-pointer hover:bg-blue-500/20 transition-colors"
                        >
                          {question}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">
                      Click a question to explore it (future feature)
                    </p>
                  </div>
                )}

                {/* Disclaimer */}
                <Alert className="border-slate-700 bg-slate-800/50">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription className="text-xs text-slate-400">
                    AI-generated insights for informational purposes. Not medical advice. Always
                    consult healthcare professionals for medical decisions.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-2 gap-2">
              {insight && !loading && (
                <Button onClick={handleRefresh} variant="outline" size="sm">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Refresh
                </Button>
              )}
              <Button onClick={handleClose} variant="outline" className="ml-auto">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
