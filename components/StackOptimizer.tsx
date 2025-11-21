"use client";

import { useState } from 'react';
import { Sparkles, Loader2, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompoundItem {
  id: string;
  name: string;
  dose: string;
  timing?: string;
  effectType?: string;
}

interface StackOptimizerProps {
  compounds: CompoundItem[];
  goals?: string[];
  onOptimizedStack?: (optimized: CompoundItem[], changes: any[]) => void;
}

interface OptimizationChange {
  compound: string;
  change: string;
  reason: string;
}

export default function StackOptimizer({
  compounds,
  goals,
  onOptimizedStack,
}: StackOptimizerProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedCompounds, setOptimizedCompounds] = useState<CompoundItem[] | null>(null);
  const [rationale, setRationale] = useState<string>('');
  const [changes, setChanges] = useState<OptimizationChange[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleOptimize() {
    if (compounds.length === 0) return;

    setIsOptimizing(true);
    setError(null);
    setOptimizedCompounds(null);
    setRationale('');
    setChanges([]);

    try {
      const response = await fetch('/api/stack/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compounds, goals }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Optimization failed');
      }

      const result = await response.json();
      setOptimizedCompounds(result.optimizedCompounds);
      setRationale(result.rationale);
      setChanges(result.changes || []);
    } catch (err) {
      console.error('Optimization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to optimize stack');
    } finally {
      setIsOptimizing(false);
    }
  }

  function handleApplyOptimization() {
    if (optimizedCompounds && onOptimizedStack) {
      onOptimizedStack(optimizedCompounds, changes);
      // Clear the optimization view after applying
      setOptimizedCompounds(null);
      setRationale('');
      setChanges([]);
    }
  }

  function handleReset() {
    setOptimizedCompounds(null);
    setRationale('');
    setChanges([]);
    setError(null);
  }

  return (
    <div className="space-y-4">
      {/* Optimize Button */}
      {!optimizedCompounds && (
        <div className="bg-gradient-to-br from-purple-900/10 to-blue-900/10 rounded-lg border border-purple-500/20 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h4 className="font-semibold text-white">Optimize Stack (Bio-Sync)</h4>
              </div>
              <p className="text-sm text-slate-400">
                AI will analyze your stack and reorder compounds based on chronopharmacology,
                synergies, and optimal timing for maximum effectiveness.
              </p>
            </div>
            <Button
              onClick={handleOptimize}
              disabled={isOptimizing || compounds.length === 0}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Optimize Stack
                </>
              )}
            </Button>
          </div>
          {error && (
            <div className="mt-3 text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Optimization Results */}
      {optimizedCompounds && (
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-400" />
              <h3 className="text-xl font-semibold text-white">Optimized Stack</h3>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApplyOptimization}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Apply Changes
              </Button>
            </div>
          </div>

          {/* Rationale */}
          {rationale && (
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-300 mb-2">
                Optimization Strategy
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">{rationale}</p>
            </div>
          )}

          {/* Comparison View */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Original Stack */}
            <div>
              <h4 className="text-sm font-semibold text-slate-400 mb-3">
                Original Order
              </h4>
              <div className="space-y-2">
                {compounds.map((compound, idx) => (
                  <div
                    key={compound.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-3"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-mono text-slate-500 mt-0.5">
                        #{idx + 1}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium text-white">{compound.name}</div>
                        <div className="text-sm text-slate-400">{compound.dose}</div>
                        {compound.timing && (
                          <div className="text-xs text-slate-500 mt-1">
                            {compound.timing}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optimized Stack */}
            <div>
              <h4 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Optimized Order
              </h4>
              <div className="space-y-2">
                {optimizedCompounds.map((compound, idx) => (
                  <div
                    key={compound.id}
                    className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-mono text-purple-400 mt-0.5">
                        #{idx + 1}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium text-white">{compound.name}</div>
                        <div className="text-sm text-slate-400">{compound.dose}</div>
                        {compound.timing && (
                          <div className="text-xs text-purple-300 mt-1 font-medium">
                            ⏰ {compound.timing}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Changes Explanation */}
          {changes.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Changes Made</h4>
              {changes.map((change, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-purple-400">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white mb-1">
                        {change.compound}
                      </div>
                      <div className="text-sm text-slate-300 mb-2">
                        {change.change}
                      </div>
                      <div className="text-xs text-slate-400 italic">
                        💡 {change.reason}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
