export function parseAmountToCents(input: string): number | null {
  const normalized = input.trim().replace(',', '.');
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

export function formatCents(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
}

export function sanitizeAmountInput(input: string): string {
  const cleaned = input.replace(/[^0-9.,]/g, '').replace(/\./g, ',');
  const [intPart, ...rest] = cleaned.split(',');
  if (rest.length === 0) return intPart;
  return `${intPart},${rest.join('').slice(0, 2)}`;
}
