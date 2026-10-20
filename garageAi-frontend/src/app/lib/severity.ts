import type { Severity } from './api';

export function severityBadgeClass(severity: Severity) {
  if (severity === 'high') return 'bg-red-100 text-red-800 border-red-200';
  if (severity === 'medium') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  return 'bg-green-100 text-green-800 border-green-200';
}

export function severityLabel(severity: Severity) {
  if (severity === 'high') return 'خطورة عالية';
  if (severity === 'medium') return 'خطورة متوسطة';
  return 'خطورة منخفضة';
}
