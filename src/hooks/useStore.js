import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { business } from "../constants/business";
import { images } from "../lib/content";
import { buildSeed } from "../lib/seed";
import { formatDateTimeET } from "../lib/format";
import { draftPrice, round2, submitIntent } from "../lib/pricing";
import { clearSession, clearStorage, readSession, readStorage, writeSession, writeStorage } from "../lib/storage";


const COURIER = {
  name: "Marcus Ellison",
  phone: "(804) 555-0144",
  vehicle: "2024 Ford Transit 250, white",
  plate: "SE-4412",
  photo: images.driver,
};

const LIVE_ORDER = [
  "booking_confirmed",
  "driver_assigned",
  "en_route_pickup",
  "picked_up",
  "in_transit",
  "delivered",
];

const LIVE_LABEL = {
  request_received: "Request received",
  booking_confirmed: "Booking confirmed",
  driver_assigned: "Courier assigned",
  en_route_pickup: "En route to pickup",
  picked_up: "Picked up",
  in_transit: "In transit",
  delivered: "Delivered",
};

const LIVE_NOTE = {
  driver_assigned: "Marcus Ellison is assigned and preparing the van.",
  en_route_pickup: "The courier is driving to the pickup.",
  picked_up: "The package is secured with the courier.",
  in_transit: "On the way to the drop-off.",
  delivered: "Recipient confirmation is on the shipment.",
};

const LIVE_ETA = {
  driver_assigned: "25 min",
  en_route_pickup: "12 min",
  picked_up: "28 min",
  in_transit: "16 min",
};

function stepLive(item, now) {
  const index = LIVE_ORDER.indexOf(item.status);
  if (index < 0 || index === LIVE_ORDER.length - 1) return null;
  const next = LIVE_ORDER[index + 1];
  const stamps = new Map(item.timeline.map((event) => [event.key, event.at]));
  const keys = ["request_received", ...LIVE_ORDER];
  const nextIndex = keys.indexOf(next);
  const timeline = keys.map((key, step) => ({
    key,
    label: LIVE_LABEL[key] ?? key,
    state: step < nextIndex ? "done" : step === nextIndex ? "current" : "upcoming",
    at: step < nextIndex ? stamps.get(key) || item.createdAt : step === nextIndex ? now : undefined,
    note: step === nextIndex ? LIVE_NOTE[key] : undefined,
  }));
  return {
    ...item,
    status: next,
    eta: LIVE_ETA[next],
    driver: next === "booking_confirmed" ? item.driver : item.driver ?? COURIER,
    timeline,
    custody:
      next === "picked_up"
        ? [...item.custody, { id: `c-${Date.now()}`, label: "Picked up", who: COURIER.name, at: now }]
        : next === "delivered"
          ? [...item.custody, { id: `c-${Date.now()}`, label: "Delivered", who: item.dropoff.contact || "Receiving desk", at: now }]
          : item.custody,
    pod:
      next === "delivered"
        ? {
            recipient: item.dropoff.contact || "Receiving desk",
            at: now,
            hasSignature: true,
            photo: images.proof,
          }
        : item.pod,
    documents:
      next === "delivered" && !item.documents.some((doc) => doc.id === "pod")
        ? [...item.documents, { id: "pod", name: "Proof of delivery", kind: "image" }]
        : item.documents,
  };
}


const DEFAULT_PREFS = {
  Shipments: { push: true, email: true, sms: false },
  "Quotes and payments": { push: true, email: true, sms: true },
  Messages: { push: true, email: false, sms: false },
};

export function emptyStop() {
  return {
    address: "",
    facility: "",
    contact: "",
    phone: "",
    access: "",
    notes: "",
    milesFromOrigin: null,
    lat: null,
    lng: null,
  };
}

export function emptyDraft(serviceId = "01") {
  return {
    serviceId,
    deliveryType: "",
    priorityAddon: false,
    cargoVan: false,
    pickup: emptyStop(),
    dropoff: emptyStop(),
    details: {
      type: "",
      quantity: 1,
      boxSize: "",
      length: "",
      width: "",
      height: "",
      weight: "",
      weightRange: "",
      description: "",
      handling: [],
      temperature: "",
      temperatureOther: "",
      declaredValue: "",
      photos: [],
    },
    schedule: { date: "", window: "", deadline: "" },
    priceMode: "auto",
    drivingMiles: null,
    step: 1,
  };
}

