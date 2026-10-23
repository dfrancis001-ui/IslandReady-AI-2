// IslandReady AI — isolated sample data for the public assessor demo.
//
// Everything here is fictional. No database, session, account or organisation
// data is read, and nothing is persisted by the demo. The checklist, category
// and supply rows mirror the seeded app data so the real components and the
// real scoring/calculator functions behave exactly as they do in the app.

import type { CategoryRow, ItemRow } from "./scoring";
import type { CatalogRow } from "./supplies";

export type DemoItem = ItemRow & { detail: string };

export const DEMO_HOUSEHOLD = {
  id: "demo",
  name: "Sample household",
  community: "Castries (sample)",
  country: "Saint Lucia",
  role: "owner",
  members: "2 adults, 2 children (fictional)",
} as const;

export const DEMO_CATEGORIES: CategoryRow[] = [
  { key: "food", label: "Food", weight: 12 },
  { key: "water", label: "Water", weight: 14 },
  { key: "medical", label: "Medical supplies", weight: 12 },
  { key: "comms", label: "Communication", weight: 12 },
  { key: "documents", label: "Important documents", weight: 8 },
  { key: "power", label: "Power", weight: 8 },
  { key: "home_prep", label: "Home preparation", weight: 10 },
  { key: "evacuation", label: "Evacuation plan", weight: 10 },
  { key: "contacts", label: "Family contacts", weight: 8 },
  { key: "recovery", label: "Recovery preparation", weight: 6 },
];

export const DEMO_ITEMS: DemoItem[] = [
  {
    key: "secure_windows",
    category: "home_prep",
    title: "Secure windows & doors",
    detail: "Shutters closed, test one window",
    tags: ["general"],
  },
  {
    key: "clear_drains",
    category: "home_prep",
    title: "Clear drains & gutters",
    detail: "Prevent yard flooding",
    tags: ["general"],
  },
  {
    key: "store_water",
    category: "water",
    title: "Store drinking water (3 days)",
    detail: "4 people, 12 gal + baby formula",
    tags: ["baby"],
  },
  {
    key: "store_food",
    category: "food",
    title: "Store 3-day food + baby food",
    detail: "Canned food, baby food, manual can opener",
    tags: ["baby"],
  },
  {
    key: "first_aid_meds",
    category: "medical",
    title: "First-aid kit + meds ready",
    detail: "Prescriptions, baby meds, elder meds",
    tags: ["baby", "elderly"],
  },
  {
    key: "charge_devices",
    category: "power",
    title: "Charge devices & radio batteries",
    detail: "Power banks + torch",
    tags: ["general"],
  },
  {
    key: "radio_contact",
    category: "comms",
    title: "Test radio + phone tree",
    detail: "Wind-up radio, out-of-island contact test",
    tags: ["elderly"],
  },
  {
    key: "protect_docs",
    category: "documents",
    title: "Protect docs in zip bag",
    detail: "IDs, insurance, clinic cards",
    tags: ["general"],
  },
  {
    key: "evac_route",
    category: "evacuation",
    title: "Confirm evacuation route",
    detail: "Sample route to a community shelter",
    tags: ["mobility"],
  },
  {
    key: "meeting_point",
    category: "evacuation",
    title: "Confirm meeting point",
    detail: "Sample community centre; backup uphill",
    tags: ["general"],
  },
  {
    key: "island_contact",
    category: "contacts",
    title: "Set out-of-island contact",
    detail: "Share a local and an out-of-area contact",
    tags: ["general"],
  },
  {
    key: "photo_home",
    category: "recovery",
    title: "Photograph home + key docs",
    detail: "For assistance / insurance organization",
    tags: ["general"],
  },
];

// Deliberately partial: lets the score ring and next-best-action logic show
// realistic gaps instead of a finished household.
export const DEMO_DONE: string[] = [
  "secure_windows",
  "clear_drains",
  "store_water",
  "charge_devices",
  "protect_docs",
];

export const DEMO_NEEDS = new Set<string>(["baby"]);

