export type NumberFormatPrefs = {
  locale: string;
  currency?: string;
};

export function formatNumber(value: any, prefs: NumberFormatPrefs = { locale: 'en-US' }): string {
  const n = typeof value === 'number' ? value : (value == null || value === '' ? NaN : Number(value));
  if (!isFinite(n)) return String(value ?? '');
  return new Intl.NumberFormat(prefs.locale).format(n);
}

export function formatCurrency(value: any, prefs: NumberFormatPrefs = { locale: 'en-US', currency: 'USD' }): string {
  const n = typeof value === 'number' ? value : (value == null || value === '' ? NaN : Number(value));
  if (!isFinite(n)) return String(value ?? '');
  return new Intl.NumberFormat(prefs.locale, { style: 'currency', currency: prefs.currency || 'USD', maximumFractionDigits: 2 }).format(n);
}

export function looksNumericHeader(name: string): boolean {
  return /amount|revenue|total|sum|count|price|spend|quantity|avg|mean|median|min|max|value/i.test(name);
}

