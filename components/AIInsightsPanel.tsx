"use client";

import { useState } from 'react';
import { Sparkles, Loader2, TrendingUp, Lightbulb, AlertTriangle, Clock } from 'lucide-react';
import { analyzeStackCombination, generatePersonalizedRecommendations, analyzeTrends, getTimingOptimization, type InsightResult } from '@/lib/gemini-insights';

interface AIInsightsPanelProps {
  type: 'stack' | 'recommendations' | 'trends' | 'timing';
  data: any;
  title?: string;
}

export default function AIInsightsPanel({ type, data, title }: AIInsightsPanelProps) {
  const [insight, setInsight] = useState<InsightResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateInsight() {
    setIsLoading(true);
    setError(null);

    try {
      let result: InsightResult | null = null;

      switch (type) {
        case 'stack':
          result = await analyzeStackCombination(
            data.compounds || [],
            data.symptoms
          );
          break;
        case 'recommendations':
          result = await generatePersonalizedRecommendations(data);
          break;
        case 'trends':
          result = await analyzeTrends(data);
          break;
        case 'timing':
          result = await getTimingOptimization(data.compounds || []);
          break;
      }

      if (result) {
        setInsight(result);
      } else {
        setError('Unable to generate insights. Check API configuration.');
      }
    } catch (err) {
      console.error('Insight generation error:', err);
      setError('Failed to generate insights. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'stack': return AlertTriangle;
      case 'recommendations': return Lightbulb;
      case 'trends': return TrendingUp;
      case 'timing': return Clock;
    }
  };

  const Icon = getIcon();

  return (
    <div className="bg-gradient-to-br from-purple-900/10 to-blue-900/10 rounded-lg border border-purple-500/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          <h3 className="font-semibold text-white">
            {title || 'AI Insights'}
          </h3>
        </div>
        {!insight && !isLoading && (
          <button
            onClick={generateInsight}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
          >
            Generate
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generating AI insights...</span>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {insight && !isLoading && (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
              {insight.insight}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-700">
            <span>Model: {insight.model}</span>
            <button
              onClick={generateInsight}
              className="text-purple-400 hover:text-purple-300"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {!insight && !isLoading && !error && (
        <p className="text-sm text-gray-400">
          Click Generate to get AI-powered insights based on your data.
        </p>
      )}
    </div>
  );
}
