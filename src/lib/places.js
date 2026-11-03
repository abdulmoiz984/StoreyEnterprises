
export const places = [
  {
    id: "lucy",
    label: "9501 Lucy Corr Circle, Chesterfield, VA 23832",
    facility: "Lucy Corr Village",
    milesFromOrigin: 3,
    lat: 37.392,
    lng: -77.588,
  },
  {
    id: "vcu",
    label: "1200 E Broad Street, Richmond, VA 23219",
    facility: "VCU Medical Center",
    milesFromOrigin: 14,
    lat: 37.54,
    lng: -77.43,
  },
  {
    id: "stmarys",
    label: "5801 Bremo Road, Richmond, VA 23226",
    facility: "Bon Secours St. Mary's Hospital",
    milesFromOrigin: 18,
    lat: 37.583,
    lng: -77.508,
  },
  {
    id: "chippenham",
    label: "7101 Jahnke Road, Richmond, VA 23225",
    facility: "Chippenham Hospital Lab",
    milesFromOrigin: 11,
    lat: 37.505,
    lng: -77.525,
  },
  {
    id: "pharmacy",
    label: "4420 W Broad Street, Richmond, VA 23230",
    facility: "West Broad Pharmacy",
    milesFromOrigin: 15,
    lat: 37.588,
    lng: -77.488,
  },
  {
    id: "randolph",
    label: "411 W Randolph Road, Hopewell, VA 23860",
    facility: "John Randolph Medical Center",
    milesFromOrigin: 22,
    lat: 37.305,
    lng: -77.287,
  },
  {
    id: "marywash",
    label: "1001 Sam Perry Boulevard, Fredericksburg, VA 22401",
    facility: "Mary Washington Hospital",
    milesFromOrigin: 58,
    lat: 38.301,
    lng: -77.487,
  },
  {
    id: "uva",
    label: "1215 Lee Street, Charlottesville, VA 22908",
    facility: "UVA Health",
    milesFromOrigin: 72,
    lat: 38.031,
    lng: -78.491,
  },
  {
    id: "sibley",
    label: "5255 Loughboro Road NW, Washington, DC 20016",
    facility: "Sibley Memorial Hospital",
    milesFromOrigin: 108,
    lat: 38.936,
    lng: -77.11,
  },
  {
    id: "hopkins",
    label: "600 N Wolfe Street, Baltimore, MD 21287",
    facility: "Johns Hopkins Hospital",
    milesFromOrigin: 168,
    lat: 39.297,
    lng: -76.592,
  },
  {
    id: "penn",
    label: "3400 Spruce Street, Philadelphia, PA 19104",
    facility: "Hospital of the University of Pennsylvania",
    milesFromOrigin: 248,
    lat: 39.95,
    lng: -75.193,
  },
];

export function searchPlaces(query) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return places
    .filter((p) => p.label.toLowerCase().includes(q) || p.facility.toLowerCase().includes(q))
    .slice(0, 5);
}

export function placeById(id) {
  return places.find((p) => p.id === id);
}

export function placeFromAddress(address) {
  const q = address.trim().toLowerCase();
  return places.find((p) => p.label.toLowerCase() === q);
}
