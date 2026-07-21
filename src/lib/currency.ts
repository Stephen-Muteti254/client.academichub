// src/lib/currency.ts
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    NGN: '₦',
    EUR: '€',
    GBP: '£',
  };

  return symbols[currency] || currency;
}

export function formatMoney(
  amount: number,
  currency: string,
  decimals = 2
): string {
  const symbol = getCurrencySymbol(currency);

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  return `${symbol}${formatted}`;
}
