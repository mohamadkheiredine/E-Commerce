import { CURRENCY } from '@ecom/contracts';

/**
 * Money arrives from the API as an integer count of minor units and stays that way
 * until the moment it is displayed. This is the only place it becomes a string.
 *
 * `Intl.NumberFormat` handles the currency symbol, grouping and decimal places for
 * the locale, so there is no hand-rolled `toFixed(2)` that breaks the first time a
 * price crosses a thousand.
 */
export function formatMoney(
  minorUnits: number,
  options: { currency?: string; locale?: string } = {},
): string {
  const { currency = CURRENCY, locale = 'en-AE' } = options;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minorUnits / 100);
}
