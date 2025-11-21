/**
 * Advanced Pharmacokinetics Engine
 * Implements bi-exponential absorption-elimination model for realistic drug concentration curves
 * 
 * Model: C(t) = Dose * (ka / (ka - ke)) * (e^(-ke*t) - e^(-ka*t))
 * Where:
 * - C(t) = Concentration at time t
 * - ka = Absorption rate constant
 * - ke = Elimination rate constant
 * - Dose = Normalized dose (set to 1 for effect intensity)
 */

export interface PharmacokineticParameters {
  /** Absorption rate constant (1/hour) */
  ka?: number;
  /** Elimination rate constant (1/hour) */
  ke?: number;
  /** Onset time in minutes */
  onsetMinutes: number;
  /** Peak time in minutes */
  peakMinutes: number;
  /** Duration in minutes */
  durationMinutes: number;
  /** Dose time (hour of day, 0-23) */
  doseTime: number;
  /** Optional bioavailability factor (0-1) */
  bioavailability?: number;
}

export interface PharmacokineticCurvePoint {
  /** Time in hours from midnight */
  time: number;
  /** Concentration/effect intensity (0-1) */
  concentration: number;
  /** Phase: 'absorption', 'peak', 'elimination', or 'inactive' */
  phase: 'absorption' | 'peak' | 'elimination' | 'inactive';
}

/**
 * Estimate absorption rate constant from onset time
 * Uses the relationship: time to 90% absorption ≈ 2.3 / ka
 */
function estimateKa(onsetMinutes: number): number {
  if (onsetMinutes <= 0) return 2.0; // Fast absorption default
  const onsetHours = onsetMinutes / 60;
  // Onset typically represents time to initial noticeable effects (~10-20% of peak)
  // Use a factor of 3 to reach ~50% absorption by onset time for more accurate modeling
  return (3 * Math.log(2)) / onsetHours;
}

/**
 * Estimate elimination rate constant from duration
 * Uses the relationship: time to 10% remaining ≈ 2.3 / ke
 */
function estimateKe(durationMinutes: number, peakMinutes: number): number {
  if (durationMinutes <= peakMinutes) return 0.5; // Default moderate elimination
  const effectiveDuration = durationMinutes - peakMinutes;
  const durationHours = effectiveDuration / 60;
  // Estimate half-life as 1/3 of effective duration
  const halfLife = durationHours / 3;
  return Math.log(2) / halfLife;
}

/**
 * Calculate concentration at a specific time using bi-exponential model
 * 
 * @param timeSinceDose Time in hours since dose administration
 * @param params Pharmacokinetic parameters
 * @returns Concentration value (0-1)
 */
export function calculateConcentration(
  timeSinceDose: number,
  params: PharmacokineticParameters
): number {
  // Handle negative time (before dose)
  if (timeSinceDose < 0) return 0;
  
  // Get or estimate rate constants
  const ka = params.ka ?? estimateKa(params.onsetMinutes);
  const ke = params.ke ?? estimateKe(params.durationMinutes, params.peakMinutes);
  
  // Bioavailability factor (default 1.0)
  const F = params.bioavailability ?? 1.0;
  
  // Normalized dose (we model effect intensity, not actual concentration)
  const dose = 1.0;
  
  // Bi-exponential equation
  // Avoid division by zero
  if (Math.abs(ka - ke) < 0.001) {
    // Use single-compartment approximation if rates are too close
    const k = (ka + ke) / 2;
    return F * dose * k * timeSinceDose * Math.exp(-k * timeSinceDose);
  }
  
  const concentration = 
    F * dose * (ka / (ka - ke)) * 
    (Math.exp(-ke * timeSinceDose) - Math.exp(-ka * timeSinceDose));
  
  // Normalize to max value of 1.0
  const peakTime = Math.log(ka / ke) / (ka - ke);
  const maxConcentration = 
    F * dose * (ka / (ka - ke)) * 
    (Math.exp(-ke * peakTime) - Math.exp(-ka * peakTime));
  
  // Handle edge case where maxConcentration is zero or very small
  if (maxConcentration < 1e-10) return 0;
  
  const normalized = concentration / maxConcentration;
  
  // Apply cutoff at very low concentrations (< 5% of peak)
  return normalized < 0.05 ? 0 : normalized;
}

/**
 * Determine the pharmacokinetic phase at a given time
 */
function determinePhase(
  timeSinceDose: number,
  concentration: number,
  params: PharmacokineticParameters
): PharmacokineticCurvePoint['phase'] {
  if (concentration === 0) return 'inactive';
  
  const peakHours = params.peakMinutes / 60;
  const durationHours = params.durationMinutes / 60;
  
  if (timeSinceDose < peakHours * 0.9) return 'absorption';
  if (timeSinceDose < peakHours * 1.1) return 'peak';
  if (timeSinceDose < durationHours) return 'elimination';
  
  return 'inactive';
}

/**
 * Generate a complete pharmacokinetic curve for a 24-hour period
 * 
 * @param params Pharmacokinetic parameters
 * @param pointsPerHour Number of data points per hour (default 4 = every 15 min)
 * @returns Array of curve points
 */
