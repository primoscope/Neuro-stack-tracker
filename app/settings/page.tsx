"use client";

import { useState } from "react";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Download,
  Upload,
  Lock,
  Palette,
  Brain,
  Pill,
  Layers,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { seedCompounds } from "@/lib/seed-data";

export default function SettingsPage() {
  const {
    compounds,
    stackPresets,
    settings,
    addCompound,
    updateCompound,
    deleteCompound,
    addPreset,
    deletePreset,
    exportData,
    importData,
    updateSettings,
    logout,
  } = useStore();

  const [showCompoundDialog, setShowCompoundDialog] = useState(false);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [showApiDialog, setShowApiDialog] = useState(false);

  // Compound form state
  const [compoundForm, setCompoundForm] = useState({
    name: "",
    defaultDose: 100,
    unit: "mg" as "mg" | "ml" | "g" | "pills" | "mcg",
    colorHex: "#3b82f6",
  });

  // Preset form state
  const [presetForm, setPresetForm] = useState({
    name: "",
    colorHex: "#10b981",
    selectedCompounds: [] as Array<{ compoundId: string; dose: number }>,
  });

  const [apiKey, setApiKey] = useState(settings.geminiApiKey);
  const [importError, setImportError] = useState("");

  const handleAddCompound = () => {
    if (!compoundForm.name.trim()) return;
    
    addCompound({
      name: compoundForm.name,
      defaultDose: compoundForm.defaultDose,
      unit: compoundForm.unit,
      colorHex: compoundForm.colorHex,
      isActive: true,
    });

    setCompoundForm({
      name: "",
      defaultDose: 100,
      unit: "mg",
      colorHex: "#3b82f6",
    });
    setShowCompoundDialog(false);
  };

  const handleAddPreset = () => {
    if (!presetForm.name.trim() || presetForm.selectedCompounds.length === 0) return;

    addPreset({
      name: presetForm.name,
      colorHex: presetForm.colorHex,
      doseItems: presetForm.selectedCompounds,
    });

    setPresetForm({
      name: "",
      colorHex: "#10b981",
      selectedCompounds: [],
    });
    setShowPresetDialog(false);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neurostack_backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.compounds || data.stackPresets || data.logEntries) {
          importData(data);
          setImportError("");
          alert("Data imported successfully!");
        } else {
          setImportError("Invalid backup file format");
        }
      } catch (error) {
        setImportError("Failed to parse backup file");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset input
  };

  const handleSaveApiKey = () => {
    updateSettings({ geminiApiKey: apiKey });
    setShowApiDialog(false);
  };

  const handleToggleCompound = (compoundId: string, isActive: boolean) => {
    updateCompound(compoundId, { isActive });
  };

  const handleLoadSampleData = () => {
    if (!confirm('This will add pre-configured compounds to your pharmacy. Continue?')) {
      return;
    }
    
    seedCompounds.forEach(compound => {
      addCompound(compound);
    });
    
    alert(`Successfully added ${seedCompounds.length} compounds to your pharmacy!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-sm text-slate-400">Manage your pharmacy & preferences</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        {/* Compound Management */}
        <Card className="glass border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-blue-500" />
                  Pharmacy (Compounds)
                </CardTitle>
                <CardDescription className="mt-1">
                  Manage your supplement and medication inventory
                </CardDescription>
              </div>
              <Button onClick={() => setShowCompoundDialog(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Compound
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {compounds.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <p className="text-slate-500">
                  No compounds yet. Add your first one to get started!
                </p>
                <div className="flex gap-2 justify-center">
                  <Link href="/library">
                    <Button variant="outline" size="sm">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Browse Library (70 compounds)
                    </Button>
                  </Link>
                  <Button onClick={handleLoadSampleData} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Load Sample (16 compounds)
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {compounds.map((compound) => (
                  <div
                    key={compound.id}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: compound.colorHex }}
                      />
                      <div>
                        <div className="font-medium">{compound.name}</div>
                        <div className="text-sm text-slate-400">
                          Default: {compound.defaultDose} {compound.unit}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={compound.isActive}
                        onCheckedChange={(checked) => handleToggleCompound(compound.id, checked)}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => deleteCompound(compound.id)}
                        className="h-8 w-8 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stack Presets */}
        <Card className="glass border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-500" />
                  Stack Presets
                </CardTitle>
                <CardDescription className="mt-1">
                  Create one-tap logging shortcuts for common combinations
                </CardDescription>
              </div>
              <Button
                onClick={() => setShowPresetDialog(true)}
                size="sm"
                disabled={compounds.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Preset
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stackPresets.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                {compounds.length === 0
                  ? "Add compounds first before creating presets"
                  : "No presets yet. Create one for faster logging!"}
              </p>
            ) : (
              <div className="space-y-3">
                {stackPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: preset.colorHex }}
                      />
                      <div>
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-sm text-slate-400">
                          {preset.doseItems.length} compound{preset.doseItems.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deletePreset(preset.id)}
                      className="h-8 w-8 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Analysis */}
        <Card className="glass border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              AI Analysis (Gemini)
            </CardTitle>
            <CardDescription className="mt-1">
              Configure your Google Gemini API key for trend analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>API Key Status</Label>
                <p className="text-sm text-slate-400 mt-1">
                  {settings.geminiApiKey
                    ? "✓ API key configured"
                    : "No API key set"}
                </p>
              </div>
              <Button onClick={() => setShowApiDialog(true)} variant="outline">
                {settings.geminiApiKey ? "Update API Key" : "Set API Key"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="glass border-slate-800">
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription className="mt-1">
              Backup and restore your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {importError && (
                <Alert variant="destructive">
                  <AlertDescription>{importError}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-3">
                <Button onClick={handleExport} variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <label className="flex-1">
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Data
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="glass border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-400" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={logout}
              variant="outline"
              className="text-red-400 hover:text-red-300"
            >
              Lock App
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Add Compound Dialog */}
      <Dialog open={showCompoundDialog} onOpenChange={setShowCompoundDialog}>
        <DialogContent
          onClose={() => setShowCompoundDialog(false)}
          className="sm:max-w-[425px] bg-slate-900 border-slate-800"
        >
          <DialogHeader>
            <DialogTitle>Add New Compound</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., Bromantane, Taurine"
                value={compoundForm.name}
                onChange={(e) =>
                  setCompoundForm({ ...compoundForm, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dose">Default Dose</Label>
                <Input
                  id="dose"
                  type="number"
                  value={compoundForm.defaultDose}
                  onChange={(e) =>
                    setCompoundForm({
                      ...compoundForm,
                      defaultDose: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  id="unit"
                  value={compoundForm.unit}
                  onChange={(e) =>
                    setCompoundForm({
                      ...compoundForm,
                      unit: e.target.value as any,
                    })
                  }
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
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={compoundForm.colorHex}
                  onChange={(e) =>
                    setCompoundForm({ ...compoundForm, colorHex: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={compoundForm.colorHex}
                  onChange={(e) =>
                    setCompoundForm({ ...compoundForm, colorHex: e.target.value })
                  }
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
            <Button onClick={handleAddCompound} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Compound
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Preset Dialog */}
      <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
        <DialogContent
          onClose={() => setShowPresetDialog(false)}
          className="sm:max-w-[500px] bg-slate-900 border-slate-800"
        >
          <DialogHeader>
            <DialogTitle>Create Stack Preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                placeholder="e.g., Morning Protocol"
                value={presetForm.name}
                onChange={(e) =>
                  setPresetForm({ ...presetForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preset-color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="preset-color"
                  type="color"
                  value={presetForm.colorHex}
                  onChange={(e) =>
                    setPresetForm({ ...presetForm, colorHex: e.target.value })
                  }
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={presetForm.colorHex}
                  onChange={(e) =>
                    setPresetForm({ ...presetForm, colorHex: e.target.value })
                  }
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Select Compounds</Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {compounds.filter((c) => c.isActive).map((compound) => {
                  const selected = presetForm.selectedCompounds.find(
                    (sc) => sc.compoundId === compound.id
                  );
                  return (
                    <div
                      key={compound.id}
                      className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg"
                    >
                      <Switch
                        checked={!!selected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPresetForm({
                              ...presetForm,
                              selectedCompounds: [
                                ...presetForm.selectedCompounds,
                                {
                                  compoundId: compound.id,
                                  dose: compound.defaultDose,
                                },
                              ],
                            });
                          } else {
                            setPresetForm({
                              ...presetForm,
                              selectedCompounds: presetForm.selectedCompounds.filter(
                                (sc) => sc.compoundId !== compound.id
                              ),
                            });
                          }
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium" style={{ color: compound.colorHex }}>
                          {compound.name}
                        </div>
                      </div>
                      {selected && (
                        <Input
                          type="number"
                          value={selected.dose}
                          onChange={(e) => {
                            setPresetForm({
                              ...presetForm,
                              selectedCompounds: presetForm.selectedCompounds.map((sc) =>
                                sc.compoundId === compound.id
                                  ? { ...sc, dose: Number(e.target.value) }
                                  : sc
                              ),
                            });
                          }}
                          className="w-24"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <Button
              onClick={handleAddPreset}
              className="w-full"
              disabled={presetForm.selectedCompounds.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Preset
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* API Key Dialog */}
      <Dialog open={showApiDialog} onOpenChange={setShowApiDialog}>
        <DialogContent
          onClose={() => setShowApiDialog(false)}
          className="sm:max-w-[425px] bg-slate-900 border-slate-800"
        >
          <DialogHeader>
            <DialogTitle>Google Gemini API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your Gemini API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Get your API key from{" "}
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Google AI Studio
                </a>
              </p>
            </div>
            <Button onClick={handleSaveApiKey} className="w-full">
              Save API Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
