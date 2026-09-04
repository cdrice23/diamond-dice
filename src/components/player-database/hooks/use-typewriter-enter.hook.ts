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
  const [prevPhase, setPrevPhase] = useState(phase);
  const [prevText, setPrevText] = useState(text);
  const [charCount, setCharCount] = useState(phase === 'shown' ? text.length : 0);

  if (phase !== prevPhase || text !== prevText) {
    setPrevPhase(phase);
    setPrevText(text);

    if (phase === 'hidden') {
      setCharCount(0);
    } else if (phase === 'shown') {
      setCharCount(text.length);
    } else {
      setCharCount(0);
    }
  }

  useEffect(() => {
    if (phase !== 'typing') return;

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