-- Home Memory: core schema
-- Phase 1 foundation migration 2/4
-- See docs/planning/03-database-schema.md for the modelling rationale.

-- ---------------------------------------------------------------------
-- Profiles (1:1 extension of auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Households (the sharing / tenancy boundary — see 02-architecture.md §10)
-- ---------------------------------------------------------------------
create table public.households (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null default 'My Home',
  owner_id uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_members (
  id uuid primary key default extensions.gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  role public.household_role not null default 'member',
  status public.household_member_status not null default 'active',
  invited_email text,
  invited_at timestamptz,
  joined_at timestamptz default now(),
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create index household_members_user_id_idx on public.household_members (user_id);

-- ---------------------------------------------------------------------
-- Properties, Rooms
-- ---------------------------------------------------------------------
create table public.properties (
  id uuid primary key default extensions.gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  address_line1 text not null,
  address_line2 text,
  city text,
  postcode text,
  country text not null default 'GB',
  property_type public.property_type,
  tenure public.tenure_type,
  year_built int,
  bedrooms int,
  epc_rating text,
  epc_expiry date,
  council_tax_band text,
  purchase_date date,
  purchase_price numeric(12, 2),
  cover_photo_path text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_household_id_idx on public.properties (household_id);

create table public.rooms (
  id uuid primary key default extensions.gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  name text not null,
  room_type text,
  floor text,
  photo_path text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rooms_property_id_idx on public.rooms (property_id);

-- ---------------------------------------------------------------------
-- Assets (appliances, fixtures, structural items, garden items, ...)
-- ---------------------------------------------------------------------
create table public.assets (
  id uuid primary key default extensions.gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  room_id uuid references public.rooms (id) on delete set null,
  category public.asset_category not null default 'other',
  name text not null,
  brand text,
  model text,
  serial_number text,
  purchase_date date,
  purchase_price numeric(12, 2),
  retailer text,
  warranty_expiry date,
  warranty_provider text,
  status public.asset_status not null default 'active',
  notes text,
  primary_photo_path text,
  attributes jsonb not null default '{}'::jsonb,
  embedding extensions.vector(1536),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assets_property_id_idx on public.assets (property_id);
create index assets_room_id_idx on public.assets (room_id);
create index assets_warranty_expiry_idx on public.assets (warranty_expiry);
create index assets_embedding_idx on public.assets
  using ivfflat (embedding extensions.vector_cosine_ops) with (lists = 50);

-- ---------------------------------------------------------------------
-- Documents (receipts, manuals, warranties, certificates, invoices, ...)
-- ---------------------------------------------------------------------
create table public.documents (
  id uuid primary key default extensions.gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  asset_id uuid references public.assets (id) on delete set null,
  room_id uuid references public.rooms (id) on delete set null,
  uploaded_by uuid references auth.users (id),
  document_type public.document_type not null default 'other',
  file_path text not null,
  file_type text,
  original_filename text,
  supplier text,
  product_description text,
  brand text,
  model text,
  amount numeric(12, 2),
  currency text not null default 'GBP',
  document_date date,
  expiry_date date,
  ai_extracted jsonb not null default '{}'::jsonb,
  extraction_status public.extraction_status not null default 'pending',
  extraction_error text,
  ocr_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_property_id_idx on public.documents (property_id);
create index documents_asset_id_idx on public.documents (asset_id);
create index documents_expiry_date_idx on public.documents (expiry_date);
create index documents_extraction_status_idx on public.documents (extraction_status);

create table public.document_chunks (
  id uuid primary key default extensions.gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  chunk_index int not null default 0,
  content text not null,
  token_count int,
  embedding extensions.vector(1536),
  created_at timestamptz not null default now()
);

create index document_chunks_document_id_idx on public.document_chunks (document_id);
create index document_chunks_embedding_idx on public.document_chunks
  using ivfflat (embedding extensions.vector_cosine_ops) with (lists = 50);

-- ---------------------------------------------------------------------
-- Contractors
-- ---------------------------------------------------------------------
create table public.contractors (
  id uuid primary key default extensions.gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  name text not null,
  trade text,
  phone text,
  email text,
  website text,
  notes text,
  rating smallint check (rating between 1 and 5),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contractors_property_id_idx on public.contractors (property_id);

-- ---------------------------------------------------------------------
-- Maintenance
-- ---------------------------------------------------------------------
create table public.maintenance_tasks (
  id uuid primary key default extensions.gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  asset_id uuid references public.assets (id) on delete cascade,
  title text not null,
  description text,
  frequency_type public.maintenance_frequency not null default 'annual',
  frequency_days int,
  next_due_date date not null,
  last_completed_date date,
  is_active boolean not null default true,
  source text not null default 'system_generated',
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maintenance_tasks_custom_days_required check (
    frequency_type <> 'custom_days' or frequency_days is not null
  )
);

create index maintenance_tasks_property_id_idx on public.maintenance_tasks (property_id);
create index maintenance_tasks_next_due_date_idx on public.maintenance_tasks (next_due_date)
  where is_active;

create table public.maintenance_completions (
  id uuid primary key default extensions.gen_random_uuid(),
  maintenance_task_id uuid not null references public.maintenance_tasks (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  completed_date date not null default current_date,
  completed_by uuid references auth.users (id),
  contractor_id uuid references public.contractors (id) on delete set null,
  cost numeric(12, 2),
  notes text,
  document_id uuid references public.documents (id) on delete set null,
  created_at timestamptz not null default now()
);

create index maintenance_completions_task_id_idx on public.maintenance_completions (maintenance_task_id);

-- ---------------------------------------------------------------------
-- Timeline
-- ---------------------------------------------------------------------
create table public.timeline_events (
  id uuid primary key default extensions.gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  event_type public.timeline_event_type not null,
  title text not null,
  description text,
  event_date date not null,
  cost numeric(12, 2),
  related_asset_id uuid references public.assets (id) on delete set null,
  related_document_id uuid references public.documents (id) on delete set null,
  related_contractor_id uuid references public.contractors (id) on delete set null,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index timeline_events_property_id_idx on public.timeline_events (property_id, event_date desc);

-- ---------------------------------------------------------------------
-- Home Health Score
-- ---------------------------------------------------------------------
create table public.home_health_scores (
  id uuid primary key default extensions.gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  score smallint not null check (score between 0 and 100),
  breakdown jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now()
);

create index home_health_scores_property_id_idx on public.home_health_scores (property_id, computed_at desc);

-- ---------------------------------------------------------------------
-- AI Assistant conversations
-- ---------------------------------------------------------------------
create table public.ai_conversations (
  id uuid primary key default extensions.gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_conversations_property_id_idx on public.ai_conversations (property_id);

create table public.ai_messages (
  id uuid primary key default extensions.gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role public.ai_message_role not null,
  content text not null,
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index ai_messages_conversation_id_idx on public.ai_messages (conversation_id, created_at);

-- ---------------------------------------------------------------------
-- Subscriptions (mirror of RevenueCat; see 02-architecture.md §5)
-- ---------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default extensions.gen_random_uuid(),
  household_id uuid not null unique references public.households (id) on delete cascade,
  revenuecat_customer_id text,
  entitlement text not null default 'free',
  status public.subscription_status not null default 'active',
  product_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Home Passport shares
-- ---------------------------------------------------------------------
create table public.passport_shares (
  id uuid primary key default extensions.gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  created_by uuid references auth.users (id),
  snapshot jsonb,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  viewed_count int not null default 0,
  created_at timestamptz not null default now()
);

create index passport_shares_property_id_idx on public.passport_shares (property_id);

-- ---------------------------------------------------------------------
-- Notification log (throttling + delivery tracking for reminders)
-- ---------------------------------------------------------------------
create table public.notification_log (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  maintenance_task_id uuid references public.maintenance_tasks (id) on delete cascade,
  notification_type text not null,
  sent_at timestamptz not null default now(),
  opened_at timestamptz
);

create index notification_log_user_id_idx on public.notification_log (user_id, sent_at desc);
