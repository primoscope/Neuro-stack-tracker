"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Activity, Calendar, Sparkles } from "lucide-react";
import Link from "next/link";
import { TrendsChart } from "@/components/TrendsChart";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import StackTimeline from "@/components/StackTimeline";
import StackOptimizer from "@/components/StackOptimizer";
import StackInsightsPanel from "@/components/StackInsightsPanel";
import { getCompoundById } from "@/lib/compound-library";

export default function AnalyticsPage() {
  const { logEntries, stackPresets, compounds: userCompounds } = useStore();
  const [showStackAnalysis, setShowStackAnalysis] = useState(false);

  const stats = useMemo(() => {
    const totalLogs = logEntries.length;
    const uniqueDays = new Set(logEntries.map((log) => log.date)).size;
    
    const avgAnxiety = logEntries.length > 0
      ? (logEntries.reduce((sum, log) => sum + log.anxiety, 0) / logEntries.length).toFixed(1)
      : "0";
    
    const avgFunctionality = logEntries.length > 0
      ? (logEntries.reduce((sum, log) => sum + log.functionality, 0) / logEntries.length).toFixed(1)
      : "0";

    return { totalLogs, uniqueDays, avgAnxiety, avgFunctionality };
  }, [logEntries]);

  // Build example stack for timeline demonstration
  const exampleStack = useMemo(() => {
    // Get compounds from user's most recent log or create examples
    const recentLog = logEntries[logEntries.length - 1];
    
    if (recentLog && recentLog.doseItems.length > 0) {
      // Use user's actual compounds
      const now = Date.now();
      return recentLog.doseItems.map((item, idx) => {
        const userCompound = userCompounds.find(c => c.id === item.compoundId);
        // Try to find in compound library
        const libraryCompound = userCompound ? getCompoundById(userCompound.name.toLowerCase().replace(/\s+/g, '-')) : null;
        
        if (libraryCompound) {
          return {
            compound: libraryCompound,
            doseTime: now - (idx * 60 * 60 * 1000), // Stagger by 1 hour
            colorHex: userCompound?.colorHex,
          };
        }
        return null;
      }).filter(Boolean) as any[];
    }

    // Fallback to example compounds
    const exampleCompoundIds = ['caffeine', 'l-theanine', 'alpha-gpc', 'magnesium-glycinate'];
    const now = Date.now();
    
    return exampleCompoundIds
      .map((id, idx) => {
        const compound = getCompoundById(id);
        if (!compound) return null;
        return {
          compound,
          doseTime: now - (idx * 2 * 60 * 60 * 1000), // 2 hours apart
          colorHex: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'][idx],
        };
      })
      .filter(Boolean) as any[];
  }, [logEntries, userCompounds]);

  // Build stack for optimizer
  const stackForOptimizer = useMemo(() => {
    if (stackPresets.length > 0) {
      const preset = stackPresets[0];
      return preset.doseItems.map(item => {
        const compound = userCompounds.find(c => c.id === item.compoundId);
        const libraryCompound = compound ? getCompoundById(compound.name.toLowerCase().replace(/\s+/g, '-')) : null;
        
        return {
          id: item.compoundId,
          name: compound?.name || 'Unknown',
          dose: `${item.dose}${compound?.unit || 'mg'}`,
          timing: 'Not set',
          effectType: libraryCompound?.effectType,
        };
      });
    }

    // Example stack for demonstration
    return [
      { id: '1', name: 'Caffeine', dose: '200mg', timing: '8:00 AM', effectType: 'Stimulant' },
      { id: '2', name: 'L-Theanine', dose: '200mg', timing: '8:00 AM', effectType: 'Anxiolytic' },
      { id: '3', name: 'Alpha-GPC', dose: '300mg', timing: 'Noon', effectType: 'Nootropic' },
      { id: '4', name: 'Magnesium Glycinate', dose: '400mg', timing: '9:00 PM', effectType: 'Sleep aid' },
    ];
  }, [stackPresets, userCompounds]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-30 safe-area-inset">
        <div className="mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon" className="touch-manipulation">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Analytics</h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Track your progress and trends
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-20 md:pb-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="glass border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-400 flex items-center gap-2">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
                Total Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{stats.totalLogs}</div>
            </CardContent>
          </Card>

          <Card className="glass border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-400 flex items-center gap-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{stats.uniqueDays}</div>
            </CardContent>
          </Card>

          <Card className="glass border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                Avg Anxiety
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{stats.avgAnxiety}</div>
            </CardContent>
          </Card>

          <Card className="glass border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                Avg Function
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{stats.avgFunctionality}</div>
            </CardContent>
          </Card>
        </div>

        {/* Trends Chart */}
        <Card className="glass border-slate-800">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Trends & Correlations</CardTitle>
          </CardHeader>
          <CardContent>
            {logEntries.length > 0 ? (
              <TrendsChart />
            ) : (
              <div className="py-12 text-center text-slate-400">
                No data to display. Start logging to see trends!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Heatmap */}
        <Card className="glass border-slate-800">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Consistency Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            {logEntries.length > 0 ? (
              <ActivityHeatmap />
            ) : (
              <div className="py-12 text-center text-slate-400">
                Start logging to see your consistency heatmap!
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI-Powered Stack Analysis */}
        <Card className="glass border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                AI-Powered Stack Analysis
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStackAnalysis(!showStackAnalysis)}
              >
                {showStackAnalysis ? 'Hide' : 'Show'}
              </Button>
            </div>
          </CardHeader>
          {showStackAnalysis && (
            <CardContent className="space-y-6">
              {/* Pharmacokinetic Timeline */}
              {exampleStack.length > 0 && (
                <div>
                  <StackTimeline compounds={exampleStack} showComposite={true} />
                </div>
              )}

              {/* Stack Optimizer */}
              {stackForOptimizer.length > 0 && (
                <div className="pt-6 border-t border-slate-700">
                  <StackOptimizer
                    compounds={stackForOptimizer}
                    goals={['Focus', 'Calm', 'Better Sleep']}
                  />
                </div>
              )}

              {/* Stack Insights Panel */}
              {stackForOptimizer.length > 0 && (
                <div className="pt-6 border-t border-slate-700">
                  <StackInsightsPanel
                    stack={{
                      name: stackPresets[0]?.name || 'Example Stack',
                      compounds: stackForOptimizer.map(c => ({
                        name: c.name,
                        dose: c.dose,
                        timing: c.timing || 'Not set',
                      })),
                      goals: ['Focus', 'Calm', 'Better Sleep'],
                    }}
                  />
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </main>
    </div>
  );
}
