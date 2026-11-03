import { business } from "../constants/business";
import { isSaturday } from "./format";

const BASE = {
  "01": 45,
  "02": 55,
  "03": 40,
  "04": 35,
  "05": 85,
  "06": 120,
};

const WEIGHT = {
  "<5": 0,
  "5-20": 10,
  "20-50": 22,
  "50+": 40,
};

export function round2(n) {
  return Math.round(n * 100) / 100;
}

export function routeMiles(a, b) {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return 0;
  const dlat = (a.lat - b.lat) * 69;
  const mid = ((a.lat + b.lat) / 2) * (Math.PI / 180);
  const dlng = (a.lng - b.lng) * Math.cos(mid) * 69;
  return Math.max(1, Math.round(Math.sqrt(dlat * dlat + dlng * dlng)));
}

export function buildPrice(input) {
  const base = BASE[input.serviceId] ?? 45;
  const urgency = input.deliveryType === "stat" ? 65 : input.deliveryType === "same-day" ? 28 : 0;
  const afterHours = input.deliveryType === "after-hours" ? 48 : 0;
  const miles = Math.max(0, Math.round(input.miles));
  const distance = round2(miles * 1.85);
  const weight = WEIGHT[input.weightRange] ?? 0;
  const weekend = input.date && isSaturday(input.date) ? 15 : 0;
  const holiday = input.date && business.holidays.includes(input.date) ? 30 : 0;
  const priority = input.priority ? 10 : 0;
  const van = input.cargoVan ? 85 : 0;
  const discount = input.discount ?? 0;
  const subtotal = base + urgency + afterHours + distance + weight + weekend + holiday + priority + van - discount;
  const tax = round2(Math.max(0, subtotal) * 0.053);
  const total = round2(Math.max(0, subtotal) + tax);
  const lines = [
    { label: "Base rate", amount: base },
    { label: `Distance (${miles} mi × $1.85)`, amount: distance },
    { label: "Weight surcharge", amount: weight },
    { label: "Urgency surcharge", amount: urgency },
    { label: "After-hours surcharge", amount: afterHours },
    { label: "Weekend surcharge", amount: weekend },
    { label: "Holiday surcharge", amount: holiday },
    { label: "Priority add-on", amount: priority },
    ...(van ? [{ label: "Cargo van rental", amount: van }] : []),
    { label: "Discount", amount: -discount },
    { label: "Tax", amount: tax },
  ];
  return { lines, total, distanceMiles: miles };
}

export function milesFromOrigin(lat, lng) {
  return routeMiles({ lat, lng }, { lat: business.origin.lat, lng: business.origin.lng });
}

export function draftMiles(draft) {
  if (draft.drivingMiles != null && draft.drivingMiles > 0) return draft.drivingMiles;
  return routeMiles(draft.pickup, draft.dropoff);
}

export function draftPrice(draft) {
  return buildPrice({
    serviceId: draft.serviceId || "01",
    deliveryType: draft.deliveryType,
    miles: draftMiles(draft),
    weightRange: draft.details.weightRange,
    date: draft.schedule.date,
    priority: draft.priorityAddon,
    cargoVan: draft.cargoVan && draft.serviceId === "06",
  });
}

export function outOfArea(stop) {
  return stop.milesFromOrigin != null && stop.milesFromOrigin > business.serviceRadiusMiles;
}


export function submitIntent(draft) {
  const declared = Number(draft.details.declaredValue || 0);
  const outside = outOfArea(draft.pickup) || outOfArea(draft.dropoff);
  if (outside) return "review";
  if (draft.priceMode === "book") return "book";
  if (draft.priceMode === "quote") return "quote";
  if (draft.deliveryType === "stat" || draft.deliveryType === "after-hours") return "quote";
  if (draft.cargoVan || draft.details.boxSize === "Custom" || draft.details.weightRange === "50+") return "quote";
  if (declared > 500) return "quote";
  return "book";
}

export function intentLabel(intent) {
  if (intent === "review") return "Request Review";
  if (intent === "quote") return "Request Quote";
  return "Book Now";
}

export function weightRangeFor(lbs) {
  if (lbs < 5) return "<5";
  if (lbs <= 20) return "5-20";
  if (lbs <= 50) return "20-50";
  return "50+";
}

export const DELIVERY_TYPES = [
  { id: "routine", title: "Routine", body: "Scheduled, standard window.", fee: "Standard rate" },
  { id: "same-day", title: "Same-Day", body: "Requested before cutoff, subject to capacity.", fee: "+$28" },
  {
    id: "stat",
    title: "STAT",
    body: "Immediate priority, subject to confirmed availability.",
    fee: "+$65",
    stat: true,
  },
  {
    id: "after-hours",
    title: "After-Hours",
    body: "Outside business hours. Requires advance coordination and admin approval.",
    fee: "+$48",
  },
];
