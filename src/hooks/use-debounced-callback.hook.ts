import { useCallback, useRef } from 'react';

export function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(callback: T, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  return useCallback((...args: Parameters<T>) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
}