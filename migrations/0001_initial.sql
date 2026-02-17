-- Traivel: Travel Itinerary App Schema

CREATE TABLE IF NOT EXISTS itineraries (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  origin_country TEXT,
  origin_city TEXT,
  start_date TEXT,
  end_date TEXT,
  duration_days INTEGER,
  pax INTEGER DEFAULT 1,
  place_of_stay TEXT,
  currency TEXT,
  language TEXT,
  culture_notes TEXT,
  religion_notes TEXT,
  weather_notes TEXT,
  ai_status TEXT NOT NULL DEFAULT 'ai_recommended' CHECK(ai_status IN ('ai_recommended', 'finalized', 'modified')),
  justification TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS days (
  id TEXT PRIMARY KEY,
  itinerary_id TEXT NOT NULL,
  day_number INTEGER NOT NULL,
  date TEXT,
  theme TEXT,
  ai_status TEXT NOT NULL DEFAULT 'ai_recommended' CHECK(ai_status IN ('ai_recommended', 'finalized', 'modified')),
  justification TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (itinerary_id) REFERENCES itineraries(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_days_itinerary ON days(itinerary_id, day_number);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  time_slot TEXT,
  estimated_cost REAL,
  category TEXT NOT NULL DEFAULT 'sightseeing' CHECK(category IN ('transport', 'accommodation', 'food', 'sightseeing', 'adventure', 'shopping', 'culture', 'relaxation', 'nightlife', 'other')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  reference_links TEXT DEFAULT '[]',
  ai_status TEXT NOT NULL DEFAULT 'ai_recommended' CHECK(ai_status IN ('ai_recommended', 'finalized', 'modified')),
  justification TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (day_id) REFERENCES days(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activities_day ON activities(day_id, sort_order);
