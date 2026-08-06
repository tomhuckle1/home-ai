// Hand-authored to match supabase/migrations/*.sql exactly.
// Regenerate/replace with `supabase gen types typescript` once a live
// project exists (see docs/planning/03-database-schema.md).

export type HouseholdRole = 'owner' | 'member';
export type HouseholdMemberStatus = 'active' | 'invited' | 'removed';
export type PropertyType = 'detached' | 'semi_detached' | 'terraced' | 'flat' | 'bungalow' | 'other';
export type TenureType = 'freehold' | 'leasehold' | 'shared_ownership' | 'unknown';
export type AssetCategory =
  | 'appliance'
  | 'heating'
  | 'plumbing'
  | 'electrical'
  | 'structural'
  | 'fixture'
  | 'furniture'
  | 'garden'
  | 'security'
  | 'other';
export type AssetStatus = 'active' | 'replaced' | 'removed';
export type DocumentType =
  | 'receipt'
  | 'manual'
  | 'warranty'
  | 'certificate'
  | 'invoice'
  | 'insurance_policy'
  | 'epc'
  | 'gas_safety_record'
  | 'fensa_certificate'
  | 'mortgage_document'
  | 'other';
export type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'needs_review';
export type MaintenanceFrequency = 'once' | 'monthly' | 'quarterly' | 'biannual' | 'annual' | 'custom_days';
export type TimelineEventType =
  | 'purchase'
  | 'sale'
  | 'renovation'
  | 'repair'
  | 'maintenance_completed'
  | 'document_added'
  | 'asset_added'
  | 'insurance_renewed'
  | 'other';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled' | 'expired';
export type AiMessageRole = 'user' | 'assistant';

export type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}
export type ProfileUpdate = Partial<Pick<ProfileRow, 'full_name' | 'avatar_url'>>;

export type HouseholdRow = {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}
export type HouseholdUpdate = Partial<Pick<HouseholdRow, 'name'>>;

export type HouseholdMemberRow = {
  id: string;
  household_id: string;
  user_id: string | null;
  role: HouseholdRole;
  status: HouseholdMemberStatus;
  invited_email: string | null;
  invited_at: string | null;
  joined_at: string | null;
  created_at: string;
}
export type HouseholdMemberInsert = Pick<HouseholdMemberRow, 'household_id'> &
  Partial<Pick<HouseholdMemberRow, 'user_id' | 'role' | 'status' | 'invited_email' | 'invited_at'>>;

