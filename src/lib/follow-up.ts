export const FOLLOW_UP_DAYS = 14;

export function needsFollowUp(lastContacted: string | null | undefined): boolean {
  if (!lastContacted) return true;
  const last = new Date(lastContacted).getTime();
  const days = (Date.now() - last) / (1000 * 60 * 60 * 24);
  return days >= FOLLOW_UP_DAYS;
}

export function formatRelative(date: string | null | undefined): string {
  if (!date) return "Never";
  const d = new Date(date);
  const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
