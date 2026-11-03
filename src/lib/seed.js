import { business } from "../constants/business";
import { images } from "./content";
import { placeById } from "./places";
import { etStamp } from "./format";
import { buildPrice, routeMiles } from "./pricing";

function stop(placeId, contact, phone, access = "", notes = "") {
  const place = placeById(placeId);
  if (!place) throw new Error(placeId);
  return {
    address: place.label,
    facility: place.facility,
    contact,
    phone,
    access,
    notes,
    milesFromOrigin: place.milesFromOrigin,
    lat: place.lat,
    lng: place.lng,
  };
}

const FLOW = [
  ["request_received", "Request received"],
  ["quote_sent", "Quote sent"],
  ["quote_accepted", "Quote accepted"],
  ["booking_confirmed", "Booking confirmed"],
  ["driver_assigned", "Driver assigned"],
  ["en_route_pickup", "En route to pickup"],
  ["picked_up", "Picked up"],
  ["in_transit", "In transit"],
  ["delivered", "Delivered"],
];

function flowTimeline(current, stamps, note) {
  const order = FLOW.map((item) => item[0]);
  let idx = order.indexOf(current);
  if (current === "exception") idx = order.indexOf("in_transit");
  return FLOW.map(([key, label], index) => {
    let state = "upcoming";
    if (idx >= 0 && index < idx) state = "done";
    else if (index === idx) state = current === "exception" ? "alert" : "current";
    return {
      key,
      label,
      state,
      at: stamps[key],
      note: index === idx ? note : undefined,
    };
  });
}

const driver = {
  name: "Marcus Ellison",
  phone: "(804) 555-0144",
  vehicle: "2024 Ford Transit 250, white",
  plate: "SE-4412",
  photo: images.driver,
};

function priced(   pickup,   dropoff,   rest, ) {
  return buildPrice({ ...rest, miles: routeMiles(pickup, dropoff) });
}

