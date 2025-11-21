"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Activity, Calendar } from "lucide-react";
import Link from "next/link";
import { TrendsChart } from "@/components/TrendsChart";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import NeuroCurveVisualization, { parsePharmacokineticString } from "@/components/NeuroCurveVisualization";
import SmartActionChatWidget from "@/components/SmartActionChatWidget";

export default function AnalyticsPage() {
  const { logEntries, compounds, stackPresets } = useStore();
  const [showNeuroCurve, setShowNeuroCurve] = useState(false);

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

  // Prepare data for Neuro-Curve visualization from today's stack
  const neuroCurveData = useMemo(() => {
    // Get today's logs
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logEntries.filter(log => log.date === today);
    
    if (todayLogs.length === 0) return [];

    // Aggregate compounds from today's logs
    const compoundDoses = new Map();
    todayLogs.forEach(log => {
      log.doseItems.forEach(item => {
        const compound = compounds.find(c => c.id === item.compoundId);
        if (compound) {
          const doseTime = new Date(item.timestamp).getHours();
          compoundDoses.set(compound.id, {
            name: compound.name,
            color: compound.colorHex,
            doseTime,
          });
        }
      });
    });

    // For demo purposes, using estimated pharmacokinetics
    // In production, would fetch from compound library
    return Array.from(compoundDoses.values()).map((data, idx) => ({
      name: data.name,
      color: data.color,
      onsetMinutes: 30,
      peakMinutes: 120,
      durationMinutes: 360,
      doseTime: data.doseTime,
    }));
  }, [logEntries, compounds]);

  // Prepare stack data for chat context
  const stackDataForChat = useMemo(() => {
    const recentCompounds = compounds.filter(c => c.isActive).map(c => ({
      name: c.name,
      dose: `${c.defaultDose} ${c.unit}`,
    }));

    return {
      compounds: recentCompounds,
      goals: ['Optimize cognitive performance', 'Reduce anxiety', 'Improve focus'],
    };
  }, [compounds]);

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

        {/* Neuro-Curve Visualization */}
        {neuroCurveData.length > 0 && (
          <Card className="glass border-slate-800">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Today's Neuro-Curve (24-Hour Timeline)</CardTitle>
            </CardHeader>
            <CardContent>
              <NeuroCurveVisualization compounds={neuroCurveData} />
            </CardContent>
          </Card>
        )}

        {/* AI Insights Section */}
        {compounds.length > 0 && (
          <Card className="glass border-slate-800">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">AI Stack Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-400">
                  Get personalized recommendations and schedule optimization for your stack.
                </p>
                <Button
                  onClick={() => setShowNeuroCurve(!showNeuroCurve)}
                  className="w-full sm:w-auto"
                  variant="outline"
                >
                  {showNeuroCurve ? 'Hide Chat' : 'Open Bio-Coach AI'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Smart Action Chat Widget */}
      {showNeuroCurve && (
        <SmartActionChatWidget
          context="User is viewing analytics and wants insights about their stack performance"
          stackData={stackDataForChat}
          onAction={(action, data) => {
            console.log('Action triggered:', action, data);
            // Handle actions like schedule optimization
          }}
          position="bottom-right"
          minimizable={true}
        />
      )}
    </div>
  );
}
