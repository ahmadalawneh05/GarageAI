import { useState } from 'react';
import { useNavigate } from 'react-router';
import { RotateCcw, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import {
  SEVERITY_QUESTIONS,
  SEVERITY_ADVICE,
  scoreSeverity,
  getPositiveFindings,
  type SeverityFormCategory,
} from '../lib/severityForm';
import { severityBadgeClass, severityLabel } from '../lib/severity';
import { formatLabel } from '../lib/format';

interface SeverityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: SeverityFormCategory;
}

export function SeverityFormDialog({ open, onOpenChange, category }: SeverityFormDialogProps) {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const questions = SEVERITY_QUESTIONS[category];
  const allAnswered = questions.every((q) => q.id in answers);

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const result = submitted ? scoreSeverity(answers, category) : null;

  const askAboutResult = () => {
    if (!result) return;
    const findings = getPositiveFindings(answers, category);
    const seedMessage =
      `عبّيت فورم تقييم خطورة عطل "${formatLabel(category)}" وطلعت نتيجته ${result.percent}% (خطورة ${severityLabel(result.level)}).` +
      (findings.length > 0 ? ` الأعراض يلي أكّدتها: ${findings.join('، ')}.` : '') +
      ' شو رأيك بالسبب المحتمل، وشو الخطوات المناسبة؟';

    handleOpenChange(false);
    navigate('/chat', {
      state: {
        seedMessage,
        formResult: { predicted_class: category, percent: result.percent, level: result.level, positive_findings: findings },
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader dir="rtl" className="text-right">
          <DialogTitle>تقييم خطورة عطل {formatLabel(category)}</DialogTitle>
          <DialogDescription>
            هاي بس أسئلة سريعة بتحدد الخطورة بشكل ثابت، ما بتحتاج اتصال بالذكاء الاصطناعي.
          </DialogDescription>
        </DialogHeader>

        {!submitted ? (
          <div dir="rtl" className="space-y-5 text-right">
            {questions.map((q) => (
              <div key={q.id} className="space-y-2">
                <p className="text-sm">{q.text}</p>
                <RadioGroup
                  dir="rtl"
                  value={q.id in answers ? (answers[q.id] ? 'yes' : 'no') : undefined}
                  onValueChange={(value) => setAnswers((prev) => ({ ...prev, [q.id]: value === 'yes' }))}
                  className="flex gap-6"
                >
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`${q.id}-yes`}>نعم</Label>
                    <RadioGroupItem value="yes" id={`${q.id}-yes`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`${q.id}-no`}>لأ</Label>
                    <RadioGroupItem value="no" id={`${q.id}-no`} />
                  </div>
                </RadioGroup>
              </div>
            ))}
          </div>
        ) : (
          result && (
            <div dir="rtl" className="space-y-3 text-right">
              <div className="flex items-center gap-2">
                <Badge className={`${severityBadgeClass(result.level)} border`}>{severityLabel(result.level)}</Badge>
                <span className="text-sm text-muted-foreground">{result.percent}% نسبة الخطورة</span>
              </div>
              <p className="text-sm">{SEVERITY_ADVICE[result.level]}</p>
              <p className="text-xs text-muted-foreground">
                هاد تقدير أولي مبني على إجاباتك بس، مش بديل عن فحص فعلي بالورشة.
              </p>
            </div>
          )
        )}

        <DialogFooter dir="rtl" className="sm:justify-start">
          {!submitted ? (
            <Button className="w-full sm:w-auto" disabled={!allAnswered} onClick={() => setSubmitted(true)}>
              احسب الخطورة
            </Button>
          ) : (
            <>
              <Button variant="outline" className="gap-1.5 w-full sm:w-auto" onClick={askAboutResult}>
                <MessageCircle className="h-3.5 w-3.5" />
                اسأل GarageAI عن هاي النتيجة
              </Button>
              <Button variant="ghost" className="gap-1.5 w-full sm:w-auto" onClick={reset}>
                <RotateCcw className="h-3.5 w-3.5" />
                أعد التقييم
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
