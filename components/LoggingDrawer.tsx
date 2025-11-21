"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save, Plus, Minus } from "lucide-react";

interface DoseInput {
  compoundId: string;
  dose: number;
}

export function LoggingDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { compounds, addLog } = useStore();
  const [doseInputs, setDoseInputs] = useState<DoseInput[]>([]);
  const [anxiety, setAnxiety] = useState(5);
  const [functionality, setFunctionality] = useState(5);
  const [notes, setNotes] = useState("");

  // Initialize dose inputs when compounds change
  useEffect(() => {
    if (compounds.length > 0 && doseInputs.length === 0) {
      setDoseInputs(
        compounds
          .filter((c) => c.isActive)
          .map((c) => ({
            compoundId: c.id,
            dose: c.defaultDose,
          }))
      );
    }
  }, [compounds, doseInputs.length]);

  const activeCompounds = compounds.filter((c) => c.isActive);

  const handleDoseChange = (compoundId: string, delta: number) => {
    setDoseInputs((prev) =>
      prev.map((input) =>
        input.compoundId === compoundId
          ? { ...input, dose: Math.max(0, input.dose + delta) }
          : input
      )
    );
  };

  const handleSave = () => {
    const date = new Date().toISOString().split("T")[0];
    
    addLog({
      date,
      doseItems: doseInputs
        .filter((input) => input.dose > 0)
        .map((input) => ({
          compoundId: input.compoundId,
          dose: input.dose,
          timestamp: Date.now(),
        })),
      anxiety,
      functionality,
      notes,
    });

    // Reset form
    setAnxiety(5);
    setFunctionality(5);
    setNotes("");
    onOpenChange(false);
  };

  if (activeCompounds.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent onClose={() => onOpenChange(false)} className="sm:max-w-[500px] bg-slate-900 border-slate-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>No Active Compounds</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">
              Add compounds to your pharmacy first before logging.
            </p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="sm:max-w-[500px] bg-slate-900 border-slate-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manual Log Entry</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Compound Doses */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Compound Doses</Label>
            {doseInputs.map((input) => {
              const compound = compounds.find((c) => c.id === input.compoundId);
              if (!compound) return null;

              return (
                <div key={compound.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm" style={{ color: compound.colorHex }}>
                      {compound.name}
                    </Label>
                    <span className="text-sm text-slate-400">
                      {input.dose} {compound.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => handleDoseChange(compound.id, -10)}
                      className="h-8 w-8"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      value={input.dose}
                      onChange={(e) =>
                        setDoseInputs((prev) =>
                          prev.map((i) =>
                            i.compoundId === compound.id
                              ? { ...i, dose: Number(e.target.value) || 0 }
                              : i
                          )
                        )
                      }
                      className="text-center h-8"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => handleDoseChange(compound.id, 10)}
                      className="h-8 w-8"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Anxiety Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Anxiety Level</Label>
              <span className="text-lg font-bold" style={{ color: "#ff4444" }}>
                {anxiety}/10
              </span>
            </div>
            <Slider value={anxiety} onValueChange={setAnxiety} min={1} max={10} step={1} />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Calm</span>
              <span>High Anxiety</span>
            </div>
          </div>

          {/* Functionality Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Functionality Level</Label>
              <span className="text-lg font-bold" style={{ color: "#10b981" }}>
                {functionality}/10
              </span>
            </div>
            <Slider value={functionality} onValueChange={setFunctionality} min={1} max={10} step={1} />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Low</span>
              <span>Peak Performance</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="How are you feeling? Any observations?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full bg-blue-500 hover:bg-blue-600">
            <Save className="w-4 h-4 mr-2" />
            Save Log Entry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