export type PropertyRow = {
  id: string;
  household_id: string;
  address_line1: string;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  country: string;
  property_type: PropertyType | null;
  tenure: TenureType | null;
  year_built: number | null;
  bedrooms: number | null;
  epc_rating: string | null;
  epc_expiry: string | null;
  council_tax_band: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  cover_photo_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
export type PropertyInsert = Pick<PropertyRow, 'household_id' | 'address_line1'> &
  Partial<
    Omit<PropertyRow, 'id' | 'household_id' | 'address_line1' | 'created_at' | 'updated_at'>
  >;
export type PropertyUpdate = Partial<Omit<PropertyRow, 'id' | 'household_id' | 'created_at' | 'updated_at'>>;

export type RoomRow = {
  id: string;
  property_id: string;
  name: string;
  room_type: string | null;
  floor: string | null;
  photo_path: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
export type RoomInsert = Pick<RoomRow, 'property_id' | 'name'> &
  Partial<Omit<RoomRow, 'id' | 'property_id' | 'name' | 'created_at' | 'updated_at'>>;
export type RoomUpdate = Partial<Omit<RoomRow, 'id' | 'property_id' | 'created_at' | 'updated_at'>>;

export type AssetRow = {
  id: string;
  property_id: string;
  room_id: string | null;
  category: AssetCategory;
  name: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  retailer: string | null;
  warranty_expiry: string | null;
  warranty_provider: string | null;
  status: AssetStatus;
  notes: string | null;
  primary_photo_path: string | null;
  attributes: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
export type AssetInsert = Pick<AssetRow, 'property_id' | 'name'> &
  Partial<Omit<AssetRow, 'id' | 'property_id' | 'name' | 'created_at' | 'updated_at'>>;
export type AssetUpdate = Partial<Omit<AssetRow, 'id' | 'property_id' | 'created_at' | 'updated_at'>>;

export type DocumentRow = {
  id: string;
  property_id: string;
  asset_id: string | null;
  room_id: string | null;
  uploaded_by: string | null;
  document_type: DocumentType;
  file_path: string;
  file_type: string | null;
  original_filename: string | null;
  supplier: string | null;
  product_description: string | null;
  brand: string | null;
  model: string | null;
  amount: number | null;
  currency: string;
  document_date: string | null;
  expiry_date: string | null;
  ai_extracted: Record<string, unknown>;
  extraction_status: ExtractionStatus;
  extraction_error: string | null;
  ocr_text: string | null;
  created_at: string;
  updated_at: string;
}
export type DocumentInsert = Pick<DocumentRow, 'property_id' | 'file_path'> &
  Partial<Omit<DocumentRow, 'id' | 'property_id' | 'file_path' | 'created_at' | 'updated_at'>>;
export type DocumentUpdate = Partial<Omit<DocumentRow, 'id' | 'property_id' | 'created_at' | 'updated_at'>>;

export type DocumentChunkRow = {
  id: string;
  document_id: string;
  property_id: string;
  chunk_index: number;
  content: string;
  token_count: number | null;
  created_at: string;
}

export type ContractorRow = {
  id: string;
  property_id: string;
  name: string;
  trade: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  notes: string | null;
  rating: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
export type ContractorInsert = Pick<ContractorRow, 'property_id' | 'name'> &
  Partial<Omit<ContractorRow, 'id' | 'property_id' | 'name' | 'created_at' | 'updated_at'>>;

export type MaintenanceTaskRow = {
  id: string;
  property_id: string;
  asset_id: string | null;
  title: string;
  description: string | null;
  frequency_type: MaintenanceFrequency;
  frequency_days: number | null;
  next_due_date: string;
  last_completed_date: string | null;
  is_active: boolean;
  source: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
export type MaintenanceTaskInsert = Pick<MaintenanceTaskRow, 'property_id' | 'title' | 'next_due_date'> &
  Partial<
    Omit<MaintenanceTaskRow, 'id' | 'property_id' | 'title' | 'next_due_date' | 'created_at' | 'updated_at'>
  >;
export type MaintenanceTaskUpdate = Partial<
  Omit<MaintenanceTaskRow, 'id' | 'property_id' | 'created_at' | 'updated_at'>
>;

export type MaintenanceCompletionRow = {
  id: string;
  maintenance_task_id: string;
  property_id: string;
  completed_date: string;
  completed_by: string | null;
  contractor_id: string | null;
  cost: number | null;
  notes: string | null;
  document_id: string | null;
  created_at: string;
}
export type MaintenanceCompletionInsert = Pick<
  MaintenanceCompletionRow,
  'maintenance_task_id' | 'property_id'
> &
  Partial<
    Omit<MaintenanceCompletionRow, 'id' | 'maintenance_task_id' | 'property_id' | 'created_at'>
  >;

export type TimelineEventRow = {
  id: string;
  property_id: string;
  event_type: TimelineEventType;
  title: string;
  description: string | null;
  event_date: string;
  cost: number | null;
  related_asset_id: string | null;
  related_document_id: string | null;
  related_contractor_id: string | null;
  created_by: string | null;
  created_at: string;
}
export type TimelineEventInsert = Pick<TimelineEventRow, 'property_id' | 'event_type' | 'title' | 'event_date'> &
  Partial<
    Omit<TimelineEventRow, 'id' | 'property_id' | 'event_type' | 'title' | 'event_date' | 'created_at'>
  >;

export type HomeHealthScoreRow = {
  id: string;
  property_id: string;
  score: number;
  breakdown: Record<string, unknown>;
  computed_at: string;
}

export type AiConversationRow = {
  id: string;
  property_id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}
export type AiConversationInsert = Pick<AiConversationRow, 'property_id' | 'user_id'> &
  Partial<Pick<AiConversationRow, 'title'>>;

export type AiMessageRow = {
  id: string;
  conversation_id: string;
  role: AiMessageRole;
  content: string;
  citations: AiCitation[];
  created_at: string;
}
export type AiMessageInsert = Pick<AiMessageRow, 'conversation_id' | 'role' | 'content'> &
  Partial<Pick<AiMessageRow, 'citations'>>;

export type AiCitation = {
  type: 'asset' | 'document' | 'timeline_event';
  id: string;
  label: string;
}

export type SubscriptionRow = {
  id: string;
  household_id: string;
  revenuecat_customer_id: string | null;
  entitlement: string;
  status: SubscriptionStatus;
  product_id: string | null;
  current_period_end: string | null;
  updated_at: string;
  created_at: string;
}

export type PassportShareRow = {
  id: string;
  property_id: string;
  token: string;
  created_by: string | null;
  snapshot: Record<string, unknown> | null;
  expires_at: string;
  revoked_at: string | null;
  viewed_count: number;
  created_at: string;
}
export type PassportShareInsert = Pick<PassportShareRow, 'property_id' | 'expires_at'> &
  Partial<Pick<PassportShareRow, 'created_by'>>;
export type PassportShareUpdate = Partial<Pick<PassportShareRow, 'revoked_at' | 'viewed_count'>>;

export type NotificationLogRow = {
  id: string;
  user_id: string;
  maintenance_task_id: string | null;
  notification_type: string;
  sent_at: string;
  opened_at: string | null;
}

export type PushTokenRow = {
  id: string;
  user_id: string;
  token: string;
  created_at: string;
}
export type PushTokenInsert = Pick<PushTokenRow, 'user_id' | 'token'>;

// supabase-js's generic query builder resolves embed/join call chains using a
// `Relationships` array on every table; omitting it (even when we model no
// relationships) makes some call chains silently collapse to `never`.
type NoRelationships = { Relationships: [] };

export type Database = {
  public: {
    // supabase-js's Schema generic constraint requires all three of these —
    // omitting Views/Functions (even though we have none) makes the schema
    // fail its `extends GenericSchema` check and every query silently
    // degrades to `never`.
    Views: Record<string, never>;
    Functions: {
      compute_home_health_score: {
        Args: { _property_id: string };
        Returns: { score: number; breakdown: Record<string, unknown> }[];
      };
      match_document_chunks: {
        Args: { _property_id: string; _query_embedding: string; _match_count?: number };
        Returns: { document_id: string; content: string; similarity: number }[];
      };
      accept_household_invite: {
        Args: { _household_member_id: string };
        Returns: undefined;
      };
      is_premium: {
        Args: { _household_id: string };
        Returns: boolean;
      };
    };
    Tables: {
      profiles: { Row: ProfileRow; Insert: ProfileRow; Update: ProfileUpdate } & NoRelationships;
      households: { Row: HouseholdRow; Insert: HouseholdRow; Update: HouseholdUpdate } & NoRelationships;
      household_members: {
        Row: HouseholdMemberRow;
        Insert: HouseholdMemberInsert;
        Update: Partial<HouseholdMemberInsert>;
      } & NoRelationships;
      properties: { Row: PropertyRow; Insert: PropertyInsert; Update: PropertyUpdate } & NoRelationships;
      rooms: { Row: RoomRow; Insert: RoomInsert; Update: RoomUpdate } & NoRelationships;
      assets: { Row: AssetRow; Insert: AssetInsert; Update: AssetUpdate } & NoRelationships;
      documents: { Row: DocumentRow; Insert: DocumentInsert; Update: DocumentUpdate } & NoRelationships;
      document_chunks: {
        Row: DocumentChunkRow;
        Insert: DocumentChunkRow;
        Update: Partial<DocumentChunkRow>;
      } & NoRelationships;
      contractors: {
        Row: ContractorRow;
        Insert: ContractorInsert;
        Update: Partial<ContractorInsert>;
      } & NoRelationships;
      maintenance_tasks: {
        Row: MaintenanceTaskRow;
        Insert: MaintenanceTaskInsert;
        Update: MaintenanceTaskUpdate;
      } & NoRelationships;
      maintenance_completions: {
        Row: MaintenanceCompletionRow;
        Insert: MaintenanceCompletionInsert;
        Update: Partial<MaintenanceCompletionInsert>;
      } & NoRelationships;
      timeline_events: {
        Row: TimelineEventRow;
        Insert: TimelineEventInsert;
        Update: Partial<TimelineEventInsert>;
      } & NoRelationships;
      home_health_scores: {
        Row: HomeHealthScoreRow;
        Insert: HomeHealthScoreRow;
        Update: Partial<HomeHealthScoreRow>;
      } & NoRelationships;
      ai_conversations: {
        Row: AiConversationRow;
        Insert: AiConversationInsert;
        Update: Partial<AiConversationInsert>;
      } & NoRelationships;
      ai_messages: {
        Row: AiMessageRow;
        Insert: AiMessageInsert;
        Update: Partial<AiMessageInsert>;
      } & NoRelationships;
      subscriptions: {
        Row: SubscriptionRow;
        Insert: SubscriptionRow;
        Update: Partial<SubscriptionRow>;
      } & NoRelationships;
      passport_shares: {
        Row: PassportShareRow;
        Insert: PassportShareInsert;
        Update: PassportShareUpdate;
      } & NoRelationships;
      notification_log: {
        Row: NotificationLogRow;
        Insert: NotificationLogRow;
        Update: Partial<NotificationLogRow>;
      } & NoRelationships;
      push_tokens: {
        Row: PushTokenRow;
        Insert: PushTokenInsert;
        Update: Partial<PushTokenInsert>;
      } & NoRelationships;
    };
  };
}
