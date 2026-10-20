// Below this, the model's top guess is too shaky to present as a diagnosis --
// the UI shows an explicit "no clear match" state instead of picking a class.
export const UNCERTAIN_CONFIDENCE_THRESHOLD = 0.5;

export function confidenceBadgeClass(confidence: number) {
  if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
  if (confidence >= UNCERTAIN_CONFIDENCE_THRESHOLD) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

export function isUncertain(confidence: number) {
  return confidence < UNCERTAIN_CONFIDENCE_THRESHOLD;
}
