import { Badge } from '@razorpay/blade/components';
import type { Confidence } from '../types';

const COLOR: Record<Confidence, 'positive' | 'notice' | 'negative'> = {
  high: 'positive',
  medium: 'notice',
  low: 'negative',
};

// Describes the AI's match confidence itself, not the live workflow status
// (which the screen's own copy/actions already communicate) — so this
// stays accurate before AND after Aman confirms a medium/low-confidence
// match, instead of still saying "needs your input" once it no longer does.
const LABEL: Record<Confidence, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
};

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return <Badge color={COLOR[confidence]}>{LABEL[confidence]}</Badge>;
}
