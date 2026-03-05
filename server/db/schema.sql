-- ALFRED Database Schema — Supabase Postgres + pgvector
-- Run this in Supabase SQL Editor

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Users ───────────────────────────────────────────────────────
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  nationality TEXT,            -- for visa checks
  onboarded BOOLEAN DEFAULT FALSE,
  cities_visited INTEGER DEFAULT 0,
  countries_visited INTEGER DEFAULT 0,
  trips_count INTEGER DEFAULT 0,
  cheapest_trip DECIMAL(10,2) DEFAULT 0,
  longest_trip_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Travel Profiles ─────────────────────────────────────────────
CREATE TABLE travel_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  archetype TEXT,              -- chill_explorer, aventurier, etc.
  budget_sensitivity INTEGER DEFAULT 50 CHECK (budget_sensitivity BETWEEN 0 AND 100),
  fatigue_tolerance INTEGER DEFAULT 50 CHECK (fatigue_tolerance BETWEEN 0 AND 100),
  nature_vs_city INTEGER DEFAULT 50 CHECK (nature_vs_city BETWEEN 0 AND 100),
  transport_tolerance INTEGER DEFAULT 50 CHECK (transport_tolerance BETWEEN 0 AND 100),
  comfort_level INTEGER DEFAULT 50 CHECK (comfort_level BETWEEN 0 AND 100),
  spontaneity INTEGER DEFAULT 50 CHECK (spontaneity BETWEEN 0 AND 100),
  weather_preference INTEGER DEFAULT 50 CHECK (weather_preference BETWEEN 0 AND 100),
  time_sensitivity INTEGER DEFAULT 50 CHECK (time_sensitivity BETWEEN 0 AND 100),
  culture_priority INTEGER DEFAULT 50 CHECK (culture_priority BETWEEN 0 AND 100),
  food_priority INTEGER DEFAULT 50 CHECK (food_priority BETWEEN 0 AND 100),
  nightlife_priority INTEGER DEFAULT 50 CHECK (nightlife_priority BETWEEN 0 AND 100),
  passions TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Sessions ────────────────────────────────────────────────────
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mood TEXT DEFAULT 'chill',
  consent_memory BOOLEAN DEFAULT FALSE,   -- GUARDRAIL: must ask
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- ─── Trips ───────────────────────────────────────────────────────
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id),
  query TEXT NOT NULL,          -- original user request
  origin TEXT,
  destination TEXT,
  departure_date DATE,
  return_date DATE,
  status TEXT DEFAULT 'planning',  -- planning, booked, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Plans (A/B/C) ──────────────────────────────────────────────
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  label CHAR(1) NOT NULL CHECK (label IN ('A', 'B', 'C')),
  title TEXT NOT NULL,
  summary TEXT,
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  feasibility TEXT DEFAULT 'ok' CHECK (feasibility IN ('ok', 'tight', 'impossible')),
  visa_risk TEXT DEFAULT 'none' CHECK (visa_risk IN ('none', 'check_required', 'visa_needed')),
  fatigue_estimate INTEGER CHECK (fatigue_estimate BETWEEN 0 AND 100),
  risk_level INTEGER CHECK (risk_level BETWEEN 0 AND 100),
  total_cost DECIMAL(10,2),
  currency TEXT DEFAULT 'MAD',
  justification TEXT,
  recommendation TEXT,         -- NULL if feasibility=ok
  metadata JSONB DEFAULT '{}', -- legs, accommodation, calculation_steps
  selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Chat Messages ───────────────────────────────────────────────
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Memory Facts (Key-Value) ────────────────────────────────────
CREATE TABLE memories_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  stability DECIMAL(3,2) DEFAULT 0.50 CHECK (stability BETWEEN 0 AND 1),
  source TEXT DEFAULT 'implicit' CHECK (source IN ('explicit', 'implicit')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, key)
);

-- ─── Memory Embeddings (pgvector) ────────────────────────────────
CREATE TABLE memories_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chunk TEXT NOT NULL,
  embedding vector(1536),      -- OpenAI/Gemini embedding dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Routines ────────────────────────────────────────────────────
CREATE TABLE routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  pattern JSONB NOT NULL,       -- structured pattern data
  confidence DECIMAL(3,2) DEFAULT 0.50 CHECK (confidence BETWEEN 0 AND 1),
  occurrences INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Feedback ────────────────────────────────────────────────────
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('up', 'down')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Events (Tracking / Learning) ───────────────────────────────
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id),
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────
CREATE INDEX idx_travel_profiles_user ON travel_profiles(user_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_trips_user ON trips(user_id);
CREATE INDEX idx_trips_session ON trips(session_id);
CREATE INDEX idx_plans_trip ON plans(trip_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_memories_facts_user ON memories_facts(user_id);
CREATE INDEX idx_memories_embeddings_user ON memories_embeddings(user_id);
CREATE INDEX idx_routines_user ON routines(user_id);
CREATE INDEX idx_feedback_user ON feedback(user_id);
CREATE INDEX idx_events_user ON events(user_id);
CREATE INDEX idx_events_session ON events(session_id);
CREATE INDEX idx_events_type ON events(event_type);

-- ─── Shared Trips ───────────────────────────────────────────────
CREATE TABLE shared_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id TEXT UNIQUE NOT NULL, -- e.g. "82HJ3"
  trip_data_json JSONB NOT NULL,
  creator_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  remix_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_shared_trips_share_id ON shared_trips(share_id);

-- ─── Trip Catalog (Phase 10) ─────────────────────────────────────
CREATE TABLE trip_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  transport_mode TEXT NOT NULL,
  travel_time_est DECIMAL(5,2),
  total_price_min DECIMAL(10,2),
  total_price_max DECIMAL(10,2),
  score INTEGER,
  why_bullets JSONB DEFAULT '[]',
  tradeoff TEXT,
  savings_tip TEXT,
  timeframe_tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_trip_catalog_orig_dest ON trip_catalog(origin, destination);

-- ─── Price Cache (Phase 11) ──────────────────────────────────────
CREATE TABLE price_cache (
  query_hash TEXT PRIMARY KEY,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'MAD',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Social Trip Layer (Phase 14) ────────────────────────────────
CREATE TABLE users_following (
  follower_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  followed_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_user_id, followed_user_id)
);

CREATE TABLE trip_posts (
  post_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  trip_json JSONB NOT NULL,
  caption TEXT,
  likes_count INTEGER DEFAULT 0,
  remix_count INTEGER DEFAULT 0,
  remixed_from_post_id UUID REFERENCES trip_posts(post_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE trip_likes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES trip_posts(post_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

-- ─── Trip of the Day (Phase 15) ──────────────────────────────────
CREATE TABLE daily_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  trip_id TEXT NOT NULL,
  region TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vector similarity index (IVFFlat for large datasets)
CREATE INDEX idx_memories_embedding_vector ON memories_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
