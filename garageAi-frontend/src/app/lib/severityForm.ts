import type { Severity } from './api';

export type SeverityFormCategory = 'belt' | 'brake' | 'sway';

export interface SeverityQuestion {
  id: string;
  text: string;
  weight: number;
}

// Mined from severity_glossary.md's "علامات ترفع الخطورة" (real mechanical severity
// signals, not just the presence of a sound) -- weight reflects how much that signal
// alone indicates the underlying fault is getting genuinely dangerous, not just annoying.
export const SEVERITY_QUESTIONS: Record<SeverityFormCategory, SeverityQuestion[]> = {
  belt: [
    { id: 'wobble', text: 'البكرة أو القشاط بيهتز أو بيترجرج بشكل واضح تقدر تشوفه بعينك؟', weight: 2 },
    { id: 'slipping', text: 'حاسس إنه القشاط "بينزلق" أو بيفلت لحظة تحت الحمل، مش بس صوت؟', weight: 2 },
    { id: 'electrical', text: 'صار معه تقطيع بالمحرك، ضعف بالأنوار، أو ضوّت لمبة البطارية عالتابلو؟', weight: 2 },
    { id: 'burning_smell', text: 'في ريحة مطاط محروق وقت ما يصير الصوت؟', weight: 2 },
    { id: 'sudden_onset', text: 'الصوت طلع فجأة وقوي، مش تدريجي وقاعد يزيد ببطء على مدى أيام؟', weight: 2 },
    { id: 'persists_after_repair', text: 'الصوت استمر حتى بعد ما صار تصليح أو تبديل قطع قبل هيك (قشاط/تنشن/ووتر بمب)؟', weight: 2 },
  ],
  brake: [
    { id: 'grinding', text: 'الصوت طحن معدني (زي حديد عم يتحك بحديد)، مش صرير خفيف بس؟', weight: 3 },
    { id: 'pedal_feel', text: 'الدواسة حاسسها مختلفة عن العادة (طرية، عم تنزل لتحت أكتر، أو محتاجة تضغط أكتر من مرة)؟', weight: 3 },
    { id: 'warning_light', text: 'في لمبة تحذير عالتابلو متعلقة بالبريك؟', weight: 2 },
    { id: 'pulling_or_smell', text: 'السيارة عم تسحب لجهة وحدة وقت الفرملة، أو في حرارة/ريحة غريبة من العجلة؟', weight: 2 },
    { id: 'persists_after_repair', text: 'الصوت استمر حتى بعد ما صار تبديل فحمات أو ديسك قبل هيك؟', weight: 2 },
  ],
  sway: [
    { id: 'stability', text: 'حاسس ثبات السيارة أقل أو ميلان أكتر بالمنعطفات، مش بس صوت خبط؟', weight: 4 },
    { id: 'detached_link', text: 'فحصت بصريًا ولقيت قطعة مفكوكة بالكامل أو مفقودة (مش بس تآكل بالجلدة)؟', weight: 3 },
    { id: 'steering_or_tires', text: 'في اهتزاز أو "لعب" بالدركسيون، أو تآكل غريب بالإطارات؟', weight: 3 },
  ],
};

const MAX_SCORE: Record<SeverityFormCategory, number> = Object.fromEntries(
  (Object.entries(SEVERITY_QUESTIONS) as [SeverityFormCategory, SeverityQuestion[]][]).map(
    ([category, questions]) => [category, questions.reduce((sum, q) => sum + q.weight, 0)]
  )
) as Record<SeverityFormCategory, number>;

export interface SeverityFormResult {
  percent: number;
  level: Severity;
}

export function scoreSeverity(answers: Record<string, boolean>, category: SeverityFormCategory): SeverityFormResult {
  const questions = SEVERITY_QUESTIONS[category];
  const earned = questions.reduce((sum, q) => sum + (answers[q.id] ? q.weight : 0), 0);
  const percent = Math.round((earned / MAX_SCORE[category]) * 100);

  let level: Severity = 'low';
  if (percent > 65) level = 'high';
  else if (percent > 30) level = 'medium';

  return { percent, level };
}

// The question text for every "yes" answer -- handed to the chat (as form_result.
// positive_findings) so the AI can build on what the user already confirmed instead of
// asking the same things again. See SeverityFormDialog's "Ask GarageAI" handoff action.
export function getPositiveFindings(answers: Record<string, boolean>, category: SeverityFormCategory): string[] {
  return SEVERITY_QUESTIONS[category].filter((q) => answers[q.id]).map((q) => q.text);
}

export const SEVERITY_ADVICE: Record<Severity, string> = {
  low: 'غالبًا مش عاجل، بس راقب العطل وإذا زاد أو تغيّر، زور ورشة.',
  medium: 'ينصح تفحص السيارة بورشة قريبًا -- العطل ممكن يتفاقم إذا اتهمل.',
  high: 'ينصح تفحص السيارة بأقرب وقت ممكن، وتتجنب القيادة الطويلة قبل الفحص إذا أمكن.',
};
