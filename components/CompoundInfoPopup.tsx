"use client";

import { useState, useEffect } from 'react';
import { X, Clock, Zap, Shield, AlertCircle, Info } from 'lucide-react';
import { CompoundDetail } from '@/lib/compound-types';

interface CompoundInfoPopupProps {
  compound: CompoundDetail;
  onClose: () => void;
  position?: 'center' | 'mouse';
}

/**
 * Quick Info Popup for compounds
 * Shows key stats: Half-life, Mechanism of Action, Safety, etc.
 */
export default function CompoundInfoPopup({
  compound,
  onClose,
  position = 'center',
}: CompoundInfoPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  function handleClose() {
    setIsVisible(false);
    setTimeout(onClose, 200); // Wait for fade-out animation
  }

  // Parse onset/peak/duration from raw string
  const pharmacokinetics = parsePharmacokineticData(compound.onset?.raw || '');

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Popup */}
      <div
        className={`fixed z-50 transition-all duration-200 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } ${
          position === 'center'
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
        }`}
        style={{ maxWidth: '90vw', width: '500px' }}
      >
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-b border-slate-700 px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{compound.name}</h3>
                {compound.aliases && compound.aliases.length > 0 && (
                  <p className="text-sm text-gray-400 mt-1">
                    Also known as: {compound.aliases.slice(0, 3).join(', ')}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                    {compound.effectType}
                  </span>
                  {compound.acuteEffect && (
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded-full border border-green-500/30">
                      Acute Effect
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Primary Effects */}
            {compound.primaryEffects && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-purple-400" />
                  <h4 className="text-sm font-semibold text-gray-300">Primary Effects</h4>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {compound.primaryEffects}
                </p>
              </div>
            )}

            {/* Mechanism of Action */}
            {compound.mechanism && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <h4 className="text-sm font-semibold text-gray-300">Mechanism of Action</h4>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {compound.mechanism}
                </p>
                {compound.mechanisticTags && compound.mechanisticTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {compound.mechanisticTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-yellow-500/10 text-yellow-300 rounded border border-yellow-500/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pharmacokinetics */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-blue-400" />
                <h4 className="text-sm font-semibold text-gray-300">Pharmacokinetics</h4>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Onset</p>
                  <p className="text-sm text-white font-medium">{pharmacokinetics.onset}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Peak</p>
                  <p className="text-sm text-white font-medium">{pharmacokinetics.peak}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Duration</p>
                  <p className="text-sm text-white font-medium">{pharmacokinetics.duration}</p>
                </div>
              </div>
              {compound.daytimeNighttime && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <p className="text-xs text-gray-500 mb-1">Best Timing</p>
                  <p className="text-sm text-blue-300">{compound.daytimeNighttime}</p>
                </div>
              )}
            </div>

            {/* Safety & Evidence */}
            <div className="grid grid-cols-2 gap-4">
              {/* Safety Score */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <h4 className="text-sm font-semibold text-gray-300">Safety</h4>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-green-400">
                    {compound.safetyScore}
                  </span>
                  <span className="text-sm text-gray-500">/10</span>
                </div>
                {compound.recreational && compound.recreational !== 'No' && (
                  <p className="text-xs text-orange-400 mt-2">
                    Recreational potential: {compound.recreational}
                  </p>
                )}
              </div>

              {/* Evidence */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-400" />
                  <h4 className="text-sm font-semibold text-gray-300">Evidence</h4>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-blue-400">
                    {compound.evidence?.strength || 'N/A'}
                  </span>
                  <span className="text-sm text-gray-500">Grade</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Efficacy: {compound.efficacyScore}/30
                </p>
              </div>
            </div>

            {/* Interactions */}
            {(compound.interactions?.voxra || compound.interactions?.ssri) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-orange-400" />
                  <h4 className="text-sm font-semibold text-gray-300">Notable Interactions</h4>
                </div>
                <div className="space-y-2">
                  {compound.interactions.voxra && (
                    <div className="text-sm bg-orange-900/20 border border-orange-500/30 rounded p-2">
                      <p className="text-orange-300 font-medium text-xs mb-1">
                        Bupropion (Voxra)
                      </p>
                      <p className="text-gray-400 text-xs">{compound.interactions.voxra}</p>
                    </div>
                  )}
                  {compound.interactions.ssri && (
                    <div className="text-sm bg-orange-900/20 border border-orange-500/30 rounded p-2">
                      <p className="text-orange-300 font-medium text-xs mb-1">SSRI</p>
                      <p className="text-gray-400 text-xs">{compound.interactions.ssri}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dependence & Tolerance */}
            {compound.dependenceTolerance && (
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-gray-500 mb-1">Dependence/Tolerance Risk</p>
                <p className="text-sm text-gray-300">{compound.dependenceTolerance}</p>
              </div>
            )}

            {/* Evidence Summary */}
            {compound.evidence?.summary && (
              <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-300 font-medium mb-1">Evidence Summary</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {compound.evidence.summary}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-900/50 border-t border-slate-700 px-6 py-3">
            <p className="text-xs text-gray-500">
              ⚠️ This information is for educational purposes only. Always consult a healthcare
              professional before starting any new supplement or medication.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Parse pharmacokinetic string (e.g., "30 min / 2 hrs / 6 hrs")
 */
function parsePharmacokineticData(raw: string): {
  onset: string;
  peak: string;
  duration: string;
} {
  const parts = raw.split('/').map(s => s.trim());
  
  return {
    onset: parts[0] || 'N/A',
    peak: parts[1] || 'N/A',
    duration: parts[2] || 'N/A',
  };
}
