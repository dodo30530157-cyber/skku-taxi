-- Supabase Schema for SKKU Taxi App MVP

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL CHECK (email LIKE '%@skku.edu'),
  nickname TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Create posts table
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  departure TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  max_people INTEGER NOT NULL CHECK (max_people > 1 AND max_people <= 4),
  current_people INTEGER DEFAULT 1 NOT NULL,
  kakao_link TEXT NOT NULL,
  status TEXT DEFAULT '모집중' CHECK (status IN ('모집중', '완료')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone."
  ON public.posts FOR SELECT
  USING ( true );

CREATE POLICY "Authenticated users can insert posts."
  ON public.posts FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' );

CREATE POLICY "Creators can update their posts."
  ON public.posts FOR UPDATE
  USING ( auth.uid() = creator_id );

-- Create participants table
CREATE TABLE public.participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS for participants
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants are viewable by everyone."
  ON public.participants FOR SELECT
  USING ( true );

CREATE POLICY "Authenticated users can insert participants."
  ON public.participants FOR INSERT
  WITH CHECK ( auth.role() = 'authenticated' );
