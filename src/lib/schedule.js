import { business } from "../constants/business";
import { etHour, isSaturday, isSunday, todayET, weekdayIndex } from "./format";

export const WEEKDAY_SLOTS = [
  "7:00–9:00 AM",
  "9:00–11:00 AM",
  "11:00 AM–1:00 PM",
  "1:00–3:00 PM",
  "3:00–5:00 PM",
  "5:00–7:00 PM",
];

export const SATURDAY_SLOTS = WEEKDAY_SLOTS.slice(0, 5);

const SLOT_END = {
  "7:00–9:00 AM": 9,
  "9:00–11:00 AM": 11,
  "11:00 AM–1:00 PM": 13,
  "1:00–3:00 PM": 15,
  "3:00–5:00 PM": 17,
  "5:00–7:00 PM": 19,
};

export function slotsFor(date) {
  if (!date || isSunday(date)) return [];
  return isSaturday(date) ? SATURDAY_SLOTS : WEEKDAY_SLOTS;
}

export function isPastDate(date) {
  return date < todayET();
}

export function isHoliday(date) {
  return business.holidays.includes(date);
}

export function slotState(date, slot) {
  if (!date || isSunday(date)) return "closed";
  if (isPastDate(date)) return "past";
  if (date === todayET() && etHour() >= (SLOT_END[slot] ?? 24)) return "past";
  const n = [...`${date}|${slot}`].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  if (n % 6 === 0) return "booked";
  return "open";
}

/** A window that still looks open, then fails when the request is submitted. */
export function slotLostOnSubmit(date, slot) {
  if (!date || !slot) return false;
  if (isSunday(date) || isSaturday(date)) return false;
  return slot === "5:00–7:00 PM" && slotState(date, slot) === "open";
}

export function alternativeSlots(date, current) {
  return slotsFor(date).filter((slot) => slot !== current && slotState(date, slot) === "open");
}

export function monthMatrix(year, monthIndex) {
  const count = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const first = weekdayIndex(
    `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`,
  );
  const cells = Array.from({ length: first }, () => null);
  for (let day = 1; day <= count; day++) {
    cells.push(`${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export const DEADLINE_TIMES = [
  "6:00 AM",
  "7:00 AM",
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
  "10:00 PM",
];
