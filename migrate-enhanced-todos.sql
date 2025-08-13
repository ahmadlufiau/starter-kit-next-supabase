-- Run this SQL script in your Supabase SQL Editor to apply the enhanced todo management features

-- Enhanced Todo Management Schema Migration

-- Add new columns to existing todos table
ALTER TABLE todos ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium' NOT NULL;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS category_id UUID;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6' NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#6B7280' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create todo_tags junction table
CREATE TABLE IF NOT EXISTS todo_tags (
  todo_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (todo_id, tag_id)
);

-- Add foreign key constraint for category_id (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_todos_category_id'
    ) THEN
        ALTER TABLE todos ADD CONSTRAINT fk_todos_category_id FOREIGN KEY (category_id) REFERENCES categories(id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_category_id ON todos(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_tags_todo_id ON todo_tags(todo_id);
CREATE INDEX IF NOT EXISTS idx_todo_tags_tag_id ON todo_tags(tag_id);

-- Insert some default categories for existing users (only if they don't exist)
INSERT INTO categories (user_id, name, color, sort_order)
SELECT DISTINCT user_id, 'Personal', '#3B82F6', 1 FROM todos
WHERE NOT EXISTS (
    SELECT 1 FROM categories 
    WHERE categories.user_id = todos.user_id 
    AND categories.name = 'Personal'
);

INSERT INTO categories (user_id, name, color, sort_order)
SELECT DISTINCT user_id, 'Work', '#10B981', 2 FROM todos
WHERE NOT EXISTS (
    SELECT 1 FROM categories 
    WHERE categories.user_id = todos.user_id 
    AND categories.name = 'Work'
);

INSERT INTO categories (user_id, name, color, sort_order)
SELECT DISTINCT user_id, 'Shopping', '#F59E0B', 3 FROM todos
WHERE NOT EXISTS (
    SELECT 1 FROM categories 
    WHERE categories.user_id = todos.user_id 
    AND categories.name = 'Shopping'
);

-- Update RLS policies for new tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_tags ENABLE ROW LEVEL SECURITY;

-- Categories policies (with proper error handling)
DO $$
BEGIN
    -- Drop existing policies if they exist and recreate them
    DROP POLICY IF EXISTS "Users can view own categories" ON categories;
    CREATE POLICY "Users can view own categories" ON categories
        FOR SELECT USING (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_table THEN
        -- Table doesn't exist yet, skip
        NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
    CREATE POLICY "Users can insert own categories" ON categories
        FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can update own categories" ON categories;
    CREATE POLICY "Users can update own categories" ON categories
        FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
    CREATE POLICY "Users can delete own categories" ON categories
        FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

-- Tags policies (with proper error handling)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own tags" ON tags;
    CREATE POLICY "Users can view own tags" ON tags
        FOR SELECT USING (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can insert own tags" ON tags;
    CREATE POLICY "Users can insert own tags" ON tags
        FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can update own tags" ON tags;
    CREATE POLICY "Users can update own tags" ON tags
        FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can delete own tags" ON tags;
    CREATE POLICY "Users can delete own tags" ON tags
        FOR DELETE USING (auth.uid() = user_id);
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

-- Todo tags policies (with proper error handling)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own todo tags" ON todo_tags;
    CREATE POLICY "Users can view own todo tags" ON todo_tags
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM todos
                WHERE todos.id = todo_tags.todo_id
                AND todos.user_id = auth.uid()
            )
        );
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can insert own todo tags" ON todo_tags;
    CREATE POLICY "Users can insert own todo tags" ON todo_tags
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM todos
                WHERE todos.id = todo_tags.todo_id
                AND todos.user_id = auth.uid()
            )
        );
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can delete own todo tags" ON todo_tags;
    CREATE POLICY "Users can delete own todo tags" ON todo_tags
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM todos
                WHERE todos.id = todo_tags.todo_id
                AND todos.user_id = auth.uid()
            )
        );
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;