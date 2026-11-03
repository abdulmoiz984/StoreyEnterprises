import { business } from "../constants/business";

export function formatMoney(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function todayET() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: business.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function etHour() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: business.timezone,
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  return Number(parts.find((p) => p.type === "hour")?.value ?? "0");
}

export function greeting() {
  const h = etHour();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function addDaysET(days) {
  const [y, m, d] = todayET().split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Build an ISO timestamp for a clock time in Eastern Time. */
export function etStamp(dayOffset, hour, minute) {
  const date = addDaysET(dayOffset);
  const [y, m, d] = date.split("-").map(Number);
  let utc = Date.UTC(y, m - 1, d, hour + 5, minute);
  for (let i = 0; i < 4; i++) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: business.timezone,
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(utc));
    const get = (type) => Number(parts.find((p) => p.type === type)?.value);
    const cur = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
    const want = Date.UTC(y, m - 1, d, hour, minute);
    const diffMin = (want - cur) / 60000;
    if (diffMin === 0) break;
    utc += diffMin * 60000;
  }
  return new Date(utc).toISOString();
}

export function parseETDate(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 17, 0, 0));
}

export function formatDateET(isoDate, withWeekday = false) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: business.timezone,
    weekday: withWeekday ? "short" : undefined,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parseETDate(isoDate));
}

export function formatTimeET(iso) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: business.timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDateTimeET(iso) {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: business.timezone,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
  return `${date}, ${formatTimeET(iso)} ET`;
}

export function formatPhone(raw) {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function digits(raw) {
  return raw.replace(/\D/g, "");
}

export function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  const capped = Math.min(4, score);
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  return { score: capped, label: pw.length === 0 ? "" : labels[capped] ?? "" };
}

export function weekdayIndex(isoDate) {
  return parseETDate(isoDate).getUTCDay();
}

export function isSunday(isoDate) {
  return weekdayIndex(isoDate) === 0;
}

export function isSaturday(isoDate) {
  return weekdayIndex(isoDate) === 6;
}

export function isTodayET(iso) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: business.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date(iso)) === todayET();
}

export function nowETLabel() {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: business.timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
  return `${time} ET`;
}
