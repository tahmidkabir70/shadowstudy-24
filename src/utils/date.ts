// Local-time date helpers. Do NOT use toISOString() for calendar dates,
// because it returns UTC which is wrong for Bangladesh (UTC+6) or local time zones.

export function localDateStr(d?: Date): string {
  const date = d || new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

export function daysBetween(a: string, b: string): number {
  if (!a || !b) return 0;
  const aParts = a.split('-').map(Number);
  const bParts = b.split('-').map(Number);
  const dateA = new Date(aParts[0], aParts[1] - 1, aParts[2]);
  const dateB = new Date(bParts[0], bParts[1] - 1, bParts[2]);
  return Math.round((dateB.getTime() - dateA.getTime()) / 86400000);
}

export function addDays(dateStr: string, days: number): string {
  const parts = dateStr.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  date.setDate(date.getDate() + days);
  return localDateStr(date);
}
