export const eur = (n) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n ?? 0);

export function eurCompact(n) {
  const v = n ?? 0;
  if (v >= 1_000_000) return `€\u00a0${(v / 1_000_000).toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}\u00a0mln`;
  if (v >= 1_000) return `€\u00a0${(v / 1_000).toLocaleString("nl-NL", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}\u00a0k`;
  return eur(v);
}

export function eurAs(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("nl-NL", { maximumFractionDigits: 1 })} mln`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return `${n}`;
}

export const pct = (n) => (n != null && n !== "" ? `${parseFloat(n).toFixed(2)}%` : "—");

export const datumNL = (s) =>
  new Date(s).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });

export const kb = (n) =>
  n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;

export const isVerlopen = (s) => s && new Date(s) < new Date();
