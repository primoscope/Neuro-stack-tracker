"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CompoundSearch } from "@/components/CompoundSearch";
import { CompoundDetail as CompoundDetailComponent } from "@/components/CompoundDetail";
import { Plus, Info } from "lucide-react";
import { CompoundDetail } from "@/lib/compound-types";

interface AddCompoundFromLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCompoundFromLibrary({ open, onOpenChange }: AddCompoundFromLibraryProps) {
  const { addCompound } = useStore();
  const [selectedCompound, setSelectedCompound] = useState<CompoundDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  
  // Form state for customization
  const [defaultDose, setDefaultDose] = useState(100);
  const [unit, setUnit] = useState<'mg' | 'ml' | 'g' | 'pills' | 'mcg' | 'IU'>('mg');
  const [colorHex, setColorHex] = useState('#3b82f6');

  const handleSelectCompound = (compound: CompoundDetail) => {
    setSelectedCompound(compound);
    // Try to infer unit from compound data if possible
    // Default to mg for most compounds
    setUnit('mg');
  };

  const handleViewDetails = () => {
    if (selectedCompound) {
      setShowDetail(true);
    }
  };

  const handleAddToPharmacy = () => {
    if (!selectedCompound) return;

    addCompound({
      name: selectedCompound.name,
      defaultDose,
      unit,
      colorHex,
      isActive: true,
    });

    // Reset form
    setSelectedCompound(null);
    setDefaultDose(100);
    setUnit('mg');
    setColorHex('#3b82f6');
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          onClose={() => onOpenChange(false)}
          className="sm:max-w-[600px] bg-slate-900 border-slate-800"
        >
          <DialogHeader>
            <DialogTitle>Add Compound from Library</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Search for compound */}
            <div className="space-y-2">
              <Label>Search Compound</Label>
              <CompoundSearch
                onSelectCompound={handleSelectCompound}
                placeholder="Search 70+ compounds..."
                autoFocus
              />
            </div>

            {/* Selected compound info */}
            {selectedCompound && (
              <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-100">
                      {selectedCompound.name}
                    </h3>
                    {selectedCompound.aliases.length > 0 && (
                      <p className="text-sm text-slate-400 mt-1">
                        Also: {selectedCompound.aliases.slice(0, 2).join(", ")}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewDetails}
                  >
                    <Info className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                    {selectedCompound.effectType}
                  </span>
                  {selectedCompound.categoryTags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="text-sm text-slate-300">
                  {selectedCompound.primaryEffects}
                </p>

                {/* Customize for pharmacy */}
                <div className="pt-4 border-t border-slate-700 space-y-3">
                  <Label className="text-slate-300">Customize for Your Pharmacy</Label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="dose" className="text-sm">Default Dose</Label>
                      <Input
                        id="dose"
                        type="number"
                        value={defaultDose}
                        onChange={(e) => setDefaultDose(Number(e.target.value))}
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit" className="text-sm">Unit</Label>
                      <Select
                        id="unit"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value as 'mg' | 'ml' | 'g' | 'pills' | 'mcg' | 'IU')}
                      >
                        <option value="mg">mg</option>
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                        <option value="mcg">mcg</option>
                        <option value="IU">IU</option>
                        <option value="pills">pills</option>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color" className="text-sm">Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={colorHex}
                        onChange={(e) => setColorHex(e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={colorHex}
                        onChange={(e) => setColorHex(e.target.value)}
                        placeholder="#3b82f6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleAddToPharmacy} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Pharmacy
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Compound detail modal */}
      <CompoundDetailComponent
        compound={selectedCompound}
        open={showDetail}
        onOpenChange={setShowDetail}
      />
    </>
  );
}
