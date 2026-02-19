export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

export type AiStatus = 'ai_recommended' | 'finalized' | 'modified';

export type ActivityCategory =
  | 'transport'
  | 'accommodation'
  | 'food'
  | 'sightseeing'
  | 'adventure'
  | 'shopping'
  | 'culture'
  | 'relaxation'
  | 'nightlife'
  | 'other';

export interface ReferenceLink {
  url: string;
  title: string;
}

export interface ItineraryRow {
  id: string;
  title: string;
  destination_country: string;
  origin_country: string | null;
  origin_city: string | null;
  start_date: string | null;
  end_date: string | null;
  duration_days: number | null;
  pax: number;
  place_of_stay: string | null;
  currency: string | null;
  language: string | null;
  culture_notes: string | null;
  religion_notes: string | null;
  weather_notes: string | null;
  destination_city: string | null;
  origin_currency: string | null;
  origin_language: string | null;
  ai_status: AiStatus;
  justification: string | null;
  created_at: string;
  updated_at: string;
}

export interface DayRow {
  id: string;
  itinerary_id: string;
  day_number: number;
  date: string | null;
  theme: string | null;
  ai_status: AiStatus;
  justification: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityRow {
  id: string;
  day_id: string;
  name: string;
  description: string | null;
  time_slot: string | null;
  estimated_cost: number | null;
  category: ActivityCategory;
  sort_order: number;
  notes: string | null;
  reference_links: string;
  ai_status: AiStatus;
  justification: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity extends Omit<ActivityRow, 'reference_links'> {
  reference_links: ReferenceLink[];
}

export interface DayWithActivities extends DayRow {
  activities: Activity[];
}

export interface ItineraryWithDays extends ItineraryRow {
  days: DayWithActivities[];
}

export interface CreateItineraryInput {
  title: string;
  destination_country: string;
  origin_country?: string;
  origin_city?: string;
  start_date?: string;
  end_date?: string;
  duration_days?: number;
  pax?: number;
  place_of_stay?: string;
  currency?: string;
  language?: string;
  culture_notes?: string;
  religion_notes?: string;
  weather_notes?: string;
  destination_city?: string;
  origin_currency?: string;
  origin_language?: string;
  ai_status?: AiStatus;
  justification?: string;
}

export interface UpdateItineraryInput extends Partial<CreateItineraryInput> {}

export interface CreateDayInput {
  day_number: number;
  date?: string;
  theme?: string;
  ai_status?: AiStatus;
  justification?: string;
}

export interface UpdateDayInput extends Partial<CreateDayInput> {}

export interface CreateActivityInput {
  name: string;
  description?: string;
  time_slot?: string;
  estimated_cost?: number;
  category?: ActivityCategory;
  sort_order?: number;
  notes?: string;
  reference_links?: ReferenceLink[];
  ai_status?: AiStatus;
  justification?: string;
}

export interface UpdateActivityInput extends Partial<CreateActivityInput> {}

export interface CreateFullItineraryInput extends CreateItineraryInput {
  days: (CreateDayInput & {
    activities?: CreateActivityInput[];
  })[];
}
