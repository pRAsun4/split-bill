/**
 * useAppContext.ts
 * ────────────────
 * One hook that returns theme colors + currency formatter + i18n strings.
 * Import this instead of calling useThemeColors, useCurrency, useI18n separately.
 *
 * Usage:
 *   const { tc, fmt, t } = useAppContext();
 *   <View style={{ backgroundColor: tc.bg }}>
 *   <Text>{fmt(expense.amount)}</Text>
 *   <Text>{t.home.pendingBills}</Text>
 */

import { useThemeColors } from "../store/usePrefsStore";
import { useCurrency } from "./currency";
import { useI18n } from "./i18n";

export function useAppContext() {
  const tc  = useThemeColors();  // theme colors object
  const cur = useCurrency();     // currency helpers
  const t   = useI18n();         // translated strings

  return {
    tc,                          // tc.bg, tc.card, tc.textPrimary …
    fmt: cur.formatCompact,      // fmt(100) → "$100.00" / "₹8,350.00"
    fmtFull: cur.format,         // fmtFull(100) → full locale string
    symbol: cur.symbol,          // "$", "₹", "€", "CA$"
    currency: cur.code,          // "USD", "INR", "EUR", "CAD"
    rate: cur.rate,              // exchange rate vs USD
    t,                           // t.home.pendingBills, t.common.youOwe …
    cur,                         // full currency object if needed
  };
}