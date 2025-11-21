"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

interface QuickLogPresetsProps {
  onOpenDrawer: () => void;
}

export function QuickLogPresets({ onOpenDrawer }: QuickLogPresetsProps) {
  const { stackPresets, logPreset, compounds } = useStore();
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [anxiety, setAnxiety] = useState(5);
  const [functionality, setFunctionality] = useState(5);
  const [notes, setNotes] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const handlePresetClick = (presetId: string) => {
    setSelectedPresetId(presetId);
    setShowDialog(true);
  };

  const handleQuickLog = () => {
    if (selectedPresetId) {
      logPreset(selectedPresetId, anxiety, functionality, notes);
      setShowDialog(false);
      setAnxiety(5);
      setFunctionality(5);
      setNotes("");
      setSelectedPresetId(null);
    }
  };

  if (stackPresets.length === 0) {
    return null;
  }

  const selectedPreset = stackPresets.find((p) => p.id === selectedPresetId);

  return (
    <>
      <Card className="glass border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Quick Log Presets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {stackPresets.map((preset) => (
              <Button
                key={preset.id}
                onClick={() => handlePresetClick(preset.id)}
                variant="outline"
                className="h-auto py-4 px-4 flex flex-col items-start gap-2 border-2 hover:border-blue-500 transition-colors"
                style={{ borderColor: preset.colorHex + "40" }}
              >
                <div
                  className="text-base font-semibold"
                  style={{ color: preset.colorHex }}
                >
                  {preset.name}
                </div>
                <div className="text-xs text-slate-400 text-left">
                  {preset.doseItems.length} compound{preset.doseItems.length !== 1 ? "s" : ""}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Log Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          onClose={() => setShowDialog(false)}
          className="sm:max-w-[450px] bg-slate-900 border-slate-800"
        >
          <DialogHeader>
            <DialogTitle>
              Quick Log: {selectedPreset?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Show what's in this preset */}
            {selectedPreset && (
              <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                <Label className="text-sm text-slate-400">Compounds in this stack:</Label>
                {selectedPreset.doseItems.map((item) => {
                  const compound = compounds.find((c) => c.id === item.compoundId);
                  if (!compound) return null;
                  return (
                    <div key={item.compoundId} className="flex items-center justify-between text-sm">
                      <span style={{ color: compound.colorHex }}>{compound.name}</span>
                      <span className="text-slate-400">
                        {item.dose} {compound.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Anxiety Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Anxiety Level</Label>
                <span className="text-lg font-bold text-red-400">{anxiety}/10</span>
              </div>
              <Slider value={anxiety} onValueChange={setAnxiety} min={1} max={10} step={1} />
            </div>

            {/* Functionality Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Functionality Level</Label>
                <span className="text-lg font-bold text-emerald-500">{functionality}/10</span>
              </div>
              <Slider
                value={functionality}
                onValueChange={setFunctionality}
                min={1}
                max={10}
                step={1}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Any observations?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleQuickLog}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                <Check className="w-4 h-4 mr-2" />
                Log It
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
