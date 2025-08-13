import { pgTable, text, timestamp, uuid, varchar, boolean, integer, primaryKey } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // This should be the user's ID from Supabase auth
  name: varchar('name', { length: 255 }).notNull(),
  avatar_url: text('avatar_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const todos = pgTable('todos', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  content: text('content').notNull(),
  completed: boolean('completed').default(false).notNull(),
  priority: varchar('priority', { length: 10 }).default('medium').notNull(),
  due_date: timestamp('due_date'),
  category_id: uuid('category_id').references(() => categories.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => profiles.id),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).default('#3B82F6').notNull(),
  sort_order: integer('sort_order').default(0).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => profiles.id),
  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 7 }).default('#6B7280').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const todoTags = pgTable('todo_tags', {
  todo_id: uuid('todo_id').notNull().references(() => todos.id, { onDelete: 'cascade' }),
  tag_id: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.todo_id, table.tag_id] }),
}));

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type TodoTag = typeof todoTags.$inferSelect;
export type NewTodoTag = typeof todoTags.$inferInsert;

// Enhanced Todo type with relations
export interface EnhancedTodo extends Todo {
  category?: Category;
  tags?: Tag[];
}

export type Priority = 'high' | 'medium' | 'low';