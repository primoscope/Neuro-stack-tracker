/**
 * Pharmacokinetic Engine - "The Neuro-Curve"
 * Models compound concentration curves over time
 */

import { CompoundDetail, OnsetPeakDuration } from './compound-types';

export interface PharmacokineticProfile {
  compoundId: string;
  compoundName: string;
  timePoints: Array<{
    time: number; // minutes from administration
    concentration: number; // relative concentration (0-100)
  }>;
  onset: number; // minutes
  peak: number; // minutes
  duration: number; // minutes
  doseTime: number; // timestamp when taken
}

/**
 * Calculate pharmacokinetic profile for a compound
 * Uses a simplified absorption-distribution-elimination model
 */
export function calculatePharmacokineticProfile(
  compound: CompoundDetail,
  doseTime: number = Date.now(),
  resolution: number = 15 // data points every 15 minutes
): PharmacokineticProfile {
  const onset = compound.onset;
  
  // Use average values or defaults
  const onsetMin = onset.onsetMin || 30;
  const peakMin = onset.peakMin || onsetMin * 2;
  const durationMin = onset.durationMin || peakMin * 3;

  const timePoints: Array<{ time: number; concentration: number }> = [];
  const totalTime = Math.max(durationMin, 1440); // At least 24 hours

  for (let t = 0; t <= totalTime; t += resolution) {
    const concentration = calculateConcentrationAtTime(
      t,
      onsetMin,
      peakMin,
      durationMin
    );
    timePoints.push({ time: t, concentration });
  }

  return {
    compoundId: compound.id,
    compoundName: compound.name,
    timePoints,
    onset: onsetMin,
    peak: peakMin,
    duration: durationMin,
    doseTime,
  };
}

/**
 * Calculate relative concentration at a specific time point
 * Uses a bi-exponential model:
 * - Rising phase: exponential absorption
 * - Falling phase: exponential elimination
 */
function calculateConcentrationAtTime(
  time: number,
  onset: number,
  peak: number,
  duration: number
): number {
  if (time < 0) return 0;

  // Before onset - no absorption yet
  if (time < onset) {
    // Gentle rise during onset phase
    return (time / onset) * 20; // Reaches 20% at onset
  }

  // Rising phase (onset to peak)
  if (time < peak) {
    const progress = (time - onset) / (peak - onset);
    // Exponential rise to 100%
    return 20 + 80 * Math.pow(progress, 0.7);
  }

  // Peak to end of duration - exponential decay
  const timeSincePeak = time - peak;
  const eliminationTime = duration - peak;

  if (timeSincePeak < eliminationTime) {
    // First-order elimination (exponential decay)
    const halfLife = eliminationTime / 3; // Simplified: 3 half-lives to near zero
    const decayConstant = Math.log(2) / halfLife;
    return 100 * Math.exp(-decayConstant * timeSincePeak);
  }

  // After duration - residual elimination (slow tail)
  const residualTime = time - duration;
  const residualHalfLife = duration / 4;
  const residualDecay = Math.log(2) / residualHalfLife;
  const residualConcentration = 5 * Math.exp(-residualDecay * residualTime);

  return Math.max(residualConcentration, 0);
}

/**
 * Calculate composite load curve from multiple compounds
 */
export function calculateCompositeLoad(
  profiles: PharmacokineticProfile[]
): Array<{ time: number; totalLoad: number; compounds: Record<string, number> }> {
  if (profiles.length === 0) return [];

  // Find the earliest dose time
  const earliestDose = Math.min(...profiles.map(p => p.doseTime));
  
  // Create time points (every 15 minutes for 24 hours)
  const timePoints: Array<{
    time: number;
    totalLoad: number;
    compounds: Record<string, number>;
  }> = [];

  for (let minutes = 0; minutes <= 1440; minutes += 15) {
    const absoluteTime = earliestDose + minutes * 60 * 1000;
    let totalLoad = 0;
    const compounds: Record<string, number> = {};

    profiles.forEach(profile => {
      const minutesSinceDose = (absoluteTime - profile.doseTime) / (60 * 1000);
      const concentration = calculateConcentrationAtTime(
        minutesSinceDose,
        profile.onset,
        profile.peak,
        profile.duration
      );
      
      totalLoad += concentration;
      compounds[profile.compoundName] = concentration;
    });

    timePoints.push({
      time: minutes,
      totalLoad,
      compounds,
    });
  }

  return timePoints;
}

/**
 * Get current plasma concentration estimate
 */
export function getCurrentConcentration(
  profile: PharmacokineticProfile,
  currentTime: number = Date.now()
): number {
  const minutesSinceDose = (currentTime - profile.doseTime) / (60 * 1000);
  return calculateConcentrationAtTime(
    minutesSinceDose,
    profile.onset,
    profile.peak,
    profile.duration
  );
}

/**
 * Predict when compound will be below a threshold
 */
export function predictClearanceTime(
  profile: PharmacokineticProfile,
  threshold: number = 10 // 10% concentration
): number {
  // Find the time point where concentration drops below threshold
  const point = profile.timePoints.find(p => p.concentration < threshold);
  if (!point) {
    // If not found, use the last time point
    return profile.doseTime + profile.duration * 60 * 1000;
  }
  return profile.doseTime + point.time * 60 * 1000;
}

/**
 * Check if two compounds have overlapping effects
 */
export function checkOverlap(
  profile1: PharmacokineticProfile,
  profile2: PharmacokineticProfile,
  threshold: number = 20 // 20% concentration
): boolean {
  const start1 = profile1.doseTime;
  const end1 = predictClearanceTime(profile1, threshold);
  const start2 = profile2.doseTime;
  const end2 = predictClearanceTime(profile2, threshold);

  return (start1 <= end2 && end1 >= start2);
}