export const DEMO_PLAN = {
  meetingPoint: "Sample community centre, Castries (example)",
  backupMeetingPoint: "Sample church hall, uphill (example)",
  evacuationInfo: "Sample route: follow the main road inland; confirm with NEMO (example).",
  commsPlan: "Text first, then a radio check at 18:00 (example).",
  nextSteps: "Secure home, pack medicines, confirm meeting point (example).",
  contacts: [
    { label: "Alex Example (lead)", phone: "758-555-0100", note: "sample contact" },
    { label: "Sam Example (out of area)", phone: "758-555-0101", note: "sample contact" },
  ],
  roles: [
    { member: "Alex Example", responsibility: "Shutters, water and documents (sample)" },
    { member: "Sam Example", responsibility: "Medicines, radio and check-in (sample)" },
  ],
};

export const DEMO_SUPPLY_CATALOG: CatalogRow[] = [
  {
    key: "water",
    label: "Water",
    unit: "gal",
    pricing_kind: "per_person_day",
    unit_price_cents: 600,
    version: 1,
  },
  {
    key: "food",
    label: "Canned food + baby food",
    unit: "ration",
    pricing_kind: "per_person_day",
    unit_price_cents: 1250,
    version: 1,
  },
  {
    key: "first_aid",
    label: "First aid + baby meds",
    unit: "kit",
    pricing_kind: "per_household",
    unit_price_cents: 6500,
    version: 1,
  },
  {
    key: "flashlight",
    label: "Flashlight + batteries",
    unit: "set",
    pricing_kind: "per_2_people",
    unit_price_cents: 2000,
    version: 1,
  },
  {
    key: "radio",
    label: "Wind-up radio",
    unit: "radio",
    pricing_kind: "per_household",
    unit_price_cents: 6000,
    version: 1,
  },
  {
    key: "hygiene",
    label: "Hygiene + diapers",
    unit: "pack",
    pricing_kind: "per_4_people",
    unit_price_cents: 4500,
    version: 1,
  },
];

export const DEMO_SUPPLY_LISTS = [
  {
    id: "demo-list-1",
    name: "Sample 3-day kit",
    people: 4,
    days: 3,
    pricingVersion: 1,
    totalCents: 43200,
  },
];

export const DEMO_RECOVERY_RECORDS = [
  {
    id: "rr-demo-1",
    title: "Sample roof leak note",
    note: "Fictional record for the demo — no real damage data.",
    hasPhoto: false,
  },
  {
    id: "rr-demo-2",
    title: "Sample documents checklist",
    note: "IDs, insurance and clinic cards (example).",
    hasPhoto: false,
  },
];

export const DEMO_RECOVERY_TASKS = [
  { id: 1, label: "Photograph home and documents (sample)", done: true },
  { id: 2, label: "Call insurer for claim steps (sample)", done: false },
  { id: 3, label: "Check on a neighbour (sample)", done: false },
];

export const DEMO_ASSISTANT_ANSWERS: { keywords: string[]; text: string }[] = [
  {
    keywords: ["hurricane", "storm", "cyclone"],
    text:
      "Sample answer: store water and food, charge devices, secure outdoor items and shutters, " +
      "keep medicines and documents in a waterproof bag, and follow NEMO Saint Lucia for " +
      "official instructions. This is fixed demonstration text — no live AI model is connected.",
  },
  {
    keywords: ["shelter", "evacuate", "evacuation"],
    text:
      "Sample answer: use official NEMO Saint Lucia and CDEMA channels, or your local disaster " +
      "office, for shelter openings and evacuation routes. This demo does not list live shelters.",
  },
  {
    keywords: ["water", "food", "supplies", "pack"],
    text:
      "Sample answer: plan at least 4 litres of water per person per day, non-perishable food, " +
      "a manual can opener, medicines, a first-aid kit, a torch, a battery radio and a power bank. " +
      "Adjust quantities to your household. This is fixed demonstration text.",
  },
  {
    keywords: ["flood", "rain"],
    text:
      "Sample answer: move to higher ground early, never walk or drive through flood water, and " +
      "follow official evacuation instructions. This is fixed demonstration text.",
  },
  {
    keywords: ["earthquake", "shake"],
    text:
      "Sample answer: Drop, Cover and Hold On; stay away from windows; after the shaking, check " +
      "for injuries and damage and expect aftershocks. This is fixed demonstration text.",
  },
];
