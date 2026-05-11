// API types mirroring backend Pydantic schemas (app/schemas/*).

export type CompanySize = 'startup' | 'sme' | 'corporation' | 'public_institution';
export type EventStatus = 'draft' | 'active' | 'closed' | 'cancelled';
export type ActivityType =
    | 'note'
    | 'meeting'
    | 'email'
    | 'phone_call'
    | 'follow_up'
    | 'task';
export type StageOutcome = 'open' | 'won' | 'lost';
export type RelationshipStatus =
    | 'draft'
    | 'active'
    | 'completed'
    | 'cancelled'
    | 'on_hold';
export type TagCategory = 'technology' | 'interest' | 'relationship' | 'collaboration';

export interface PageMeta {
    total: number;
    page: number;
    page_size: number;
    pages: number;
}

export interface Page<T> {
    items: T[];
    meta: PageMeta;
}

export interface Industry {
    id: number;
    name: string;
}

export interface Role {
    id: number;
    name: string;
}

export interface Tag {
    id: number;
    name: string;
    category: TagCategory;
}

export interface PipelineStage {
    id: number;
    name: string;
    order_number: number;
    success_probability: number;
    outcome: StageOutcome;
}

export interface RelationshipType {
    id: number;
    name: string;
    description: string | null;
}

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean;
    role: Role | null;
}

export interface Company {
    id: number;
    name: string;
    legal_name: string | null;
    website: string | null;
    nip: string | null;
    description: string | null;
    industry_id: number | null;
    company_size: CompanySize | null;
    country: string | null;
    city: string | null;
    created_at: string;
    updated_at: string;
    industry: Industry | null;
    tags: Tag[];
    is_partner: boolean;
    last_contact_at: string | null;
}

export interface CompanyCreate {
    name: string;
    legal_name?: string | null;
    website?: string | null;
    nip?: string | null;
    description?: string | null;
    industry_id?: number | null;
    company_size?: CompanySize | null;
    country?: string | null;
    city?: string | null;
    tag_ids?: number[];
}

export type CompanyUpdate = Partial<CompanyCreate>;

export interface Contact {
    id: number;
    company_id: number;
    first_name: string;
    last_name: string;
    position: string | null;
    email: string | null;
    phone: string | null;
    linkedin_url: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface ContactCreate {
    company_id: number;
    first_name: string;
    last_name: string;
    position?: string | null;
    email?: string | null;
    phone?: string | null;
    linkedin_url?: string | null;
    notes?: string | null;
}

export interface Event {
    id: number;
    name: string;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    owner_user_id: number | null;
    target_budget: string | null;
    target_partners_count: number | null;
    status: EventStatus;
    created_at: string;
    updated_at: string;
    owner: User | null;
    tags: Tag[];
}

export interface EventCreate {
    name: string;
    description?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    owner_user_id?: number | null;
    target_budget?: string | null;
    target_partners_count?: number | null;
    status?: EventStatus;
    tag_ids?: number[];
}

export type EventUpdate = Partial<EventCreate>;

export interface EventKpi {
    event_id: number;
    partners_count: number;
    total_value: string;
    pipeline_count: number;
    target_partners_count: number | null;
    target_budget: string | null;
    conversion_rate: number | null;
    avg_partner_value: string | null;
    avg_close_days: number | null;
    progress_partners_pct: number | null;
    progress_budget_pct: number | null;
}

export interface PipelineEntry {
    id: number;
    event_id: number;
    company_id: number;
    stage_id: number;
    owner_user_id: number | null;
    contact_person_id: number | null;
    expected_amount: string | null;
    agreed_amount: string | null;
    probability_override: number | null;
    notes: string | null;
    first_contact_at: string | null;
    offer_sent_at: string | null;
    closed_at: string | null;
    rejection_reason: string | null;
    created_at: string;
    updated_at: string;
    stage: PipelineStage | null;
    company: Company | null;
    owner: User | null;
}

export interface PipelineEntryCreate {
    event_id: number;
    company_id: number;
    stage_id?: number | null;
    owner_user_id?: number | null;
    contact_person_id?: number | null;
    expected_amount?: string | null;
    notes?: string | null;
}

export interface PipelineMoveRequest {
    stage_id: number;
    agreed_amount?: string | null;
    rejection_reason?: string | null;
}

export interface Activity {
    id: number;
    activity_type: ActivityType;
    subject: string;
    description: string | null;
    activity_date: string | null;
    due_date: string | null;
    completed_at: string | null;
    company_id: number | null;
    contact_id: number | null;
    event_id: number | null;
    pipeline_entry_id: number | null;
    assigned_user_id: number | null;
    created_at: string;
}

export interface CompanyRelationship {
    id: number;
    company_id: number;
    event_id: number | null;
    pipeline_entry_id: number | null;
    relationship_type_id: number;
    package_name: string | null;
    amount_net: string | null;
    amount_gross: string | null;
    currency: string;
    start_date: string | null;
    end_date: string | null;
    contract_signed_at: string | null;
    owner_user_id: number | null;
    status: RelationshipStatus;
    notes: string | null;
    created_at: string;
    updated_at: string;
    relationship_type: RelationshipType | null;
}

// Dashboards
export interface EventOwnerBrief {
    user_id: number;
    first_name: string;
    last_name: string;
    initials: string;
}

export interface RecentActivityBrief {
    id: number;
    activity_type: ActivityType;
    subject: string;
    activity_date: string | null;
    company_id: number | null;
    company_name: string | null;
    event_id: number | null;
    event_name: string | null;
}

export interface CoordinatorDashboard {
    event_id: number;
    event_name: string;
    kpi_partners_count: number;
    kpi_total_value: string;
    kpi_pipeline_count: number;
    kpi_progress_partners_pct: number | null;
    kpi_progress_budget_pct: number | null;
    upcoming_tasks: RecentActivityBrief[];
    recent_activities: RecentActivityBrief[];
}

export interface PromotionEventCard {
    id: number;
    name: string;
    start_date: string | null;
    end_date: string | null;
    status: EventStatus;
    partners_count: number;
    target_partners_count: number | null;
    progress_pct: number;
}

export interface PromotionDashboard {
    active_events: PromotionEventCard[];
}

export interface RelationshipManagerDashboard {
    user_id: number;
    overdue_activities: RecentActivityBrief[];
    my_recent_activities: RecentActivityBrief[];
    my_pipeline_count: number;
    my_won_count: number;
}

// Reports
export interface ReportTotals {
    pipeline_count: number;
    partners_count: number;
    total_value: string;
    conversion_rate: number | null;
}

export interface ReportNewSponsor {
    company_id: number;
    company_name: string;
    event_id: number;
    event_name: string;
    agreed_amount: string | null;
    closed_at: string | null;
}

export interface ReportEventRow {
    event_id: number;
    event_name: string;
    status: EventStatus;
    start_date: string | null;
    end_date: string | null;
    partners_count: number;
    pipeline_count: number;
    total_value: string;
    target_partners_count: number | null;
    target_budget: string | null;
}

export interface ReportTopCompany {
    company_id: number;
    company_name: string;
    total_value: string;
    partnerships_count: number;
}

export interface ReportsResponse {
    totals: ReportTotals;
    new_sponsors: ReportNewSponsor[];
    events: ReportEventRow[];
    top_companies: ReportTopCompany[];
}