export function buildSeed() {
  const pickup184 = stop("vcu", "Jordan Hale", "(804) 555-0172", "Lab dock, bay 2", "Cooler is labeled and sealed.");
  const drop184 = stop("chippenham", "Alicia Nguyen", "(804) 555-0160", "Lab receiving window", "Call on arrival.");
  const price184 = priced(pickup184, drop184, {
    serviceId: "02",
    deliveryType: "same-day",
    weightRange: "5-20",
    date: etStamp(0, 12, 0).slice(0, 10),
    priority: false,
    cargoVan: false,
  });

  const pickup186 = stop("pharmacy", "Chris Dalton", "(804) 555-0133", "Pharmacy counter", "Tote SE-RX-19.");
  const drop186 = stop("stmarys", "Nurse desk", "(804) 555-0118", "Main lobby, ask for outpatient pharmacy", "");
  const price186 = priced(pickup186, drop186, {
    serviceId: "03",
    deliveryType: "routine",
    weightRange: "<5",
    date: etStamp(2, 12, 0).slice(0, 10),
    priority: true,
    cargoVan: false,
  });

  const pickup188 = stop("lucy", "Helen Brooks", "(804) 555-0104", "Front desk", "Two document mailers.");
  const drop188 = stop("randolph", "Medical records", "(804) 555-0190", "Records office, suite 110", "Confidential.");
  const price188 = priced(pickup188, drop188, {
    serviceId: "04",
    deliveryType: "routine",
    weightRange: "<5",
    date: etStamp(3, 12, 0).slice(0, 10),
    priority: false,
    cargoVan: false,
  });

  const pickup190 = stop("lucy", "Victor Ames", "(804) 555-0122", "Loading canopy", "Monitor case, keep upright.");
  const drop190 = stop("uva", "Clinical engineering", "(434) 555-0148", "Dock C", "Cargo van requested.");
  const price190 = priced(pickup190, drop190, {
    serviceId: "06",
    deliveryType: "routine",
    weightRange: "50+",
    date: etStamp(4, 12, 0).slice(0, 10),
    priority: false,
    cargoVan: true,
  });

  const pickup181 = stop("stmarys", "Sandra Cho", "(804) 555-0188", "ED courier desk", "");
  const drop181 = stop("vcu", "Core lab", "(804) 555-0177", "Specimen receiving", "");
  const price181 = priced(pickup181, drop181, {
    serviceId: "05",
    deliveryType: "stat",
    weightRange: "<5",
    date: etStamp(0, 12, 0).slice(0, 10),
    priority: true,
    cargoVan: false,
  });

  const pickup172 = stop("pharmacy", "Omar Farouk", "(804) 555-0133", "Will call shelf", "");
  const drop172 = stop("lucy", "Front desk", "(804) 555-0104", "Administration", "");
  const price172 = priced(pickup172, drop172, {
    serviceId: "03",
    deliveryType: "routine",
    weightRange: "<5",
    date: etStamp(-3, 12, 0).slice(0, 10),
    priority: false,
    cargoVan: false,
  });

  const pickup165 = stop("chippenham", "Lab send-outs", "(804) 555-0166", "Send-out bench", "");
  const drop165 = stop("marywash", "Reference lab", "(540) 555-0112", "Receiving", "");
  const price165 = priced(pickup165, drop165, {
    serviceId: "02",
    deliveryType: "stat",
    weightRange: "5-20",
    date: etStamp(-6, 12, 0).slice(0, 10),
    priority: false,
    cargoVan: false,
  });

  const date0 = etStamp(0, 12, 0).slice(0, 10);
  const date2 = etStamp(2, 12, 0).slice(0, 10);
  const date3 = etStamp(3, 12, 0).slice(0, 10);
  const date4 = etStamp(4, 12, 0).slice(0, 10);
  const dateM3 = etStamp(-3, 12, 0).slice(0, 10);
  const dateM6 = etStamp(-6, 12, 0).slice(0, 10);

  const paid = (amountRef, when) => ({
    status: "paid",
    method: "Visa •••• 4242",
    reference: amountRef,
    paidAt: when,
  });

  const shipments = [
    {
      id: "SE-2026-000184",
      serviceId: "02",
      deliveryType: "same-day",
      priorityAddon: false,
      cargoVan: false,
      pickup: pickup184,
      dropoff: drop184,
      details: {
        type: "Laboratory Specimen",
        quantity: 1,
        boxSize: "Small",
        dimensions: "12 × 9 × 6 in",
        weightLbs: 8,
        weightRange: "5-20",
        description: "Sealed specimen cooler for same-day lab receiving.",
        handling: ["Keep upright", "Biohazard-labeled"],
        temperature: "Refrigerated 2-8 C",
        photos: [images.cooler],
      },
      schedule: { date: date0, window: "9:00–11:00 AM", deadline: "11:00 AM" },
      price: price184,
      status: "in_transit",
      payment: paid("sq_test_184K", etStamp(-1, 17, 8)),
      driver,
      eta: "22 min",
      timeline: flowTimeline("in_transit", {
        request_received: etStamp(-1, 16, 10),
        quote_sent: etStamp(-1, 16, 40),
        quote_accepted: etStamp(-1, 17, 2),
        booking_confirmed: etStamp(-1, 17, 6),
        driver_assigned: etStamp(0, 6, 40),
        en_route_pickup: etStamp(0, 7, 5),
        picked_up: etStamp(0, 7, 28),
        in_transit: etStamp(0, 7, 40),
      }),
      custody: [
        { id: "c1", label: "Prepared for pickup", who: "Jordan Hale, VCU Medical Center", at: etStamp(0, 6, 50) },
        { id: "c2", label: "Picked up by courier", who: "Marcus Ellison", at: etStamp(0, 7, 28) },
        { id: "c3", label: "In transit", who: "Marcus Ellison", at: etStamp(0, 7, 40) },
      ],
      documents: [
        { id: "d184a", name: "Chain-of-custody log", kind: "pdf" },
        { id: "d184b", name: "Receipt", kind: "pdf" },
      ],
      createdAt: etStamp(-1, 16, 10),
    },
    {
      id: "SE-2026-000186",
      serviceId: "03",
      deliveryType: "routine",
      priorityAddon: true,
      cargoVan: false,
      pickup: pickup186,
      dropoff: drop186,
      details: {
        type: "Pharmaceutical/Prescription",
        quantity: 1,
        boxSize: "Small",
        dimensions: "12 × 9 × 6 in",
        weightLbs: 3,
        weightRange: "<5",
        description: "Pharmacy tote for outpatient clinic.",
        handling: ["Confidential"],
        temperature: "Ambient",
        photos: [images.galleryPharmacy],
      },
      schedule: { date: date2, window: "1:00–3:00 PM", deadline: "3:00 PM" },
      price: price186,
      status: "driver_assigned",
      payment: paid("sq_test_186K", etStamp(-2, 11, 15)),
      driver,
      timeline: flowTimeline("driver_assigned", {
        request_received: etStamp(-3, 9, 0),
        quote_sent: etStamp(-3, 9, 30),
        quote_accepted: etStamp(-2, 11, 10),
        booking_confirmed: etStamp(-2, 11, 16),
        driver_assigned: etStamp(-1, 15, 5),
      }),
      custody: [],
      documents: [{ id: "d186", name: "Receipt", kind: "pdf" }],
      createdAt: etStamp(-3, 9, 0),
    },
    {
      id: "SE-2026-000188",
      serviceId: "04",
      deliveryType: "routine",
      priorityAddon: false,
      cargoVan: false,
      pickup: pickup188,
      dropoff: drop188,
      details: {
        type: "Documents/Records",
        quantity: 2,
        boxSize: "Medium",
        dimensions: "18 × 14 × 10 in",
        weightLbs: 4,
        weightRange: "<5",
        description: "Sealed medical records for Hopewell.",
        handling: ["Confidential"],
        temperature: "Ambient",
        photos: [],
      },
      schedule: { date: date3, window: "9:00–11:00 AM", deadline: "" },
      price: price188,
      status: "booking_confirmed",
      payment: { status: "unpaid" },
      timeline: flowTimeline("booking_confirmed", {
        request_received: etStamp(-1, 10, 12),
        quote_sent: etStamp(-1, 11, 0),
        quote_accepted: etStamp(-1, 13, 20),
        booking_confirmed: etStamp(-1, 13, 22),
      }),
      custody: [],
      documents: [],
      createdAt: etStamp(-1, 10, 12),
    },
    {
      id: "SE-2026-000190",
      serviceId: "06",
      deliveryType: "routine",
      priorityAddon: false,
      cargoVan: true,
      pickup: pickup190,
      dropoff: drop190,
      details: {
        type: "Medical Equipment",
        quantity: 1,
        boxSize: "Extra Large",
        dimensions: "30 × 20 × 20 in",
        weightLbs: 62,
        weightRange: "50+",
        description: "Portable monitor in a hard case. Keep upright.",
        handling: ["Fragile", "Keep upright"],
        temperature: "Ambient",
        declaredValue: 2400,
        photos: [images.galleryEquipment],
      },
      schedule: { date: date4, window: "7:00–9:00 AM", deadline: "12:00 PM" },
      price: price190,
      status: "quote_sent",
      quote: {
        id: "Q-190",
        validUntil: etStamp(2, 19, 0),
        notes: "Cargo van is available for this window. Final rate includes the rental and the route to Charlottesville. Please confirm equipment dimensions before acceptance.",
        status: "sent",
      },
      payment: {
        status: "failed",
        failureReason: "Card declined by the issuer (test mode).",
        method: "Visa •••• 0002",
      },
      timeline: flowTimeline("quote_sent", {
        request_received: etStamp(0, 8, 5),
        quote_sent: etStamp(0, 8, 40),
      }),
      custody: [],
      documents: [],
      createdAt: etStamp(0, 8, 5),
    },
    {
      id: "SE-2026-000181",
      serviceId: "05",
      deliveryType: "stat",
      priorityAddon: true,
      cargoVan: false,
      pickup: pickup181,
      dropoff: drop181,
      details: {
        type: "Laboratory Specimen",
        quantity: 1,
        boxSize: "Small",
        dimensions: "12 × 9 × 6 in",
        weightLbs: 2,
        weightRange: "<5",
        description: "STAT specimen. Deadline confirmed by dispatch.",
        handling: ["Biohazard-labeled"],
        temperature: "Ambient",
        photos: [],
      },
      schedule: { date: date0, window: "", deadline: "10:30 AM" },
      price: price181,
      status: "exception",
      exception: "Delay",
      payment: paid("sq_test_181K", etStamp(0, 6, 15)),
      driver,
      eta: "41 min",
      timeline: flowTimeline(
        "exception",
        {
          request_received: etStamp(0, 5, 50),
          quote_sent: etStamp(0, 6, 0),
          quote_accepted: etStamp(0, 6, 12),
          booking_confirmed: etStamp(0, 6, 14),
          driver_assigned: etStamp(0, 6, 20),
          en_route_pickup: etStamp(0, 6, 48),
          picked_up: etStamp(0, 7, 10),
          in_transit: etStamp(0, 7, 25),
        },
        "Traffic delay near downtown. We will confirm the updated delivery window.",
      ),
      custody: [
        { id: "c181", label: "Picked up by courier", who: "Marcus Ellison", at: etStamp(0, 7, 10) },
      ],
      documents: [{ id: "d181", name: "Receipt", kind: "pdf" }],
      createdAt: etStamp(0, 5, 50),
    },
    {
      id: "SE-2026-000172",
      serviceId: "03",
      deliveryType: "routine",
      priorityAddon: false,
      cargoVan: false,
      pickup: pickup172,
      dropoff: drop172,
      details: {
        type: "Pharmaceutical/Prescription",
        quantity: 1,
        boxSize: "Small",
        dimensions: "12 × 9 × 6 in",
        weightLbs: 2,
        weightRange: "<5",
        description: "Prescription delivery to Lucy Corr administration.",
        handling: ["Confidential"],
        temperature: "Ambient",
        photos: [images.galleryProof],
      },
      schedule: { date: dateM3, window: "3:00–5:00 PM", deadline: "5:00 PM" },
      price: price172,
      status: "delivered",
      payment: paid("sq_test_172K", etStamp(-4, 10, 0)),
      driver,
      timeline: flowTimeline("delivered", {
        request_received: etStamp(-5, 9, 12),
        quote_sent: etStamp(-5, 9, 40),
        quote_accepted: etStamp(-4, 9, 55),
        booking_confirmed: etStamp(-4, 10, 2),
        driver_assigned: etStamp(-3, 7, 10),
        en_route_pickup: etStamp(-3, 14, 5),
        picked_up: etStamp(-3, 14, 40),
        in_transit: etStamp(-3, 14, 55),
        delivered: etStamp(-3, 15, 42),
      }),
      custody: [
        { id: "c172a", label: "Picked up by courier", who: "Marcus Ellison", at: etStamp(-3, 14, 40) },
        { id: "c172b", label: "Delivered to recipient", who: "Front desk, Lucy Corr Village", at: etStamp(-3, 15, 42) },
      ],
      pod: {
        recipient: "Alicia Nguyen",
        at: etStamp(-3, 15, 42),
        hasSignature: true,
        photo: images.proof,
      },
      documents: [
        { id: "d172a", name: "Proof of delivery", kind: "image" },
        { id: "d172b", name: "Receipt", kind: "pdf" },
      ],
      createdAt: etStamp(-5, 9, 12),
    },
    {
      id: "SE-2026-000165",
      serviceId: "02",
      deliveryType: "stat",
      priorityAddon: false,
      cargoVan: false,
      pickup: pickup165,
      dropoff: drop165,
      details: {
        type: "Laboratory Specimen",
        quantity: 1,
        boxSize: "Small",
        dimensions: "12 × 9 × 6 in",
        weightLbs: 6,
        weightRange: "5-20",
        description: "Cancelled before pickup.",
        handling: ["Keep upright"],
        temperature: "Refrigerated 2-8 C",
        photos: [],
      },
      schedule: { date: dateM6, window: "", deadline: "2:00 PM" },
      price: price165,
      status: "cancelled",
      payment: {
        status: "refund_pending",
        method: "Visa •••• 4242",
        reference: "sq_test_165K",
        paidAt: etStamp(-7, 9, 30),
        refund: {
          reason: "Plans changed",
          estimate: price165.total,
          status: "processing",
          timeline: [
            { label: "Refund requested", at: etStamp(-6, 11, 5), done: true },
            { label: "Approved", at: etStamp(-6, 14, 20), done: true },
            { label: "Processing", at: etStamp(-5, 9, 0), done: true },
            { label: "Refunded", done: false },
          ],
        },
      },
      timeline: [
        { key: "request_received", label: "Request received", at: etStamp(-7, 8, 40), state: "done" },
        { key: "quote_sent", label: "Quote sent", at: etStamp(-7, 9, 5), state: "done" },
        { key: "quote_accepted", label: "Quote accepted", at: etStamp(-7, 9, 28), state: "done" },
        { key: "booking_confirmed", label: "Booking confirmed", at: etStamp(-7, 9, 32), state: "done" },
        { key: "cancelled", label: "Cancelled", at: etStamp(-6, 11, 4), state: "alert", note: "Plans changed. Refund is processing." },
      ],
      custody: [],
      documents: [{ id: "d165", name: "Receipt", kind: "pdf" }],
      createdAt: etStamp(-7, 8, 40),
    },
  ];

  const users = [
    {
      id: "u-jordan",
      fullName: "Jordan Hale",
      email: "jordan@riversideclinic.com",
      phone: "(804) 555-0172",
      password: "Storey123!",
      accountType: "business",
      companyName: "Riverside Family Clinic",
      facilityType: "Clinic",
      billingEmail: "billing@riversideclinic.com",
      billingAddress: "1200 E Broad Street, Richmond, VA 23219",
      taxId: "",
      photo: "",
      termsAcceptedAt: etStamp(-40, 9, 15),
      policyVersion: business.policyVersion,
      remember: true,
    },
  ];

  const threads = [
    {
      id: "support",
      title: "Storey Dispatch",
      subtitle: "Support",
      unread: 1,
      messages: [
        {
          id: "m1",
          from: "them",
          text: "Hi Jordan. Dispatch is here if a delivery window needs to change.",
          at: etStamp(-2, 9, 0),
          status: "read",
        },
        {
          id: "m2",
          from: "user",
          text: "Thanks. Please keep SE-2026-000184 refrigerated at 2-8 C.",
          at: etStamp(-1, 16, 20),
          status: "read",
        },
        {
          id: "m3",
          from: "them",
          text: "Confirmed. Refrigerated handling is on the shipment, and the courier has the cooler.",
          at: etStamp(0, 7, 45),
          status: "delivered",
        },
      ],
    },
    {
      id: "t-184",
      title: "SE-2026-000184",
      subtitle: "Specimen & Lab Courier",
      shipmentId: "SE-2026-000184",
      unread: 0,
      messages: [
        {
          id: "m4",
          from: "them",
          text: "Marcus is heading to VCU Medical Center for pickup.",
          at: etStamp(0, 7, 6),
          status: "read",
        },
        {
          id: "m5",
          from: "user",
          text: "Receiving will meet him at lab dock, bay 2.",
          at: etStamp(0, 7, 12),
          status: "read",
        },
        {
          id: "m6",
          from: "them",
          text: "Noted. The handoff will be added to the chain-of-custody log.",
          at: etStamp(0, 7, 18),
          status: "read",
        },
      ],
    },
  ];

  const notifications = [
    { id: "n1", type: "in_transit", title: "In transit", body: "SE-2026-000184 is on the way to Chippenham Hospital Lab.", at: etStamp(0, 7, 40), read: false, target: { kind: "shipment", id: "SE-2026-000184" } },
    { id: "n2", type: "chat", title: "New message", body: "Storey Dispatch confirmed refrigerated handling.", at: etStamp(0, 7, 45), read: false, target: { kind: "chat", id: "support" } },
    { id: "n3", type: "quote_sent", title: "Quote sent", body: "Quote Q-190 is ready for the equipment transport.", at: etStamp(0, 8, 40), read: false, target: { kind: "quote", id: "SE-2026-000190" } },
    { id: "n4", type: "request_received", title: "Request received", body: "We received SE-2026-000190 and started the review.", at: etStamp(0, 8, 5), read: true, target: { kind: "shipment", id: "SE-2026-000190" } },
    { id: "n5", type: "exception", title: "Delay", body: "SE-2026-000181 is delayed. We will confirm the updated window.", at: etStamp(0, 7, 25), read: true, target: { kind: "shipment", id: "SE-2026-000181" } },
    { id: "n6", type: "rescheduled", title: "Rescheduled", body: "A new delivery window was requested for SE-2026-000181.", at: etStamp(0, 7, 30), read: true, target: { kind: "shipment", id: "SE-2026-000181" } },
    { id: "n7", type: "picked_up", title: "Picked up", body: "Marcus picked up SE-2026-000184.", at: etStamp(0, 7, 28), read: true, target: { kind: "shipment", id: "SE-2026-000184" } },
    { id: "n8", type: "en_route_pickup", title: "En route to pickup", body: "Your courier is on the way to VCU Medical Center.", at: etStamp(0, 7, 5), read: true, target: { kind: "shipment", id: "SE-2026-000184" } },
    { id: "n9", type: "driver_assigned", title: "Driver assigned", body: "Marcus Ellison is assigned to SE-2026-000186.", at: etStamp(-1, 15, 5), read: true, target: { kind: "shipment", id: "SE-2026-000186" } },
    { id: "n10", type: "booking_confirmed", title: "Booking confirmed", body: "SE-2026-000188 is confirmed for the morning window.", at: etStamp(-1, 13, 22), read: true, target: { kind: "shipment", id: "SE-2026-000188" } },
    { id: "n11", type: "quote_accepted", title: "Quote accepted", body: "You accepted the quote for SE-2026-000188.", at: etStamp(-1, 13, 20), read: true, target: { kind: "shipment", id: "SE-2026-000188" } },
    { id: "n12", type: "payment_failed", title: "Payment failed", body: "Visa •••• 0002 was declined for SE-2026-000190.", at: etStamp(0, 8, 48), read: true, target: { kind: "pay", id: "SE-2026-000190" } },
    { id: "n13", type: "payment_success", title: "Payment received", body: "Receipt sq_test_172K is ready for SE-2026-000172.", at: etStamp(-4, 10, 0), read: true, target: { kind: "shipment", id: "SE-2026-000172" } },
    { id: "n14", type: "delivered", title: "Delivered", body: "SE-2026-000172 was delivered to Alicia Nguyen.", at: etStamp(-3, 15, 42), read: true, target: { kind: "shipment", id: "SE-2026-000172" } },
    { id: "n15", type: "cancelled", title: "Shipment cancelled", body: "SE-2026-000165 was cancelled. The refund is processing.", at: etStamp(-6, 11, 4), read: true, target: { kind: "shipment", id: "SE-2026-000165" } },
  ];

  const addresses = [
    { id: "a1", label: "Clinic dock", line: "5801 Bremo Road, Richmond, VA 23226", facility: "Bon Secours St. Mary's Hospital", placeId: "stmarys" },
    { id: "a2", label: "Lab receiving", line: "7101 Jahnke Road, Richmond, VA 23225", facility: "Chippenham Hospital Lab", placeId: "chippenham" },
  ];

  const cards = [
    { id: "card-4242", brand: "Visa", last4: "4242", exp: "12/28" },
    { id: "card-0002", brand: "Visa", last4: "0002", exp: "12/28", fails: true },
  ];

  return { users, shipments, threads, notifications, addresses, cards };
}
