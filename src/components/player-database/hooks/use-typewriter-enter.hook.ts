import { useEffect, useState } from 'react';

type TypewriterPhase = 'hidden' | 'typing' | 'shown';

export function useTypewriterReveal({
  text,
  phase,
  charDurationMs = 8,
  onDone,
}: {
  text: string;
  phase: TypewriterPhase;
  charDurationMs?: number;
  onDone?: () => void;
}) {
  const [charCount, setCharCount] = useState(phase === 'shown' ? text.length : 0);

  useEffect(() => {
    if (phase === 'hidden') {
      setCharCount(0);
      return;
    }

    if (phase === 'shown') {
      setCharCount(text.length);
      return;
    }

    setCharCount(0);
    const interval = setInterval(() => {
      setCharCount((prev) => {
        const next = prev + 1;
        if (next >= text.length) {
          clearInterval(interval);
          onDone?.();
          return text.length;
        }
        return next;
      });
    }, charDurationMs);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, text]);

  return text.slice(0, charCount);
}