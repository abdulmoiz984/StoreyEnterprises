import { business } from "../constants/business";
import { IMAGES } from '../assets/images';
const cooler = IMAGES.galleryCooler;
const galleryEquipment = IMAGES.galleryEquipment;
const handoff = IMAGES.galleryHandoff;
const galleryPharmacy = IMAGES.galleryPharmacy;
const galleryProof = IMAGES.galleryProof;
const handled = IMAGES.onboardingHandled;
const proof = IMAGES.onboardingProof;
const track = IMAGES.onboardingTrack;
const driver = IMAGES.peopleDriver;


export const images = {
  handled,
  track,
  proof,
  driver,
  handoff,
  cooler,
  galleryEquipment,
  galleryPharmacy,
  galleryProof,
};

export const onboardingSlides = [
  {
    image: handled,
    title: "Healthcare Deliveries, Handled",
    body: "Schedule pickups for specimens, prescriptions, supplies, and equipment across Central Virginia.",
  },
  {
    image: track,
    title: "Track Every Shipment",
    body: "Follow your courier in real time and receive instant status updates from pickup to delivery.",
  },
  {
    image: proof,
    title: "Proof You Can Rely On",
    body: "Get delivery confirmation with recipient name, timestamp, and signature or photo.",
  },
];

export const galleryItems = [
  { id: "g1", src: handoff, title: "Lab handoff", kind: "photo", caption: "Specimen cooler received at the laboratory window." },
  { id: "g2", src: cooler, title: "Secured cooler", kind: "photo", caption: "Temperature-controlled cooler secured in the courier van." },
  { id: "g3", src: galleryPharmacy, title: "Pharmacy tote", kind: "photo", caption: "Prescription tote prepared for a facility delivery." },
  { id: "g4", src: galleryEquipment, title: "Equipment load", kind: "video", caption: "Medical equipment loaded with straps and padding." },
  { id: "g5", src: galleryProof, title: "Delivery proof", kind: "photo", caption: "Recipient signature captured with the sealed package." },
  { id: "g6", src: handled, title: "Clinic arrival", kind: "video", caption: "Courier arrival at a Central Virginia clinic." },
];

export const facilityTypes = ["Hospital", "Clinic", "Laboratory", "Pharmacy", "Medical supplier", "Other"];

export const shipmentTypes = [
  "Laboratory Specimen",
  "Pharmaceutical/Prescription",
  "Medical Supplies",
  "Documents/Records",
  "Medical Equipment",
  "Other Approved Cargo",
];

export const boxSizes = [
  { id: "Small", hint: "12 × 9 × 6 in" },
  { id: "Medium", hint: "18 × 14 × 10 in" },
  { id: "Large", hint: "24 × 18 × 16 in" },
  { id: "Extra Large", hint: "30 × 20 × 20 in" },
  { id: "Custom", hint: "Enter L × W × H" },
];

export const weightRanges = ["<5", "5-20", "20-50", "50+"];

export const handlingOptions = ["Fragile", "Keep upright", "Biohazard-labeled", "Confidential"];

export const temperatureOptions = ["Ambient", "Refrigerated 2-8 C", "Frozen", "Other"];

export const faqs = [
  {
    q: "Where do you deliver?",
    a: `${business.serviceAreaNote} Locations farther out can still be submitted for review.`,
  },
  {
    q: "What are your hours?",
    a: `${business.hoursHelper} Times are shown in Eastern Time (ET).`,
  },
  {
    q: "How does a STAT delivery work?",
    a: "STAT is immediate priority and is subject to confirmed availability. Share the delivery deadline and we will confirm whether a courier can take it.",
  },
  {
    q: "Can I request after-hours delivery?",
    a: "Yes, with advance coordination and admin approval. Sunday is closed.",
  },
  {
    q: "When is payment due?",
    a: `${business.paymentNote}. This preview uses Square test mode and does not charge a real card.`,
  },
  {
    q: "What is included in proof of delivery?",
    a: "Recipient name, timestamp, and a signature or photo, plus the chain-of-custody log when one applies.",
  },
  {
    q: "Will my profile address be used automatically?",
    a: "No. Shipment addresses stay separate. You can choose “Use my profile address” and confirm it on that shipment.",
  },
  {
    q: "How do I reschedule or cancel?",
    a: "Open the shipment and choose reschedule or cancel. Refunds follow the cancellation policy and are confirmed by our team.",
  },
];

export const termsDoc = {
  title: "Terms & Conditions",
  version: business.policyVersion,
  updated: business.policyUpdated,
  sections: [
    {
      heading: "Replace with client-approved text",
      body: "This viewer is a placeholder. Replace with the client-approved Terms & Conditions before release. The version number and last-updated date below are ready to keep.",
    },
    {
      heading: "Service",
      body: "Storey Enterprises LLC provides medical courier service for healthcare shipments in Chesterfield, Richmond, and Central Virginia. A request is not confirmed until we accept the delivery window.",
    },
    {
      heading: "Quotes and payment",
      body: "Prices shown in the app are estimates until Storey Enterprises confirms the quote. Payment is due upon quote acceptance. Cancellation and refund terms are confirmed with the quote.",
    },
    {
      heading: "Your shipments",
      body: "You are responsible for lawful contents, accurate addresses, and packaging instructions shared before pickup. Chain-of-custody and proof of delivery are part of the shipment record.",
    },
  ],
};

export const privacyDoc = {
  title: "Privacy Policy",
  version: business.policyVersion,
  updated: business.policyUpdated,
  sections: [
    {
      heading: "Replace with client-approved text",
      body: "This viewer is a placeholder. Replace with the client-approved Privacy Policy before release.",
    },
    {
      heading: "What we collect",
      body: "Account details, facility and billing information, shipment addresses, delivery photos you upload, and proof-of-delivery records. Acceptance date, time, and policy version are stored when you create an account.",
    },
    {
      heading: "How records are kept",
      body: "Business, payment, audit, and delivery records may be retained even if you delete the app account.",
    },
    {
      heading: "Messages",
      body: "In-app messages with dispatch are kept with the related shipment so your team can refer back to instructions and updates.",
    },
  ],
};
