-- IslandReady AI — Phase 3 seed: 12-item hurricane & flood plan (Saint Lucia).
-- Run after 001_readiness.sql: psql $DATABASE_URL -f 002_hurricane_flood_plan.sql
-- Item set extends the 7 prototype items to the PRD's 12-item plan ("5 of 12").

BEGIN;

INSERT INTO readiness_categories (key, label, weight) VALUES
  ('food',      'Food',                12),
  ('water',     'Water',               14),
  ('medical',   'Medical supplies',    12),
  ('comms',     'Communication',       12),
  ('documents', 'Important documents',  8),
  ('power',     'Power',                8),
  ('home_prep', 'Home preparation',    10),
  ('evacuation','Evacuation plan',     10),
  ('contacts',  'Family contacts',      8),
  ('recovery',  'Recovery preparation', 6)
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, weight = EXCLUDED.weight;

INSERT INTO checklist_items (key, category_key, title, detail, tags) VALUES
  ('secure_windows',   'home_prep', 'Secure windows & doors',        'Shutters closed, test one window',            '{general}'),
  ('clear_drains',     'home_prep', 'Clear drains & gutters',        'Prevent yard flooding',                       '{general}'),
  ('store_water',      'water',     'Store drinking water (3 days)', '4 people, 12 gal + baby formula',             '{baby}'),
  ('store_food',       'food',      'Store 3-day food + baby food',  'Canned food, baby food, manual can opener',    '{baby}'),
  ('first_aid_meds',   'medical',   'First-aid kit + meds ready',    'Prescriptions, baby meds, Gran meds',         '{baby,elderly}'),
  ('charge_devices',   'power',     'Charge devices & radio batteries','Power banks + torch',                       '{general}'),
  ('radio_contact',    'comms',     'Test radio + phone tree',       'Wind-up radio, out-of-island contact test',   '{elderly}'),
  ('protect_docs',     'documents', 'Protect docs in zip bag',       'IDs, insurance, clinic cards',                '{general}'),
  ('evac_route',       'evacuation','Confirm evacuation route',      'Castries to St. Jude hall, 12 min',           '{mobility}'),
  ('meeting_point',    'evacuation','Confirm meeting point',         'St. Jude Church hall; backup uphill',         '{general}'),
  ('island_contact',   'contacts',  'Set out-of-island contact',     'Biggest common score gap',                    '{general}'),
  ('photo_home',       'recovery',  'Photograph home + key docs',    'For assistance / insurance organization',     '{general}')
ON CONFLICT (key) DO UPDATE SET
  category_key = EXCLUDED.category_key,
  title = EXCLUDED.title,
  detail = EXCLUDED.detail,
  tags = EXCLUDED.tags;

COMMIT;
