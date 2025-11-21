"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Settings, TrendingUp, Flame, Clock, BookOpen } from "lucide-react";
import Link from "next/link";
import { LoggingDrawer } from "@/components/LoggingDrawer";
import { QuickLogPresets } from "@/components/QuickLogPresets";
import { TrendsChart } from "@/components/TrendsChart";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { StackTimeline } from "@/components/StackTimeline";
import { GeminiChatWidget, type ActionChipData } from "@/components/GeminiChatWidget";
import { BioSyncOptimizer } from "@/components/BioSyncOptimizer";
import { getAllCompounds } from "@/lib/compound-library";
import type { BioSyncResult } from "@/lib/gemini-bio-sync";

export default function DashboardPage() {
  const { logEntries, compounds } = useStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Get today's active doses for the timeline and chat widget
  const todayDoses = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayLogs = logEntries.filter((log) => log.date === today);
    return todayLogs.flatMap((log) => log.doseItems);
  }, [logEntries]);

  // Build library compounds map for timeline
  const libraryCompoundsMap = useMemo(() => {
    const allCompounds = getAllCompounds();
    const map = new Map();
    allCompounds.forEach((c) => {
      map.set(c.name.toLowerCase(), c);
    });
    return map;
  }, []);

  // Handle action chip clicks from the chat widget
  const handleActionChipClick = (action: ActionChipData) => {
    console.log("Action chip clicked:", action);
    // TODO: Implement action handling based on action.type
    // For now, just log it
  };

  // Handle Bio-Sync schedule application
  const handleApplySchedule = (result: BioSyncResult) => {
    console.log("Applying optimized schedule:", result);
    // TODO: Implement schedule application logic
    // This would update the log entries with new timestamps
    alert(`Schedule optimized! ${result.optimizedSchedule.length} compounds rescheduled.\n\n${result.summary}`);
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Current streak (consecutive days with logs)
    const sortedDates = [...new Set(logEntries.map((log) => log.date))].sort();
    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    
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

    // Average anxiety (last 7 days)
    const recentLogs = logEntries.filter((log) => log.timestamp >= sevenDaysAgo);
    const avgAnxiety = recentLogs.length > 0
      ? (recentLogs.reduce((sum, log) => sum + log.anxiety, 0) / recentLogs.length).toFixed(1)
      : "N/A";

    // Last dose time
    const lastLog = logEntries.length > 0
      ? logEntries[logEntries.length - 1]
      : null;
    const lastDoseTime = lastLog
      ? new Date(lastLog.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "N/A";

    return { streak, avgAnxiety, lastDoseTime };
  }, [logEntries]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-500">NeuroStack</h1>
            <p className="text-sm text-slate-400">Bio-Hacker Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/library">
              <Button variant="outline" size="icon" title="Compound Library">
                <BookOpen className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" size="icon" title="Settings">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24 md:pb-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-50">{metrics.streak}</div>
              <p className="text-xs text-slate-500 mt-1">days logged</p>
            </CardContent>
          </Card>

          <Card className="glass border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-400" />
                Avg Anxiety (7d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-50">{metrics.avgAnxiety}</div>
              <p className="text-xs text-slate-500 mt-1">out of 10</p>
            </CardContent>
          </Card>

          <Card className="glass border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                Last Dose
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-50">{metrics.lastDoseTime}</div>
              <p className="text-xs text-slate-500 mt-1">most recent log</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Log Presets */}
        <QuickLogPresets onOpenDrawer={() => setIsDrawerOpen(true)} />

        {/* Neuro-Curve Timeline */}
        {todayDoses.length > 0 && (
          <Card className="glass border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Today&apos;s Neuro-Curve</CardTitle>
                <p className="text-sm text-slate-400 mt-1">
                  Aggregate stimulation curve showing compound interactions over time
                </p>
              </div>
              <div className="hidden sm:block">
                <BioSyncOptimizer
                  compounds={compounds}
                  currentDoses={todayDoses}
                  onApplySchedule={handleApplySchedule}
                />
              </div>
            </CardHeader>
            <CardContent>
              <StackTimeline
                compounds={compounds}
                doseItems={todayDoses}
                libraryCompounds={libraryCompoundsMap}
              />
              {/* Mobile Bio-Sync Button */}
              <div className="mt-4 sm:hidden">
                <BioSyncOptimizer
                  compounds={compounds}
                  currentDoses={todayDoses}
                  onApplySchedule={handleApplySchedule}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Chart */}
        <Card className="glass border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg">Trends & Correlations</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendsChart />
          </CardContent>
        </Card>

        {/* Activity Heatmap */}
        <Card className="glass border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg">Consistency Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityHeatmap />
          </CardContent>
        </Card>

        {/* Empty State */}
        {logEntries.length === 0 && compounds.length === 0 && (
          <Card className="glass border-slate-800 border-dashed">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Plus className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Get Started</h3>
              <p className="text-slate-400 mb-4">
                Add compounds to your pharmacy and start tracking your stack
              </p>
              <Link href="/settings">
                <Button className="bg-blue-500 hover:bg-blue-600">
                  Manage Compounds
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Floating Action Button */}
      <button onClick={() => setIsDrawerOpen(true)} className="fab">
        <Plus className="w-8 h-8" />
      </button>

      {/* Logging Drawer */}
      <LoggingDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />

      {/* Gemini Chat Widget (Bio-Coach) */}
      <GeminiChatWidget
        compounds={compounds}
        activeDoses={todayDoses}
        onActionChipClick={handleActionChipClick}
      />
    </div>
  );
}
