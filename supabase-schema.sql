-- ==============================================================================
-- AgriVicta BioLoop AI: Complete PostgreSQL Database Schema & RLS Policies
-- Execute this entire script in Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- ==============================================================================

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.resources (
  id TEXT PRIMARY KEY,
  material_name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'kg',
  condition TEXT NOT NULL,
  location TEXT NOT NULL,
  intended_use TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'matched', 'collected', 'reused')) DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  photo_name TEXT,
  photo_preview TEXT,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.resource_requests (
  id TEXT PRIMARY KEY,
  requester_name TEXT NOT NULL,
  requested_category TEXT NOT NULL,
  material_needed TEXT NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'kg',
  location TEXT NOT NULL,
  distance_km NUMERIC,
  intended_use TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'matched', 'fulfilled')) DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  is_demo BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.exchanges (
  id TEXT PRIMARY KEY,
  resource_id TEXT REFERENCES public.resources(id) ON DELETE CASCADE,
  request_id TEXT REFERENCES public.resource_requests(id) ON DELETE CASCADE,
  resource_name TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  status TEXT NOT NULL CHECK (status IN ('matched', 'collected', 'confirmed_reused')) DEFAULT 'matched',
  quantity_collected NUMERIC NOT NULL DEFAULT 0,
  quantity_reused NUMERIC NOT NULL DEFAULT 0,
  collected_at TIMESTAMPTZ,
  reuse_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public.cost_estimates (
  id TEXT PRIMARY KEY,
  exchange_id TEXT REFERENCES public.exchanges(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  external_total NUMERIC NOT NULL DEFAULT 0,
  local_total NUMERIC NOT NULL DEFAULT 0,
  estimated_savings NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Indexes for Fast Filtering & Searching
CREATE INDEX IF NOT EXISTS idx_resources_status ON public.resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.resource_requests(status);
CREATE INDEX IF NOT EXISTS idx_exchanges_status ON public.exchanges(status);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_estimates ENABLE ROW LEVEL SECURITY;

-- 4. RLS Access Policies for Community Hackathon MVP (Anonymous & Authenticated)
-- Drop old policies if re-running
DROP POLICY IF EXISTS "Public read resources" ON public.resources;
DROP POLICY IF EXISTS "Public insert resources" ON public.resources;
DROP POLICY IF EXISTS "Public update resources" ON public.resources;
DROP POLICY IF EXISTS "Public delete resources" ON public.resources;

CREATE POLICY "Public read resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Public insert resources" ON public.resources FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update resources" ON public.resources FOR UPDATE USING (true);
CREATE POLICY "Public delete resources" ON public.resources FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read resource_requests" ON public.resource_requests;
DROP POLICY IF EXISTS "Public insert resource_requests" ON public.resource_requests;
DROP POLICY IF EXISTS "Public update resource_requests" ON public.resource_requests;
DROP POLICY IF EXISTS "Public delete resource_requests" ON public.resource_requests;

CREATE POLICY "Public read resource_requests" ON public.resource_requests FOR SELECT USING (true);
CREATE POLICY "Public insert resource_requests" ON public.resource_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update resource_requests" ON public.resource_requests FOR UPDATE USING (true);
CREATE POLICY "Public delete resource_requests" ON public.resource_requests FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read exchanges" ON public.exchanges;
DROP POLICY IF EXISTS "Public insert exchanges" ON public.exchanges;
DROP POLICY IF EXISTS "Public update exchanges" ON public.exchanges;
DROP POLICY IF EXISTS "Public delete exchanges" ON public.exchanges;

CREATE POLICY "Public read exchanges" ON public.exchanges FOR SELECT USING (true);
CREATE POLICY "Public insert exchanges" ON public.exchanges FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update exchanges" ON public.exchanges FOR UPDATE USING (true);
CREATE POLICY "Public delete exchanges" ON public.exchanges FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public read cost_estimates" ON public.cost_estimates;
DROP POLICY IF EXISTS "Public insert cost_estimates" ON public.cost_estimates;
DROP POLICY IF EXISTS "Public update cost_estimates" ON public.cost_estimates;
DROP POLICY IF EXISTS "Public delete cost_estimates" ON public.cost_estimates;

CREATE POLICY "Public read cost_estimates" ON public.cost_estimates FOR SELECT USING (true);
CREATE POLICY "Public insert cost_estimates" ON public.cost_estimates FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update cost_estimates" ON public.cost_estimates FOR UPDATE USING (true);
CREATE POLICY "Public delete cost_estimates" ON public.cost_estimates FOR DELETE USING (true);

-- 5. Seed Initial Baseline Demonstration Records (Idempotent: only inserts if table is empty)
INSERT INTO public.resources (id, material_name, category, quantity, unit, condition, location, intended_use, status, created_at, is_demo)
SELECT * FROM (VALUES
  ('res-demo-01', 'Paddy straw', 'Crop residue', 240, 'kg', 'Dry and baled', 'Nashik, Maharashtra', 'Mushroom substrate', 'available', '2026-10-12T10:00:00Z'::timestamptz, true),
  ('res-demo-02', 'Dry leaf litter', 'Organic matter', 85, 'kg', 'Dry, loose leaves', 'Igatpuri, Maharashtra', 'Compost carbon layer', 'available', '2026-10-13T09:30:00Z'::timestamptz, true),
  ('res-demo-03', 'Coconut husk & coir', 'Horticultural residue', 120, 'kg', 'Clean and washed', 'Sinnar, Maharashtra', 'Mulch or coir', 'available', '2026-10-13T14:15:00Z'::timestamptz, true),
  ('res-demo-04', 'Sugarcane bagasse', 'Crop residue', 350, 'kg', 'Sun-dried, fibrous', 'Niphad, Maharashtra', 'Composting & mulch', 'available', '2026-10-14T08:00:00Z'::timestamptz, true)
) AS v(id, material_name, category, quantity, unit, condition, location, intended_use, status, created_at, is_demo)
WHERE NOT EXISTS (SELECT 1 FROM public.resources LIMIT 1);

INSERT INTO public.resource_requests (id, requester_name, requested_category, material_needed, quantity, unit, location, distance_km, intended_use, status, created_at, is_demo)
SELECT * FROM (VALUES
  ('req-demo-01', 'Sahyadri Mushroom Growers', 'Crop residue', 'Paddy straw', 250, 'kg', 'Nashik (Rural)', 8, 'Mushroom substrate', 'open', '2026-10-12T11:00:00Z'::timestamptz, true),
  ('req-demo-02', 'GreenGrow Organic Farm', 'Organic matter', 'Dry leaves or mulch', 100, 'kg', 'Igatpuri Valley', 14, 'Compost carbon layer', 'open', '2026-10-13T12:00:00Z'::timestamptz, true),
  ('req-demo-03', 'Godavari Horti Nursery', 'Horticultural residue', 'Coconut husk / coir', 150, 'kg', 'Sinnar Agro Hub', 21, 'Mulch or coir', 'open', '2026-10-13T15:30:00Z'::timestamptz, true)
) AS v(id, requester_name, requested_category, material_needed, quantity, unit, location, distance_km, intended_use, status, created_at, is_demo)
WHERE NOT EXISTS (SELECT 1 FROM public.resource_requests LIMIT 1);

INSERT INTO public.exchanges (id, resource_id, request_id, resource_name, requester_name, quantity, unit, status, quantity_collected, quantity_reused, collected_at, reuse_confirmed_at, created_at, notes)
SELECT * FROM (VALUES
  ('exc-demo-01', 'res-demo-01', 'req-demo-01', 'Wheat straw bundle (Demo)', 'Niphad Dairy Cooperative', 400, 'kg', 'confirmed_reused', 400, 400, '2026-10-07T14:00:00Z'::timestamptz, '2026-10-09T11:30:00Z'::timestamptz, '2026-10-06T10:00:00Z'::timestamptz, 'Exchanged for cattle bedding; fully utilised and confirmed by receiving dairy farm.'),
  ('exc-demo-02', 'res-demo-02', 'req-demo-02', 'Mustard stalk biomass (Demo)', 'Panchavati Composters', 300, 'kg', 'collected', 300, 0, '2026-10-14T16:00:00Z'::timestamptz, NULL, '2026-10-13T16:00:00Z'::timestamptz, 'Collected and in aerated compost heap; reuse confirmation pending compost maturation.')
) AS v(id, resource_id, request_id, resource_name, requester_name, quantity, unit, status, quantity_collected, quantity_reused, collected_at, reuse_confirmed_at, created_at, notes)
WHERE NOT EXISTS (SELECT 1 FROM public.exchanges LIMIT 1);

INSERT INTO public.cost_estimates (id, exchange_id, title, external_total, local_total, estimated_savings, created_at)
SELECT * FROM (VALUES
  ('est-demo-01', 'exc-demo-01', 'Wheat straw dairy bedding exchange', 6500, 2100, 4400, '2026-10-07T15:00:00Z'::timestamptz)
) AS v(id, exchange_id, title, external_total, local_total, estimated_savings, created_at)
WHERE NOT EXISTS (SELECT 1 FROM public.cost_estimates LIMIT 1);