function refundEstimate(shipment) {
  const paid = shipment.payment.status === "paid" || shipment.payment.status === "refund_pending";
  if (!paid) return 0;
  const full = shipment.price.total;
  if (["request_received", "quote_sent", "quote_accepted", "booking_confirmed"].includes(shipment.status)) return full;
  if (["driver_assigned", "en_route_pickup"].includes(shipment.status)) return round2(full * 0.75);
  if (shipment.status === "picked_up") return round2(full * 0.5);
  if (["in_transit", "exception"].includes(shipment.status)) return round2(full * 0.25);
  return 0;
}


const Ctx = createContext(null);

function loadJson(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AppProvider({ children }) {
  const [seed] = useState(buildSeed);
  const [hydrated, setHydrated] = useState(false);
  const [users, setUsers] = useState(seed.users);
  const [user, setUser] = useState(null);
  const [onboarded, setOnboarded] = useState(false);
  const [shipments, setShipments] = useState(seed.shipments);
  const [threads, setThreads] = useState(seed.threads);
  const [notifications, setNotifications] = useState(seed.notifications);
  const [addresses, setAddresses] = useState(seed.addresses);
  const [cards, setCards] = useState(seed.cards);
  const [draft, setDraftState] = useState(emptyDraft());
  const [notify, setNotify] = useState(DEFAULT_PREFS);
  const [listPreview, setListPreview] = useState("live");
  const [connectivity, setConnectivity] = useState("online");
  const [toasts, setToasts] = useState([]);
  const [focusField, setFocusField] = useState(null);
  const [typingThread, setTypingThread] = useState(null);
  const liveTick = useRef({});
  const shipmentsRef = useRef(shipments);
  shipmentsRef.current = shipments;

  const pushToast = (title, body) => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, title, body }]);
    setTimeout(() => setToasts((list) => list.filter((item) => item.id !== id)), 3200);
  };

  useEffect(() => {
    const savedUsers = loadJson(readStorage("se.users"));
    const savedShips = loadJson(readStorage("se.shipments"));
    const savedThreads = loadJson(readStorage("se.threads"));
    const savedNotes = loadJson(readStorage("se.notifications"));
    const savedAddresses = loadJson(readStorage("se.addresses"));
    const savedCards = loadJson(readStorage("se.cards"));
    const savedNotify = loadJson(readStorage("se.notify"));
    const savedUser = loadJson(readSession("se.user") ?? readStorage("se.user"));
    if (savedUsers) setUsers(savedUsers);
    if (savedShips) setShipments(savedShips);
    if (savedThreads) setThreads(savedThreads);
    if (savedNotes) setNotifications(savedNotes);
    if (savedAddresses) setAddresses(savedAddresses);
    if (savedCards) setCards(savedCards);
    if (savedNotify) setNotify(savedNotify);
    if (savedUser) setUser(savedUser);
    setOnboarded(readStorage("se.onboarded") === "1");
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStorage("se.users", JSON.stringify(users));
    writeStorage("se.shipments", JSON.stringify(shipments));
    writeStorage("se.threads", JSON.stringify(threads));
    writeStorage("se.notifications", JSON.stringify(notifications));
    writeStorage("se.addresses", JSON.stringify(addresses));
    writeStorage("se.cards", JSON.stringify(cards));
    writeStorage("se.notify", JSON.stringify(notify));
    writeStorage("se.onboarded", onboarded ? "1" : "0");
  }, [hydrated, users, shipments, threads, notifications, addresses, cards, notify, onboarded]);

  const api = useMemo(() => {
    const persistUser = (next) => {
      setUser(next);
      if (!next) {
        clearStorage("se.user");
        clearSession("se.user");
        return;
      }
      if (next.remember) {
        writeStorage("se.user", JSON.stringify(next));
        clearSession("se.user");
      } else {
        writeSession("se.user", JSON.stringify(next));
        clearStorage("se.user");
      }
    };

    return {
      hydrated,
      user,
      onboarded,
      shipments,
      threads,
      notifications,
      addresses,
      cards,
      draft,
      notify,
      listPreview,
      connectivity,
      toasts,
      focusField,
      typingThread,
      markOnboarded: () => {
        setOnboarded(true);
        writeStorage("se.onboarded", "1");
      },
      login: (email, password, remember) => {
        const found = users.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
        if (!found || found.password !== password) return { ok: false, reason: "invalid" };
        const next = { ...found, remember };
        persistUser(next);
        setUsers((list) => list.map((item) => (item.id === next.id ? next : item)));
        setOnboarded(true);
        return { ok: true };
      },
      register: (input) => {
        if (users.some((item) => item.email.toLowerCase() === input.email.trim().toLowerCase())) {
          return { ok: false, reason: "exists" };
        }
        const created = {
          id: `u-${Date.now()}`,
          fullName: input.fullName.trim(),
          email: input.email.trim().toLowerCase(),
          phone: input.phone.trim(),
          password: input.password,
          accountType: input.accountType,
          companyName: input.companyName.trim(),
          facilityType: input.facilityType,
          billingEmail: input.billingEmail.trim(),
          billingAddress: input.billingAddress.trim(),
          taxId: input.taxId?.trim() ?? "",
          photo: "",
          termsAcceptedAt: new Date().toISOString(),
          policyVersion: business.policyVersion,
          remember: true,
        };
        setUsers((list) => [...list, created]);
        persistUser(created);
        setOnboarded(true);
        return { ok: true };
      },
      sso: (provider) => {
        const existing = users.find((item) => item.email === "jordan@riversideclinic.com") ?? users[0];
        if (existing) {
          persistUser({ ...existing, remember: true });
          pushToast(`Signed in with ${provider}`, "This preview uses a sample account.");
          return;
        }
        const created = {
          ...emptyProfile(),
          id: `u-${Date.now()}`,
          fullName: provider === "Google" ? "Alex Morgan" : "Riley Chen",
          email: provider === "Google" ? "alex.morgan@gmail.com" : "riley.chen@icloud.com",
          password: "Storey123!",
          remember: true,
          termsAcceptedAt: new Date().toISOString(),
          policyVersion: business.policyVersion,
        };
        setUsers((list) => [...list, created]);
        persistUser(created);
        pushToast(`Signed in with ${provider}`);
      },
      logout: () => {
        persistUser(null);
        pushToast("Signed out");
      },
      updateUser: (patch) => {
        if (!user) return;
        const next = { ...user, ...patch };
        persistUser(next);
        setUsers((list) => list.map((item) => (item.id === next.id ? next : item)));
      },
      deleteAccount: () => {
        if (!user) return { ok: false, reason: "password" };
        setUsers((list) => list.filter((item) => item.id !== user.id));
        persistUser(null);
        pushToast("Account deleted", "Delivery and payment records may be retained.");
        return { ok: true };
      },
      resetPassword: (email, password) => {
        setUsers((list) =>
          list.map((item) => (item.email.toLowerCase() === email.trim().toLowerCase() ? { ...item, password } : item)),
        );
        if (user && user.email.toLowerCase() === email.trim().toLowerCase()) {
          persistUser({ ...user, password });
        }
      },
      setDraft: (patch) => {
        setDraftState((current) => (typeof patch === "function" ? patch(current) : { ...current, ...patch }));
      },
      startBooking: (serviceId) => setDraftState(emptyDraft(serviceId || "01")),
      reorder: (shipmentId) => {
        const source = shipments.find((item) => item.id === shipmentId);
        if (!source) return;
        setDraftState({
          ...emptyDraft(source.serviceId),
          deliveryType: source.deliveryType,
          priorityAddon: source.priorityAddon,
          cargoVan: source.cargoVan,
          pickup: source.pickup,
          dropoff: source.dropoff,
          details: {
            ...emptyDraft().details,
            type: source.details.type,
            quantity: source.details.quantity,
            boxSize: source.details.boxSize,
            weight: String(source.details.weightLbs),
            weightRange: source.details.weightRange,
            description: source.details.description,
            handling: source.details.handling,
            temperature: source.details.temperature,
            declaredValue: source.details.declaredValue ? String(source.details.declaredValue) : "",
            photos: source.details.photos,
          },
        });
        pushToast("Shipment copied", "Choose a new delivery window to finish.");
      },
      createShipment: (current) => {
        const intent = submitIntent(current);
        const idNum = Math.max(200, ...shipments.map((item) => Number(item.id.split("-").pop()) || 0)) + 1;
        const year = new Date().getFullYear();
        const id = `SE-${year}-${String(idNum).padStart(6, "0")}`;
        const now = new Date().toISOString();
        const price = draftPrice(current);
        const dims =
          current.details.boxSize === "Custom"
            ? `${current.details.length} × ${current.details.width} × ${current.details.height} in`
            : current.details.boxSize;
        const status = intent === "book" ? "booking_confirmed" : "quote_sent";
        const created = {
          id,
          serviceId: current.serviceId,
          deliveryType: (current.deliveryType || "routine"),
          priorityAddon: current.priorityAddon,
          cargoVan: current.cargoVan,
          pickup: current.pickup,
          dropoff: current.dropoff,
          details: {
            type: current.details.type,
            quantity: current.details.quantity,
            boxSize: current.details.boxSize,
            dimensions: dims,
            weightLbs: Number(current.details.weight) || 0,
            weightRange: current.details.weightRange,
            description: current.details.description,
            handling: current.details.handling,
            temperature:
              current.details.temperature === "Other"
                ? current.details.temperatureOther || "Other"
                : current.details.temperature,
            declaredValue: current.details.declaredValue ? Number(current.details.declaredValue) : undefined,
            photos: current.details.photos,
          },
          schedule: current.schedule,
          price,
          status,
          quote:
            intent === "book"
              ? undefined
              : {
                  id: `Q-${idNum}`,
                  validUntil: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
                  notes:
                    intent === "review"
                      ? "This pickup or delivery is outside the standard service area. Our team will review the route before confirming."
                      : "Preview quote based on the details you submitted. Final rate is confirmed by Storey Enterprises.",
                  status: "sent",
                },
          payment: { status: "unpaid" },
          timeline: [
            { key: "request_received", label: "Request received", at: now, state: intent === "book" ? "done" : "done" },
            {
              key: intent === "book" ? "booking_confirmed" : "quote_sent",
              label: intent === "book" ? "Booking confirmed" : "Quote sent",
              at: now,
              state: "current",
            },
          ],
          custody: [],
          documents: [],
          createdAt: now,
        };
        setShipments((list) => [created, ...list]);
        setThreads((list) => [
          {
            id: `t-${id}`,
            title: id,
            subtitle: "Shipment thread",
            shipmentId: id,
            unread: 1,
            messages: [
              {
                id: `m-${Date.now()}`,
                from: "them",
                text: `We received ${id}. ${intent === "book" ? "Your delivery window is held." : "A quote is ready for review."}`,
                at: now,
                status: "delivered",
              },
            ],
          },
          ...list,
        ]);
        setNotifications((list) => [
          {
            id: `n-${Date.now()}`,
            type: intent === "book" ? "booking_confirmed" : "quote_sent",
            title: intent === "book" ? "Booking confirmed" : "Quote sent",
            body: `${id} · ${formatDateTimeET(now)}`,
            at: now,
            read: false,
            target: intent === "book" ? { kind: "shipment", id } : { kind: "quote", id },
          },
          ...list,
        ]);
        pushToast(intent === "book" ? "Booking confirmed" : "Request received", id);
        return created;
      },
      advanceLiveShipment: (shipmentId) => {
        const nowMs = Date.now();
        if (nowMs - (liveTick.current[shipmentId] ?? 0) < 5000) return;
        const current = shipmentsRef.current.find((entry) => entry.id === shipmentId);
        const now = new Date(nowMs).toISOString();
        const update = current ? stepLive(current, now) : null;
        if (!update) return;
        liveTick.current[shipmentId] = nowMs;
        setShipments((list) => list.map((entry) => (entry.id === shipmentId ? update : entry)));
        const note = LIVE_NOTE[update.status] ?? update.status;
        setNotifications((list) => [
          {
            id: `n-${nowMs}`,
            type: update.status,
            title: LIVE_LABEL[update.status] ?? "Shipment update",
            body: `${update.id} · ${note}`,
            at: now,
            read: false,
            target: { kind: "shipment", id: update.id },
          },
          ...list,
        ]);
        setThreads((list) =>
          list.map((thread) =>
            thread.shipmentId === update.id
              ? {
                  ...thread,
                  unread: thread.unread + 1,
                  messages: [
                    ...thread.messages,
                    {
                      id: `m-${nowMs}`,
                      from: "them",
                      text: `${LIVE_LABEL[update.status]}. ${note}`,
                      at: now,
                      status: "delivered",
                    },
                  ],
                }
              : thread,
          ),
        );
        pushToast(LIVE_LABEL[update.status] ?? "Shipment update", `${update.id} · ${note}`);
      },
      acceptQuote: (shipmentId) => {
        const now = new Date().toISOString();
        setShipments((list) =>
          list.map((item) =>
            item.id === shipmentId
              ? {
                  ...item,
                  status: "quote_accepted",
                  quote: item.quote ? { ...item.quote, status: "accepted" } : item.quote,
                  timeline: item.timeline
                    .map((event) => (event.state === "current" ? { ...event, state: "done" } : event))
                    .concat({ key: "quote_accepted", label: "Quote accepted", at: now, state: "current" }),
                }
              : item,
          ),
        );
        pushToast("Quote accepted", business.paymentNote);
      },
      declineQuote: (shipmentId, reason) => {
        const now = new Date().toISOString();
        setShipments((list) =>
          list.map((item) =>
            item.id === shipmentId
              ? {
                  ...item,
                  status: "quote_declined",
                  quote: item.quote ? { ...item.quote, status: "declined", declineReason: reason } : item.quote,
                  timeline: item.timeline.concat({
                    key: "quote_declined",
                    label: "Quote declined",
                    at: now,
                    state: "alert",
                    note: reason,
                  }),
                }
              : item,
          ),
        );
        pushToast("Quote declined");
      },
      payShipment: (shipmentId, method) => {
        const shipment = shipments.find((item) => item.id === shipmentId);
        if (!shipment) return { ok: false, reason: "Shipment not found." };
        if (method.includes("0002")) {
          setShipments((list) =>
            list.map((item) =>
              item.id === shipmentId
                ? {
                    ...item,
                    payment: {
                      ...item.payment,
                      status: "failed",
                      method,
                      failureReason: "Card declined by the issuer (test mode).",
                    },
                  }
                : item,
            ),
          );
          return { ok: false, reason: "Card declined by the issuer (test mode)." };
        }
        const now = new Date().toISOString();
        const reference = `sq_test_${shipmentId.slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
        setShipments((list) =>
          list.map((item) =>
            item.id === shipmentId
              ? {
                  ...item,
                  status: item.status === "quote_accepted" || item.status === "quote_sent" ? "booking_confirmed" : item.status,
                  payment: { status: "paid", method, reference, paidAt: now },
                  documents: item.documents.some((doc) => doc.name === "Receipt")
                    ? item.documents
                    : [...item.documents, { id: `rc-${Date.now()}`, name: "Receipt", kind: "pdf" }],
                  timeline: item.timeline
                    .map((event) => (event.state === "current" ? { ...event, state: "done" } : event))
                    .concat(
                      item.status === "booking_confirmed"
                        ? []
                        : [{ key: "booking_confirmed", label: "Booking confirmed", at: now, state: "current" }],
                    ),
                }
              : item,
          ),
        );
        setNotifications((list) => [
          {
            id: `n-${Date.now()}`,
            type: "payment_success",
            title: "Payment received",
            body: `${reference} · ${shipmentId}`,
            at: now,
            read: false,
            target: { kind: "shipment", id: shipmentId },
          },
          ...list,
        ]);
        pushToast("Payment received", reference);
        return { ok: true, reference };
      },
      cancelShipment: (shipmentId, reason) => {
        const source = shipments.find((item) => item.id === shipmentId);
        if (!source) return;
        const estimate = refundEstimate(source);
        const now = new Date().toISOString();
        setShipments((list) =>
          list.map((item) => {
            if (item.id !== shipmentId) return item;
            return {
              ...item,
              status: "cancelled",
              timeline: [
                ...item.timeline.map((event) => (event.state === "current" ? { ...event, state: "done" } : event)),
                { key: "cancelled", label: "Cancelled", at: now, state: "alert", note: reason },
              ],
              payment:
                estimate > 0
                  ? {
                      ...item.payment,
                      status: "refund_pending",
                      refund: {
                        reason,
                        estimate,
                        status: "requested",
                        timeline: [
                          { label: "Refund requested", at: now, done: true },
                          { label: "Approved", done: false },
                          { label: "Processing", done: false },
                          { label: "Refunded", done: false },
                        ],
                      },
                    }
                  : item.payment,
            };
          }),
        );
        pushToast("Shipment cancelled", estimate > 0 ? `Refund estimate ${estimate.toFixed(2)}` : undefined);
      },
      requestReschedule: (shipmentId, date, window) => {
        const now = new Date().toISOString();
        setShipments((list) =>
          list.map((item) =>
            item.id === shipmentId
              ? {
                  ...item,
                  reschedule: { date, window },
                  timeline: item.timeline.concat({
                    key: "rescheduled",
                    label: "Rescheduled",
                    at: now,
                    state: "done",
                    note: `Requested ${date} · ${window}`,
                  }),
                }
              : item,
          ),
        );
        pushToast("Reschedule requested", "Our team will confirm the new window.");
      },
      sendMessage: (threadId, text, attachment) => {
        const now = new Date().toISOString();
        setThreads((list) =>
          list.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  messages: [
                    ...thread.messages,
                    { id: `m-${Date.now()}`, from: "user", text, at: now, attachment, status: "sent" },
                  ],
                }
              : thread,
          ),
        );
        setTimeout(() => {
          setThreads((list) =>
            list.map((thread) =>
              thread.id === threadId
                ? {
                    ...thread,
                    messages: thread.messages.map((message) =>
                      message.from === "user" && message.status === "sent" ? { ...message, status: "read" } : message,
                    ),
                  }
                : thread,
            ),
          );
        }, 700);
      },
      receiveMessage: (threadId, text) => {
        const now = new Date().toISOString();
        setThreads((list) =>
          list.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  unread: thread.unread + 1,
                  messages: [
                    ...thread.messages,
                    { id: `m-${Date.now()}`, from: "them", text, at: now, status: "delivered" },
                  ],
                }
              : thread,
          ),
        );
        setTypingThread(null);
      },
      markThreadRead: (threadId) => {
        setThreads((list) => {
          const current = list.find((thread) => thread.id === threadId);
          if (!current || current.unread === 0) return list;
          return list.map((thread) => (thread.id === threadId ? { ...thread, unread: 0 } : thread));
        });
      },
      setTypingThread,
      markAllRead: () => setNotifications((list) => list.map((item) => ({ ...item, read: true }))),
      markNotificationRead: (id) =>
        setNotifications((list) => list.map((item) => (item.id === id ? { ...item, read: true } : item))),
      addAddress: (address) => setAddresses((list) => [{ ...address, id: `a-${Date.now()}` }, ...list]),
      removeAddress: (id) => setAddresses((list) => list.filter((item) => item.id !== id)),
      addCard: (card) => setCards((list) => [{ ...card, id: `card-${Date.now()}` }, ...list]),
      removeCard: (id) => setCards((list) => list.filter((item) => item.id !== id)),
      toggleNotify: (category, channel) =>
        setNotify((current) => ({
          ...current,
          [category]: { ...current[category], [channel]: !current[category][channel] },
        })),
      setListPreview,
      setConnectivity,
      setFocusField,
      pushToast,
      dismissToast: (id) => setToasts((list) => list.filter((item) => item.id !== id)),
      refundEstimate,
    };
  }, [
    hydrated,
    user,
    onboarded,
    shipments,
    threads,
    notifications,
    addresses,
    cards,
    draft,
    notify,
    listPreview,
    connectivity,
    toasts,
    focusField,
    typingThread,
    users,
  ]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

function emptyProfile() {
  return {
    id: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
    accountType: "individual",
    companyName: "",
    facilityType: "",
    billingEmail: "",
    billingAddress: "",
    taxId: "",
    photo: "",
    termsAcceptedAt: "",
    policyVersion: business.policyVersion,
    remember: true,
  };
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function unreadCount(threads) {
  return threads.reduce((sum, thread) => sum + thread.unread, 0);
}