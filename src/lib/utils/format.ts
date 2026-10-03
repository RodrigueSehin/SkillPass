const monthYear = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric", timeZone: "UTC" });

/** "2024-03-15" → "mars 2024". Dates are calendar days, so formatting is pinned to UTC. */
export function formatMonth(day: string | null | undefined) {
  return day ? monthYear.format(new Date(`${day}T00:00:00Z`)) : "";
}

export function formatPeriod(start: string | null, end: string | null) {
  if (!start && !end) return "";
  if (!start) return formatMonth(end);
  return `${formatMonth(start)} – ${end ? formatMonth(end) : "En cours"}`;
}
