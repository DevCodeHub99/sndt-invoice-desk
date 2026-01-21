// Invoice Retention Policy
// - Current month: Full access
// - Last month: Archive (basic details only, bulk download available)
// - 3+ months old: Auto-delete permanently

export function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function getLastMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  return { start, end };
}

export function getThreeMonthsAgoDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 3, 1);
}

export function isCurrentMonth(date: Date): boolean {
  const { start, end } = getCurrentMonthRange();
  return date >= start && date <= end;
}

export function isLastMonth(date: Date): boolean {
  const { start, end } = getLastMonthRange();
  return date >= start && date <= end;
}

export function isOlderThanThreeMonths(date: Date): boolean {
  const threeMonthsAgo = getThreeMonthsAgoDate();
  return date < threeMonthsAgo;
}

export function getInvoiceStatus(createdAt: Date): 'current' | 'archived' | 'expired' {
  if (isCurrentMonth(createdAt)) return 'current';
  if (isLastMonth(createdAt)) return 'archived';
  return 'expired';
}

export function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
