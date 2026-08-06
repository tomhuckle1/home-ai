-- Tracks whether a user has been through the first-run guided intro
-- (plan risk P1 — "60 seconds to value" / a guided walkthrough before the
-- app looks like an empty filing cabinet). Account-level, not on-device,
-- so it doesn't re-show after a reinstall or on a second device.
alter table public.profiles add column onboarded_at timestamptz;
