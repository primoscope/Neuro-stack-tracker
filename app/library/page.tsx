"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompoundSearch } from "@/components/CompoundSearch";
import { CompoundDetail } from "@/components/CompoundDetail";
import { CompoundCard } from "@/components/CompoundCard";
import { ArrowLeft, Filter, Grid, List } from "lucide-react";
import Link from "next/link";
import { CompoundDetail as CompoundDetailType } from "@/lib/compound-types";
import {
  getAllCompounds,
  getCompoundsByCategory,
  getAllCategoryTags,
  searchCompounds,
} from "@/lib/compound-library";

export default function LibraryPage() {
  const [selectedCompound, setSelectedCompound] = useState<CompoundDetailType | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const allTags = useMemo(() => getAllCategoryTags(), []);
  const compoundsByCategory = useMemo(() => getCompoundsByCategory(), []);

  // Filter compounds based on selected tags
  const filteredCompounds = useMemo(() => {
    if (selectedTags.length === 0) {
      return getAllCompounds();
    }
    return searchCompounds({ tags: selectedTags });
  }, [selectedTags]);

  const handleSelectCompound = (compound: CompoundDetailType) => {
    setSelectedCompound(compound);
    setShowDetail(true);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
  };

  // Get compound count by category
  const getCategoryCount = (category: string): number => {
    if (selectedTags.length === 0) {
      return compoundsByCategory[category]?.length || 0;
    }
    return filteredCompounds.filter((c) => c.effectType === category).length;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header - Mobile Optimized */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-30 safe-area-inset">
        <div className="mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Link href="/">
                <Button variant="outline" size="icon" className="touch-manipulation">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold truncate">Compound Library</h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  {getAllCompounds().length} compounds
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={`touch-manipulation ${showFilters ? "bg-slate-800" : ""}`}
              >
                <Filter className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="touch-manipulation hidden sm:flex"
              >
                {viewMode === "grid" ? (
                  <List className="w-5 h-5" />
                ) : (
                  <Grid className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-20 md:pb-6">
        {/* Search Bar */}
        <div className="max-w-2xl">
          <CompoundSearch
            onSelectCompound={handleSelectCompound}
            placeholder="Search by name, alias, or brand name..."
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="glass border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Filter by Category</CardTitle>
                {selectedTags.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                  >
                    Clear ({selectedTags.length})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? "bg-blue-500 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active filters summary */}
        {selectedTags.length > 0 && (
          <div className="text-sm text-slate-400">
            Showing {filteredCompounds.length} compounds matching:{" "}
            <span className="text-slate-200 font-medium">
              {selectedTags.join(", ")}
            </span>
          </div>
        )}

        {/* Compounds by Category */}
        {Object.entries(compoundsByCategory)
          .filter(([category]) => getCategoryCount(category) > 0)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([category]) => {
            const categoryCompounds = filteredCompounds.filter(
              (c) => c.effectType === category
            );

            if (categoryCompounds.length === 0) return null;

            return (
              <Card key={category} className="glass border-slate-800">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {category}{" "}
                    <span className="text-slate-500 font-normal">
                      ({categoryCompounds.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {categoryCompounds.map((compound) => (
                        <CompoundCard
                          key={compound.id}
                          compound={compound}
                          onClick={() => handleSelectCompound(compound)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categoryCompounds.map((compound) => (
                        <button
                          key={compound.id}
                          onClick={() => handleSelectCompound(compound)}
                          className="w-full text-left p-4 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700 hover:border-slate-600 flex items-start justify-between"
                          aria-label={`View details for ${compound.name}`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-100">
                                {compound.name}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                                {compound.effectType}
                              </span>
                            </div>
                            {compound.aliases.length > 0 && (
                              <div className="text-sm text-slate-400 mt-1">
                                {compound.aliases.join(", ")}
                              </div>
                            )}
                            <div className="text-sm text-slate-400 mt-2">
                              {compound.primaryEffects}
                            </div>
                          </div>
                          <div className="text-right text-xs text-slate-400 ml-4">
                            <div>Grade: {compound.evidence.strength}</div>
                            <div className="mt-1">
                              {compound.efficacyScore}/10
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

        {/* Empty state */}
        {filteredCompounds.length === 0 && selectedTags.length > 0 && (
          <Card className="glass border-slate-800 border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-slate-400">
                No compounds found matching the selected filters.
              </p>
              <Button
                onClick={clearFilters}
                variant="outline"
                className="mt-4"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Compound Detail Modal */}
      <CompoundDetail
        compound={selectedCompound}
        open={showDetail}
        onOpenChange={setShowDetail}
      />
    </div>
  );
}
