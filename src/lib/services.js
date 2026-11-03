import { IMAGES } from '../assets/images';
const equipment = IMAGES.servicesEquipment;
const pharmacy = IMAGES.servicesPharmacy;
const scheduled = IMAGES.servicesScheduled;
const specimen = IMAGES.servicesSpecimen;
const supplies = IMAGES.servicesSupplies;
const urgent = IMAGES.servicesUrgent;


const review = (id, name, rating, date, text) => ({
  id,
  name,
  rating,
  date,
  text,
});

export const services = [
  {
    id: "01",
    displayName: "Scheduled & Same-Day",
    title: "Scheduled and Same-Day Delivery",
    description:
      "Arrange scheduled pickups or request same-day medical courier service across Central Virginia for healthcare shipments and business deliveries. We review the route, shipment requirements, and available capacity to agree on pickup and delivery windows.",
    image: scheduled,
    startingAt: 45,
    canSend: [
      "Healthcare shipments on a set window",
      "Same-day medical packages",
      "Supplies moving between facilities",
      "Small business deliveries for clinics",
    ],
    handlingNotes: [
      "Pickup and delivery windows are agreed after we review the route and capacity.",
      "Share packaging notes before the courier arrives.",
    ],
    reviews: [
      review("r1", "Priya Shah", 5, "Oct 12, 2026", "Windows were clear and the courier called before arriving at our clinic."),
      review("r2", "Daniel Ortega", 5, "Sep 28, 2026", "Same-day request was confirmed quickly. Packaging notes were followed."),
      review("r3", "Helen Brooks", 4, "Sep 9, 2026", "Reliable scheduled route for our weekly supply run."),
    ],
  },
  {
    id: "02",
    displayName: "Specimen & Lab Courier",
    title: "Medical Specimen and Laboratory Courier",
    description:
      "Our medical specimen courier service connects healthcare facilities with receiving laboratories across Central Virginia. Share packaging and handling instructions before pickup so we can coordinate applicable chain-of-custody documentation and receiving arrangements.",
    image: specimen,
    startingAt: 55,
    canSend: [
      "Laboratory specimens in approved packaging",
      "Pathology samples with handling notes",
      "Temperature-controlled coolers",
      "Chain-of-custody paperwork",
    ],
    handlingNotes: [
      "Share packaging and handling instructions before pickup.",
      "Chain-of-custody events are logged from handoff through receiving.",
    ],
    reviews: [
      review("r4", "Marcus Lee", 5, "Oct 18, 2026", "Cooler arrived sealed and the custody log matched our labels."),
      review("r5", "Alicia Nguyen", 5, "Oct 2, 2026", "Lab receiving knew the window. No confusion at the handoff."),
      review("r6", "Ruth Coleman", 4, "Sep 15, 2026", "Clear temperature notes and a prompt status update after pickup."),
    ],
  },
  {
    id: "03",
    displayName: "Pharmacy & Rx Delivery",
    title: "Pharmacy and Prescription Delivery",
    description:
      "We provide pharmacy courier services across Central Virginia for prescriptions moving between pharmacies, healthcare facilities, and designated recipients. Handling instructions and delivery arrangements are reviewed before collection.",
    image: pharmacy,
    startingAt: 40,
    canSend: [
      "Prescription totes",
      "Pharmacy-to-facility transfers",
      "Deliveries to a designated recipient",
      "Related pharmacy documents",
    ],
    handlingNotes: [
      "Handling instructions are reviewed before collection.",
      "Proof of delivery records the recipient name and time.",
    ],
    reviews: [
      review("r7", "Omar Farouk", 5, "Oct 20, 2026", "Our pharmacy tote was scanned at pickup and signed for at the clinic."),
      review("r8", "Grace Whitfield", 5, "Oct 6, 2026", "The delivery window matched what we requested."),
      review("r9", "Chris Dalton", 4, "Sep 22, 2026", "Professional handoff and a clear receipt afterward."),
    ],
  },
  {
    id: "04",
    displayName: "Supplies & Documents",
    title: "Medical Supply and Document Delivery",
    description:
      "We deliver medical supplies, confidential records, documents, and small packages across Central Virginia. Proof of delivery helps your team track completed shipments and maintain accurate records.",
    image: supplies,
    startingAt: 35,
    canSend: ["Medical supplies", "Confidential records", "Documents and small packages", "Sealed facility mailers"],
    handlingNotes: [
      "Mark confidential items so the courier can limit the handoff.",
      "Proof of delivery is stored with the shipment record.",
    ],
    reviews: [
      review("r10", "Nina Patel", 5, "Oct 14, 2026", "Records arrived sealed. The signature proof was easy to download."),
      review("r11", "Joel Harper", 4, "Sep 30, 2026", "Straightforward supply delivery between our two offices."),
      review("r12", "Erin Walsh", 5, "Sep 11, 2026", "On time, and the status updates were easy to follow."),
    ],
  },
  {
    id: "05",
    displayName: "Urgent & After-Hours",
    title: "Urgent and After-Hours Delivery",
    description:
      "For priority shipments in Central Virginia, request our STAT medical courier service, subject to confirmed availability and the required delivery window. After-hours delivery requires advance coordination. Closed Sunday.",
    image: urgent,
    startingAt: 85,
    canSend: [
      "STAT specimens",
      "Priority prescriptions",
      "Time-critical supplies",
      "After-hours handoffs arranged in advance",
    ],
    handlingNotes: [
      "STAT and after-hours requests are confirmed by our team before a courier is assigned.",
      "Closed Sunday. After-hours delivery needs advance coordination.",
    ],
    reviews: [
      review("r13", "Sandra Cho", 5, "Oct 21, 2026", "STAT request was reviewed and the deadline was confirmed the same hour."),
      review("r14", "Peter Lang", 4, "Oct 8, 2026", "After-hours pickup was arranged the day before,"),
      review("r15", "Imani Brooks", 5, "Sep 19, 2026", "Priority handling was clear from the quote through delivery."),
    ],
  },
  {
    id: "06",
    displayName: "Medical Equipment",
    title: "Medical Equipment Transport",
    description:
      "Medical equipment transport is available across Central Virginia, with acceptance based on dimensions, weight, handling requirements, and vehicle capacity. When needed, a cargo van rental can be arranged in advance, subject to rental availability. Share equipment specifications before scheduling.",
    image: equipment,
    startingAt: 120,
    canSend: [
      "Portable medical equipment",
      "Cases within vehicle capacity",
      "Devices with shared dimensions and weight",
      "Cargo van requests arranged in advance",
    ],
    handlingNotes: [
      "Share equipment specifications before scheduling.",
      "A cargo van can be requested in advance and depends on rental availability.",
    ],
    reviews: [
      review("r16", "Victor Ames", 5, "Oct 16, 2026", "We sent dimensions ahead of time and the van was ready at pickup."),
      review("r17", "Leah Morgan", 4, "Sep 25, 2026", "Careful loading. The courier confirmed the case size on site."),
      review("r18", "Andre Wilson", 5, "Sep 4, 2026", "Equipment arrived upright and the handoff was documented."),
    ],
  },
];

export function serviceById(id) {
  return services.find((s) => s.id === id) ?? services[0];
}

export function averageRating(service) {
  const total = service.reviews.reduce((sum, item) => sum + item.rating, 0);
  return Math.round((total / service.reviews.length) * 10) / 10;
}
