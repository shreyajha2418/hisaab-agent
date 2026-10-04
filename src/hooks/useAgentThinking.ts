import { useEffect, useState } from 'react';

/**
 * Simulates the agent "working" — every AI output here is pre-computed
 * (see src/data/ai_outputs.json), so this is purely a UI delay that makes
 * revealing it feel live, per the prototype's hard constraint.
 */
export function useAgentThinking(key: string, delayMs = 1300): boolean {
  const [isThinking, setIsThinking] = useState(true);

  useEffect(() => {
    setIsThinking(true);
    const timer = setTimeout(() => setIsThinking(false), delayMs);
    return () => clearTimeout(timer);
    // `key` intentionally re-triggers the delay when navigating between events.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return isThinking;
}
