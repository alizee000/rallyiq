-- Create tournaments table
CREATE TABLE public.iqrally_tournaments (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    players JSONB DEFAULT '[]'::jsonb,
    playo_info JSONB DEFAULT '{}'::jsonb,
    playo_url TEXT
);

-- Create profiles table
CREATE TABLE public.iqrally_profiles (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT,
    stats JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create matches table
CREATE TABLE public.iqrally_matches (
    id UUID PRIMARY KEY,
    tournament_id UUID REFERENCES public.iqrally_tournaments(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    state JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.iqrally_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iqrally_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iqrally_matches ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (Allows read/write for everyone since we don't have authentication yet)
CREATE POLICY "Allow public all operations on tournaments" ON public.iqrally_tournaments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all operations on profiles" ON public.iqrally_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all operations on matches" ON public.iqrally_matches FOR ALL USING (true) WITH CHECK (true);
