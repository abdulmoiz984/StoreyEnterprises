/**
 * Single source of truth for Storey Enterprises LLC.
 * Contact fields are placeholders — replace with the approved company details.
 */
export const business = {
  name: "Storey Enterprises LLC",
  shortName: "Storey Enterprises",
  tagline: "Medical Courier You Can Trust",
  email: "dispatch@storeyenterprises.net",
  phoneDisplay: "(804) 555-0198",
  phoneTel: "+18045550198",
  address: {
    line1: "1234 Iron Bridge Road",
    city: "Chesterfield",
    state: "VA",
    zip: "23832",
  },
  hoursChip: "Mon-Fri 7 AM-7 PM | Sat 7 AM-5 PM | Sun Closed (ET)",
  hoursHelper: "Mon-Fri 7:00 AM–7:00 PM, Sat 7:00 AM–5:00 PM, Sun closed.",
  timezone: "America/New_York",
  timezoneLabel: "Eastern Time (ET)",
  serviceRadiusMiles: 200,
  serviceAreaNote: "Chesterfield/Richmond and Central Virginia, up to 200 miles from Chesterfield.",
  origin: { label: "Chesterfield, VA", lat: 37.377, lng: -77.504 },
  policyVersion: "2026.10",
  policyUpdated: "October 1, 2026",
  holidays: ["2026-11-26", "2026-12-25", "2027-01-01", "2026-11-11"],
  holidayNames: {
    "2026-11-11": "Veterans Day",
    "2026-11-26": "Thanksgiving",
    "2026-12-25": "Christmas",
    "2027-01-01": "New Year's Day",
  },
  paymentNote: "Payment due upon quote acceptance",
  priceCaption: "Estimated price: final quote confirmed by Storey Enterprises",
  licensedNote: "Licensed and insured medical courier. Placeholder — replace with the approved insurance statement.",
  contactPlaceholder: "Placeholder — replace with the approved Storey Enterprises LLC details.",
};

export function fullAddress() {
  const a = business.address;
  return `${a.line1}, ${a.city}, ${a.state} ${a.zip}`;
}
