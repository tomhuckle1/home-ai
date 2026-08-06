-- Home Memory: extensions and enum types
-- Phase 1 foundation migration 1/4

create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "vector" with schema extensions;

create type public.household_role as enum ('owner', 'member');
create type public.household_member_status as enum ('active', 'invited', 'removed');

create type public.property_type as enum (
  'detached', 'semi_detached', 'terraced', 'flat', 'bungalow', 'other'
);

create type public.tenure_type as enum (
  'freehold', 'leasehold', 'shared_ownership', 'unknown'
);

create type public.asset_category as enum (
  'appliance', 'heating', 'plumbing', 'electrical', 'structural',
  'fixture', 'furniture', 'garden', 'security', 'other'
);

create type public.asset_status as enum ('active', 'replaced', 'removed');

create type public.document_type as enum (
  'receipt', 'manual', 'warranty', 'certificate', 'invoice',
  'insurance_policy', 'epc', 'gas_safety_record', 'fensa_certificate',
  'mortgage_document', 'other'
);

create type public.extraction_status as enum (
  'pending', 'processing', 'completed', 'failed', 'needs_review'
);

create type public.maintenance_frequency as enum (
  'once', 'monthly', 'quarterly', 'biannual', 'annual', 'custom_days'
);

create type public.timeline_event_type as enum (
  'purchase', 'sale', 'renovation', 'repair', 'maintenance_completed',
  'document_added', 'asset_added', 'insurance_renewed', 'other'
);

create type public.subscription_status as enum (
  'trialing', 'active', 'past_due', 'cancelled', 'expired'
);

create type public.ai_message_role as enum ('user', 'assistant');
