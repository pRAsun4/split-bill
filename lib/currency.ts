/**
 * currency.ts
 * ───────────
 * All amounts in the app are stored in USD internally.
 * When the user picks a different currency, every displayed amount
 * is multiplied by the exchange rate on the fly.
 */

import { CurrencyCode, usePrefsStore } from "../store/usePrefsStore";

// ─── Static exchange rates (base: 1 USD) ─────────────────────────────────────

export const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  INR: 83.5,
  EUR: 0.92,
  CAD: 1.36,
};

// ─── Currency metadata ────────────────────────────────────────────────────────

export type CurrencyMeta = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  locale: string;
  decimalDigits: number;
};

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  USD: { code: "USD", symbol: "$",   name: "US Dollar",       flag: "🇺🇸", locale: "en-US", decimalDigits: 2 },
  INR: { code: "INR", symbol: "₹",   name: "Indian Rupee",    flag: "🇮🇳", locale: "en-IN", decimalDigits: 2 },
  EUR: { code: "EUR", symbol: "€",   name: "Euro",            flag: "🇪🇺", locale: "de-DE", decimalDigits: 2 },
  CAD: { code: "CAD", symbol: "CA$", name: "Canadian Dollar", flag: "🇨🇦", locale: "en-CA", decimalDigits: 2 },
};

// ─── Core conversion helpers ──────────────────────────────────────────────────

export function convertFromUSD(usdAmount: number, to: CurrencyCode): number {
  return usdAmount * EXCHANGE_RATES[to];
}

export function formatAmount(usdAmount: number, currency: CurrencyCode): string {
  const meta = CURRENCIES[currency];
  const converted = convertFromUSD(usdAmount, currency);
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency: meta.code,
      minimumFractionDigits: meta.decimalDigits,
      maximumFractionDigits: meta.decimalDigits,
    }).format(converted);
  } catch {
    return `${meta.symbol}${converted.toFixed(meta.decimalDigits)}`;
  }
}

export function formatAmountCompact(usdAmount: number, currency: CurrencyCode): string {
  const meta = CURRENCIES[currency];
  const converted = convertFromUSD(usdAmount, currency);
  const abs = Math.abs(converted);
  const sign = converted < 0 ? "-" : "";
  const parts = abs.toFixed(meta.decimalDigits).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${meta.symbol}${parts.join(".")}`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

type UseCurrencyReturn = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  meta: CurrencyMeta;
  format: (usdAmount: number) => string;
  formatCompact: (usdAmount: number) => string;
  convert: (usdAmount: number) => number;
  rate: number;
};

export function useCurrency(): UseCurrencyReturn {
  const code = usePrefsStore((s) => s.currency);
  const meta = CURRENCIES[code];
  const rate = EXCHANGE_RATES[code];

  return {
    code,
    symbol: meta.symbol,
    name: meta.name,
    flag: meta.flag,
    meta,
    format: (amount) => formatAmount(amount, code),
    formatCompact: (amount) => formatAmountCompact(amount, code),
    convert: (amount) => convertFromUSD(amount, code),
    rate,
  };
}