const pad = (n: number) => String(n).padStart(2, '0');

/** ISO instant -> `YYYY-MM-DDTHH:MM` in the viewer's local time (what DateTimeInput edits). */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Local `YYYY-MM-DDTHH:MM` -> ISO instant. Returns '' for empty/invalid input. */
export function fromLocalInput(value: string | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString();
}
