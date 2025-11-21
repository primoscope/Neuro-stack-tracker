"use client";

import { useState } from "react";
import { CompoundDetail } from "@/lib/compound-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { CompoundInsightPopover } from "./CompoundInsightPopover";

interface CompoundCardProps {
  compound: CompoundDetail;
  onClick: () => void;
  className?: string;
}

export function CompoundCard({ compound, onClick, className = "" }: CompoundCardProps) {
  const [showInsight, setShowInsight] = useState(false);

  // Get evidence color
  const getEvidenceColor = (grade: string) => {
    const colors: Record<string, string> = {
      A: "bg-green-500/20 text-green-300 border-green-500/50",
      B: "bg-blue-500/20 text-blue-300 border-blue-500/50",
      C: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
      D: "bg-orange-500/20 text-orange-300 border-orange-500/50",
      E: "bg-red-500/20 text-red-300 border-red-500/50",
      H: "bg-gray-500/20 text-gray-300 border-gray-500/50",
    };
    return colors[grade] || colors.E;
  };

  const handleAIInsightClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInsight(true);
  };

  return (
    <>
      <button
        onClick={onClick}
        className={`text-left p-4 bg-slate-800/50 hover:bg-slate-800 active:bg-slate-700/80 rounded-lg transition-all border border-slate-700 hover:border-slate-600 w-full touch-manipulation ${className}`}
        aria-label={`View details for ${compound.name}`}
      >
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-slate-100 line-clamp-1">
              {compound.name}
            </h3>
          </div>
          
          {compound.aliases.length > 0 && (
            <p className="text-xs text-slate-400 line-clamp-1">
              Also: {compound.aliases.slice(0, 2).join(", ")}
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/50">
            {compound.effectType}
          </Badge>
          {compound.categoryTags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs bg-slate-700/50 text-slate-300">
              {tag}
            </Badge>
          ))}
          {compound.categoryTags.length > 2 && (
            <Badge variant="outline" className="text-xs bg-slate-700/50 text-slate-400">
              +{compound.categoryTags.length - 2}
            </Badge>
          )}
        </div>

        {/* Metrics */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex items-center gap-3 text-xs">
            <div className={`px-2 py-1 rounded border ${getEvidenceColor(compound.evidence.strength)}`}>
              Evidence: {compound.evidence.strength}
            </div>
            <div className="text-slate-400">
              Efficacy: <span className="text-slate-300 font-medium">{compound.efficacyScore}/10</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAIInsightClick}
            className="h-7 px-2 text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            AI
          </Button>
        </div>
      </button>
      
      {/* AI Insight Popover */}
      <CompoundInsightPopover
        compoundName={compound.name}
        compoundCategory={compound.effectType}
        open={showInsight}
        onOpenChange={setShowInsight}
      />
    </>
  );
}
