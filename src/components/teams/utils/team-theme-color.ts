export function areColorsExactlySame(primaryColor: string | null, secondaryColor: string | null): boolean {
  if (primaryColor === null || secondaryColor === null) return false;
  return primaryColor.toLowerCase() === secondaryColor.toLowerCase();
}