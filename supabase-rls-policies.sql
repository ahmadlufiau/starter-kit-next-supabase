-- Enable Row Level Security on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Profiles table policies (with proper error handling)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    CREATE POLICY "Users can view own profile" ON profiles
        FOR SELECT USING (auth.uid() = id);
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    CREATE POLICY "Users can insert own profile" ON profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    CREATE POLICY "Users can update own profile" ON profiles
        FOR UPDATE USING (auth.uid() = id);
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
    CREATE POLICY "Users can delete own profile" ON profiles
        FOR DELETE USING (auth.uid() = id);
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

-- Todos table policies (with proper error handling)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own todos" ON todos;
    CREATE POLICY "Users can view own todos" ON todos
        FOR SELECT USING (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can insert own todos" ON todos;
    CREATE POLICY "Users can insert own todos" ON todos
        FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can update own todos" ON todos;
    CREATE POLICY "Users can update own todos" ON todos
        FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can delete own todos" ON todos;
    CREATE POLICY "Users can delete own todos" ON todos
        FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

-- Create storage bucket for avatars (with error handling)
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', true);
EXCEPTION
    WHEN unique_violation THEN
        -- Bucket already exists, skip
        NULL;
END $$;

-- Storage policies for avatars bucket (with proper error handling)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
    CREATE POLICY "Users can upload own avatar" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'avatars' AND
            auth.uid()::text = (storage.foldername(name))[1]
        );
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own avatar" ON storage.objects;
    CREATE POLICY "Users can view own avatar" ON storage.objects
        FOR SELECT USING (
            bucket_id = 'avatars' AND
            auth.uid()::text = (storage.foldername(name))[1]
        );
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
    CREATE POLICY "Users can update own avatar" ON storage.objects
        FOR UPDATE USING (
            bucket_id = 'avatars' AND
            auth.uid()::text = (storage.foldername(name))[1]
        );
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
    CREATE POLICY "Users can delete own avatar" ON storage.objects
        FOR DELETE USING (
            bucket_id = 'avatars' AND
            auth.uid()::text = (storage.foldername(name))[1]
        );
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;