export function generatePharmacokineticCurve(
  params: PharmacokineticParameters,
  pointsPerHour: number = 4
): PharmacokineticCurvePoint[] {
  const curve: PharmacokineticCurvePoint[] = [];
  const hoursInDay = 24;
  const totalPoints = hoursInDay * pointsPerHour;
  
  for (let i = 0; i < totalPoints; i++) {
    const currentHour = i / pointsPerHour;
    
    // Calculate time since dose (handling day wraparound)
    let timeSinceDose = currentHour - params.doseTime;
    if (timeSinceDose < 0) {
      timeSinceDose += 24; // Wrap to previous day
    }
    
    const concentration = calculateConcentration(timeSinceDose, params);
    const phase = determinePhase(timeSinceDose, concentration, params);
    
    curve.push({
      time: currentHour,
      concentration,
      phase,
    });
  }
  
  return curve;
}

/**
 * Calculate aggregate effect from multiple compounds
 * 
 * @param curves Array of pharmacokinetic curves
 * @returns Aggregate curve with total concentration at each time point
 */
export function calculateAggregateEffect(
  curves: PharmacokineticCurvePoint[][]
): PharmacokineticCurvePoint[] {
  if (curves.length === 0) return [];
  
  const aggregateCurve: PharmacokineticCurvePoint[] = [];
  const pointCount = curves[0].length;
  
  for (let i = 0; i < pointCount; i++) {
    const time = curves[0][i].time;
    const totalConcentration = curves.reduce(
      (sum, curve) => sum + (curve[i]?.concentration || 0),
      0
    );
    
    aggregateCurve.push({
      time,
      concentration: totalConcentration,
      phase: totalConcentration > 0 ? 'peak' : 'inactive',
    });
  }
  
  return aggregateCurve;
}

/**
 * Identify periods of potential over-stimulation
 * 
 * @param aggregateCurve The combined effect curve
 * @param threshold Concentration threshold for over-stimulation (default 2.5)
 * @returns Array of time periods with high aggregate effect
 */
export function identifyOverloadPeriods(
  aggregateCurve: PharmacokineticCurvePoint[],
  threshold: number = 2.5
): Array<{ start: number; end: number; peak: number }> {
  const periods: Array<{ start: number; end: number; peak: number }> = [];
  let currentPeriod: { start: number; end: number; peak: number } | null = null;
  
  aggregateCurve.forEach(point => {
    if (point.concentration > threshold) {
      if (!currentPeriod) {
        currentPeriod = { start: point.time, end: point.time, peak: point.concentration };
      } else {
        currentPeriod.end = point.time;
        currentPeriod.peak = Math.max(currentPeriod.peak, point.concentration);
      }
    } else if (currentPeriod) {
      periods.push(currentPeriod);
      currentPeriod = null;
    }
  });
  
  // Add final period if exists
  if (currentPeriod) {
    periods.push(currentPeriod);
  }
  
  return periods;
}

/**
 * Identify potential crash periods (rapid decline in aggregate effect)
 * 
 * @param aggregateCurve The combined effect curve
 * @param thresholdDrop Minimum concentration drop to flag (default 0.5)
 * @returns Array of crash points with severity
 */
export function identifyCrashPeriods(
  aggregateCurve: PharmacokineticCurvePoint[],
  thresholdDrop: number = 0.5
): Array<{ time: number; severity: number }> {
  const crashes: Array<{ time: number; severity: number }> = [];
  
  for (let i = 1; i < aggregateCurve.length; i++) {
    const prev = aggregateCurve[i - 1].concentration;
    const curr = aggregateCurve[i].concentration;
    const drop = prev - curr;
    
    // Only flag if dropping from significant level and drop is substantial
    if (drop > thresholdDrop && prev > 1.5) {
      crashes.push({
        time: aggregateCurve[i].time,
        severity: drop,
      });
    }
  }
  
  return crashes;
}

/**
 * Format time as human-readable string
 */
export function formatTime(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
}

/**
 * Parse a pharmacokinetic string like "1-2h / 3-4h / 6-8h" into structured data
 * Exported for use in UI components that need to display pharmacokinetic data
 * 
 * @param pkString Pharmacokinetic string (e.g., "1-2h / 3-4h / 6-8h")
 * @returns Parsed onset, peak, and duration in minutes
 */
export function parsePharmacokineticString(pkString: string): {
  onsetMinutes: number;
  peakMinutes: number;
  durationMinutes: number;
} {
  const parts = pkString.split('/').map(s => s.trim());
  
  const parseTime = (timeStr: string): number => {
    const match = timeStr.match(/(\d+)(?:-(\d+))?\s*(min|hr|hour)/i);
    if (!match) return 0;
    
    const value = match[2] ? (parseInt(match[1]) + parseInt(match[2])) / 2 : parseInt(match[1]);
    const unit = match[3].toLowerCase();
    
    return unit.startsWith('hr') ? value * 60 : value;
  };

  return {
    onsetMinutes: parts[0] ? parseTime(parts[0]) : 30,
    peakMinutes: parts[1] ? parseTime(parts[1]) : 120,
    durationMinutes: parts[2] ? parseTime(parts[2]) : 360,
  };
}
