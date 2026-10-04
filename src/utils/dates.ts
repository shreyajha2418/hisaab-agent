// The demo's data is pinned to a fixed "today" (4 Oct 2026, matching the
// PRD's own story) rather than the real wall-clock date — so "today's
// totals" and "45 days overdue" stay correct no matter when this is
// actually viewed.
export const TODAY = '2026-10-04';

function toDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00+05:30`);
}

// Always display in IST regardless of the viewer's own timezone — an
// India-only app, and without this, toLocaleDateString/toLocaleTimeString
// fall back to the browser's local zone (UTC in headless Chrome), which
// rolls midnight-IST timestamps back a calendar day.
const IST = 'Asia/Kolkata';

export function formatShortDate(isoDate: string): string {
  return toDate(isoDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: IST });
}

export function daysSince(isoDate: string): number {
  const diff = toDate(TODAY).getTime() - toDate(isoDate).getTime();
  return Math.round(diff / 86_400_000);
}

export function formatTime(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: IST });
}
