/** تسمية العملة للعرض (الشيكل = ILS وفق ISO 4217) */
export function siteCurrencyLabel(code: string | null | undefined): string {
  const c = (code || 'ILS').toUpperCase();
  if (c === 'ILS' || c === 'NIS') return 'شيكل';
  return c;
}
