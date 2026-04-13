import { format, formatDistanceToNow } from "date-fns";

export function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return format(new Date(d), "MMM d, yyyy");
}

export function fmtDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return format(new Date(d), "MMM d, yyyy HH:mm");
}

export function fmtTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return format(new Date(d), "HH:mm");
}

export function fmtRelative(d: Date | string | null | undefined) {
  if (!d) return "—";
  return formatDistanceToNow(new Date(d), { addSuffix: true });
}

export function fmtMoney(n: number | null | undefined, currency = "USD") {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

export function calcAge(dob: Date | string) {
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export function genBarcode() {
  const ts = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LB-${ts}-${r}`;
}

export function genOrderNumber() {
  const y = new Date().getFullYear();
  const r = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `ORD-${y}-${r}`;
}

export function genReportNumber() {
  const y = new Date().getFullYear();
  const r = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `RPT-${y}-${r}`;
}

export function genMRN() {
  const r = Math.floor(Math.random() * 1000000).toString().padStart(7, "0");
  return `MRN${r}`;
}
