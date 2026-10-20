import { Progress } from './ui/progress';
import { formatLabel } from '../lib/format';

interface ProbabilityBreakdownProps {
  allProbabilities: Record<string, number> | undefined;
  predictedClass: string;
  title?: string;
}

export function ProbabilityBreakdown({
  allProbabilities,
  predictedClass,
  title = 'Confidence by Class',
}: ProbabilityBreakdownProps) {
  if (!allProbabilities) return null;

  const entries = Object.entries(allProbabilities).sort(([, a], [, b]) => b - a);

  return (
    <div className="pt-4 border-t">
      <h4 className="mb-2 text-muted-foreground">{title}:</h4>
      <div className="space-y-2">
        {entries.map(([label, value]) => (
          <div key={label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className={label === predictedClass ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                {formatLabel(label)}
              </span>
              <span className="text-muted-foreground">{Math.round(value * 100)}%</span>
            </div>
            <Progress value={value * 100} className="h-1.5" />
          </div>
        ))}
      </div>
    </div>
  );
}
