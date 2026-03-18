/** Formats a date to "15 mar 2026" using UTC to avoid off-by-one day issues */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Converts an input[type=date] string ("2026-03-19") to a UTC ISO string */
export function toUTCDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toISOString();
}

/** Returns "overdue", "soon" (< 2 days), or "ok" */
export function getDueDateStatus(dueDate) {
  const now = Date.now();
  const due = new Date(dueDate).getTime();
  const diff = due - now;
  if (diff < 0) return 'overdue';
  if (diff < 2 * 24 * 60 * 60 * 1000) return 'soon';
  return 'ok';
}

/** Returns the Tailwind text color class for a given status */
export function getDueDateColor(status) {
  if (status === 'overdue') return 'text-red-500';
  if (status === 'soon') return 'text-yellow-500';
  return 'text-gray-400';
}
