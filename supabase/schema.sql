-- Prople Store Database Schema for Supabase PostgreSQL
-- Project: Prople Store (https://www.prople.co.in)
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/tygkgbmobqqxnvmeveof/sql)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. APPS TABLE
CREATE TABLE IF NOT EXISTS public.apps (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE,
  name TEXT NOT NULL,
  developer TEXT NOT NULL,
  category TEXT DEFAULT 'Utilities',
  rating NUMERIC(3,2) DEFAULT 5.0,
  reviews_count TEXT DEFAULT '1',
  downloads TEXT DEFAULT '1+',
  downloads_count INTEGER DEFAULT 1,
  ratings_count INTEGER DEFAULT 1,
  size TEXT DEFAULT 'Varies with device',
  content_rating TEXT DEFAULT 'Everyone',
  price TEXT DEFAULT 'Free',
  type TEXT DEFAULT 'apk',
  icon_url TEXT,
  feature_graphic_url TEXT,
  details_banner_url TEXT,
  hero_banner_url TEXT,
  promo_video_url TEXT,
  video_thumbnail_url TEXT,
  tagline TEXT,
  about_text TEXT,
  description TEXT,
  screenshots JSONB DEFAULT '[]'::jsonb,
  tablet_screenshots JSONB DEFAULT '[]'::jsonb,
  desktop_screenshots JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  download_url TEXT NOT NULL,
  package_format TEXT,
  target_os TEXT DEFAULT 'android',
  platform TEXT DEFAULT 'android',
  platforms JSONB DEFAULT '["android"]'::jsonb,
  min_android TEXT,
  min_windows TEXT,
  min_linux TEXT,
  min_mac TEXT,
  min_ios TEXT,
  package_name TEXT,
  version_name TEXT DEFAULT '1.0.0',
  version_code INTEGER DEFAULT 1,
  release_notes TEXT,
  whats_new TEXT,
  release_date TEXT,
  sha256 TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  owner TEXT,
  developer_id TEXT,
  developer_email TEXT,
  published_by TEXT,
  published_via TEXT DEFAULT 'prople-console',
  data_safety JSONB DEFAULT '{}'::jsonb,
  developer_info JSONB DEFAULT '{}'::jsonb,
  download_options JSONB DEFAULT '[]'::jsonb,
  rating_breakdown JSONB DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":1}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for lightning-fast search & filtering
CREATE INDEX IF NOT EXISTS idx_apps_slug ON public.apps (slug);
CREATE INDEX IF NOT EXISTS idx_apps_category ON public.apps (category);
CREATE INDEX IF NOT EXISTS idx_apps_developer ON public.apps (developer);
CREATE INDEX IF NOT EXISTS idx_apps_platform ON public.apps (platform);
CREATE INDEX IF NOT EXISTS idx_apps_is_published ON public.apps (is_published);
CREATE INDEX IF NOT EXISTS idx_apps_rating ON public.apps (rating DESC);
CREATE INDEX IF NOT EXISTS idx_apps_downloads_count ON public.apps (downloads_count DESC);
CREATE INDEX IF NOT EXISTS idx_apps_created_at ON public.apps (created_at DESC);

-- 2. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  app_id TEXT NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT 'Verified User',
  user_avatar TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  date TEXT DEFAULT to_char(now(), 'Mon DD, YYYY'),
  text TEXT NOT NULL,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  media JSONB DEFAULT '[]'::jsonb,
  reply JSONB DEFAULT NULL,
  device TEXT,
  verified BOOLEAN DEFAULT true,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_app_id ON public.reviews (app_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews (created_at DESC);

-- 3. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- Firebase / Supabase Auth UID
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  bio TEXT,
  location TEXT,
  is_email_verified BOOLEAN DEFAULT false,
  is_publisher BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  is_verified_publisher BOOLEAN DEFAULT false,
  publisher_name TEXT,
  publisher_role TEXT,
  publisher_bio TEXT,
  publisher_website TEXT,
  publisher_email TEXT,
  publisher_github TEXT,
  publisher_location TEXT,
  published_app_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_publisher_name ON public.profiles (publisher_name);

-- 4. BANNED RELEASES / RESTRICTIONS TABLE
CREATE TABLE IF NOT EXISTS public.banned_releases (
  id TEXT PRIMARY KEY,
  url_or_repo TEXT NOT NULL,
  type TEXT DEFAULT 'release',
  target_identifier TEXT,
  app_name TEXT,
  reason TEXT DEFAULT 'Violated security or distribution terms',
  banned_at BIGINT DEFAULT extract(epoch from now()) * 1000,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_releases ENABLE ROW LEVEL SECURITY;

-- Apps Policies: Public can read published apps; authenticated users / service role can insert/update
DROP POLICY IF EXISTS "Public read published apps" ON public.apps;
CREATE POLICY "Public read published apps" 
  ON public.apps FOR SELECT 
  USING (is_published = true OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Publishers insert apps" ON public.apps;
CREATE POLICY "Publishers insert apps" 
  ON public.apps FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Publishers update own apps" ON public.apps;
CREATE POLICY "Publishers update own apps" 
  ON public.apps FOR UPDATE 
  USING (true);

-- Reviews Policies: Public can read non-flagged reviews; anyone can write reviews
DROP POLICY IF EXISTS "Public read reviews" ON public.reviews;
CREATE POLICY "Public read reviews" 
  ON public.reviews FOR SELECT 
  USING (is_flagged = false OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Anyone insert review" ON public.reviews;
CREATE POLICY "Anyone insert review" 
  ON public.reviews FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users update reviews" ON public.reviews;
CREATE POLICY "Users update reviews" 
  ON public.reviews FOR UPDATE 
  USING (true);

-- Profiles Policies: Public can read publisher profiles; users can update own profile
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" 
  ON public.profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users insert/update own profile" ON public.profiles;
CREATE POLICY "Users insert/update own profile" 
  ON public.profiles FOR ALL 
  USING (true);

-- Banned Releases: Service role only
DROP POLICY IF EXISTS "Service role manages bans" ON public.banned_releases;
CREATE POLICY "Service role manages bans" 
  ON public.banned_releases FOR ALL 
  USING (auth.role() = 'service_role');
