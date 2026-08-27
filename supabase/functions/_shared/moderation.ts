import { profanities } from 'profanities';

const LEET_MAP: Record<string, string> = {
  '@': 'a',
  '4': 'a',
  '8': 'b',
  '3': 'e',
  '6': 'g',
  '1': 'i',
  '!': 'i',
  '|': 'i',
  '0': 'o',
  '$': 's',
  '5': 's',
  '7': 't',
  '+': 't',
};

function normalizeLeet(value: string): string {
  return value
    .split('')
    .map((char) => LEET_MAP[char] ?? char)
    .join('');
}

export function containsProfanity(value: string): boolean {
  const blockedSet = new Set(profanities.map((word) => word.toLowerCase()));

  const words = normalizeLeet(value.toLowerCase())
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((word) => word.replace(/^[0-9]+|[0-9]+$/g, ''))
    .filter(Boolean);

  return words.some((word) => blockedSet.has(word));
}