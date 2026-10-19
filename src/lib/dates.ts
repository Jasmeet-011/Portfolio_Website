const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-08" to "Aug 2026". */
export function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const name = MONTHS[Number(month) - 1];
  return name ? `${name} ${year}` : yearMonth;
}

/** "Aug 2026 to Present". The site writes ranges with "to", never a dash. */
export const formatRange = (start: string, end: string | null): string =>
  `${formatMonth(start)} to ${end ? formatMonth(end) : "Present"}`;
