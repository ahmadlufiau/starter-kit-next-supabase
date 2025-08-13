'use server'

import { db } from '@/db';
import { todos, profiles, categories, tags, todoTags, type Priority } from '@/db/schema';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { openai } from '@/lib/openai';



// Todo actions
export async function createTodo(
  userId: string, 
  content: string, 
  priority: Priority = 'medium',
  categoryId?: string,
  dueDate?: Date
) {
  try {
    await db.insert(todos).values({
      user_id: userId,
      content,
      priority,
      category_id: categoryId,
      due_date: dueDate,
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error creating todo:', error);
    return { error: 'Failed to create todo' };
  }
}

export async function getTodos(userId: string) {
  try {
    const userTodos = await db
      .select({
        id: todos.id,
        user_id: todos.user_id,
        content: todos.content,
        completed: todos.completed,
        priority: todos.priority,
        due_date: todos.due_date,
        category_id: todos.category_id,
        created_at: todos.created_at,
        updated_at: todos.updated_at,
        category: {
          id: categories.id,
          name: categories.name,
          color: categories.color,
        }
      })
      .from(todos)
      .leftJoin(categories, eq(todos.category_id, categories.id))
      .where(eq(todos.user_id, userId))
      .orderBy(desc(todos.created_at));

    // Get tags for each todo
    const todosWithTags = await Promise.all(
      userTodos.map(async (todo) => {
        const todoTagsResult = await db
          .select({
            id: tags.id,
            name: tags.name,
            color: tags.color,
            user_id: tags.user_id,
            created_at: tags.created_at,
          })
          .from(todoTags)
          .innerJoin(tags, eq(todoTags.tag_id, tags.id))
          .where(eq(todoTags.todo_id, todo.id));

        return {
          ...todo,
          tags: todoTagsResult,
        };
      })
    );

    return { data: todosWithTags };
  } catch (error) {
    console.error('Error fetching todos:', error);
    return { error: 'Failed to fetch todos' };
  }
}

export async function updateTodo(
  todoId: string, 
  updates: {
    content?: string;
    completed?: boolean;
    priority?: Priority;
    category_id?: string;
    due_date?: Date;
  }
) {
  try {
    await db
      .update(todos)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(todos.id, todoId));
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error updating todo:', error);
    return { error: 'Failed to update todo' };
  }
}

export async function toggleTodoComplete(todoId: string, completed: boolean) {
  try {
    await db
      .update(todos)
      .set({ completed, updated_at: new Date() })
      .where(eq(todos.id, todoId));
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error toggling todo completion:', error);
    return { error: 'Failed to toggle todo completion' };
  }
}

export async function deleteTodo(todoId: string) {
  try {
    await db.delete(todos).where(eq(todos.id, todoId));
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting todo:', error);
    return { error: 'Failed to delete todo' };
  }
}

// Category actions
export async function getCategories(userId: string) {
  try {
    const userCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.user_id, userId))
      .orderBy(categories.sort_order, categories.name);
    return { data: userCategories };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { error: 'Failed to fetch categories' };
  }
}

export async function createCategory(userId: string, name: string, color: string = '#3B82F6') {
  try {
    const result = await db.insert(categories).values({
      user_id: userId,
      name,
      color,
    }).returning();
    revalidatePath('/dashboard');
    return { data: result[0] };
  } catch (error) {
    console.error('Error creating category:', error);
    return { error: 'Failed to create category' };
  }
}

export async function updateCategory(categoryId: string, name: string, color: string) {
  try {
    await db
      .update(categories)
      .set({ name, color })
      .where(eq(categories.id, categoryId));
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error updating category:', error);
    return { error: 'Failed to update category' };
  }
}

export async function deleteCategory(categoryId: string) {
  try {
    // First, remove category from todos
    await db
      .update(todos)
      .set({ category_id: null })
      .where(eq(todos.category_id, categoryId));
    
    // Then delete the category
    await db.delete(categories).where(eq(categories.id, categoryId));
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { error: 'Failed to delete category' };
  }
}

// Tag actions
export async function getTags(userId: string) {
  try {
    const userTags = await db
      .select()
      .from(tags)
      .where(eq(tags.user_id, userId))
      .orderBy(tags.name);
    return { data: userTags };
  } catch (error) {
    console.error('Error fetching tags:', error);
    return { error: 'Failed to fetch tags' };
  }
}

export async function createTag(userId: string, name: string, color: string = '#6B7280') {
  try {
    const result = await db.insert(tags).values({
      user_id: userId,
      name,
      color,
    }).returning();
    revalidatePath('/dashboard');
    return { data: result[0] };
  } catch (error) {
    console.error('Error creating tag:', error);
    return { error: 'Failed to create tag' };
  }
}

export async function addTagToTodo(todoId: string, tagId: string) {
  try {
    await db.insert(todoTags).values({
      todo_id: todoId,
      tag_id: tagId,
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error adding tag to todo:', error);
    return { error: 'Failed to add tag to todo' };
  }
}

export async function removeTagFromTodo(todoId: string, tagId: string) {
  try {
    await db
      .delete(todoTags)
      .where(and(eq(todoTags.todo_id, todoId), eq(todoTags.tag_id, tagId)));
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error removing tag from todo:', error);
    return { error: 'Failed to remove tag from todo' };
  }
}

// Enhanced todo filtering
export async function getFilteredTodos(
  userId: string,
  filters: {
    completed?: boolean;
    priority?: Priority;
    categoryId?: string;
    tagIds?: string[];
  } = {}
) {
  try {
    const conditions = [eq(todos.user_id, userId)];
    
    if (filters.completed !== undefined) {
      conditions.push(eq(todos.completed, filters.completed));
    }
    
    if (filters.priority) {
      conditions.push(eq(todos.priority, filters.priority));
    }
    
    if (filters.categoryId) {
      conditions.push(eq(todos.category_id, filters.categoryId));
    }

    let result = await db
      .select({
        id: todos.id,
        user_id: todos.user_id,
        content: todos.content,
        completed: todos.completed,
        priority: todos.priority,
        due_date: todos.due_date,
        category_id: todos.category_id,
        created_at: todos.created_at,
        updated_at: todos.updated_at,
        category: {
          id: categories.id,
          name: categories.name,
          color: categories.color,
        }
      })
      .from(todos)
      .leftJoin(categories, eq(todos.category_id, categories.id))
      .where(and(...conditions))
      .orderBy(desc(todos.created_at));
    
    // If filtering by tags, filter the results
    if (filters.tagIds && filters.tagIds.length > 0) {
      const todoIds = result.map(todo => todo.id);
      if (todoIds.length === 0) return { data: [] };
      
      const taggedTodos = await db
        .select({ todo_id: todoTags.todo_id })
        .from(todoTags)
        .where(and(
          inArray(todoTags.todo_id, todoIds),
          inArray(todoTags.tag_id, filters.tagIds)
        ));
      
      const taggedTodoIds = new Set(taggedTodos.map(t => t.todo_id));
      result = result.filter(todo => taggedTodoIds.has(todo.id));
    }

    // Get tags for each todo
    const todosWithTags = await Promise.all(
      result.map(async (todo) => {
        const todoTagsResult = await db
          .select({
            id: tags.id,
            name: tags.name,
            color: tags.color,
            user_id: tags.user_id,
            created_at: tags.created_at,
          })
          .from(todoTags)
          .innerJoin(tags, eq(todoTags.tag_id, tags.id))
          .where(eq(todoTags.todo_id, todo.id));

        return {
          ...todo,
          tags: todoTagsResult,
        };
      })
    );

    return { data: todosWithTags };
  } catch (error) {
    console.error('Error fetching filtered todos:', error);
    return { error: 'Failed to fetch filtered todos' };
  }
}

// Profile actions
export async function getProfile(userId: string) {
  try {    
    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);    
    return { data: profile[0] };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { error: 'Failed to fetch profile' };
  }
}

export async function updateProfile(userId: string, name: string, avatarUrl?: string) {
  try {
    await db
      .insert(profiles)
      .values({
        id: userId,
        name,
        avatar_url: avatarUrl,
      })
      .onConflictDoUpdate({
        target: profiles.id,
        set: {
          name,
          avatar_url: avatarUrl,
          updated_at: new Date(),
        },
      });
    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { error: 'Failed to update profile' };
  }
}

export async function uploadAvatar(file: File, userId: string) {
  try {
    // Server-side file validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      return { error: 'File size must be less than 5MB' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { error: 'Please upload a valid image file (JPEG, PNG, or WebP)' };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    
    // Try admin client first, fallback to regular client
    let uploadClient = supabaseAdmin;
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      uploadClient = supabase;
    }
    
    const { error } = await uploadClient.storage
      .from('avatars')
      .upload(fileName, file);

    if (error) {
      console.error('Supabase upload error:', error);
      return { error: 'Failed to upload avatar to storage' };
    }
    
    const { data: { publicUrl } } = uploadClient.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return { data: publicUrl };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return { error: 'Failed to upload avatar' };
  }
}

export async function deleteAvatar(avatarUrl: string) {
  try {
    // Extract filename from URL
    const urlParts = avatarUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    // Try admin client first, fallback to regular client
    let deleteClient = supabaseAdmin;
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      deleteClient = supabase;
    }
    
    const { error } = await deleteClient.storage
      .from('avatars')
      .remove([fileName]);

    if (error) {
      console.error('Supabase delete error:', error);
      return { error: 'Failed to delete avatar from storage' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return { error: 'Failed to delete avatar' };
  }
}

// OpenAI Todo Suggestions
export async function generateTodoSuggestions(userInput: string) {
  try {
    const prompt = `Berdasarkan input pengguna ini: "${userInput}", buat 3-5 item todo yang spesifik dan dapat dilakukan untuk membantu mereka mencapai tujuan.

Format respons sebagai array JSON dengan string, setiap string berisi satu item todo. Buat todo yang spesifik, realistis, dan dapat dilakukan.

Contoh format:
["Selesaikan tugas spesifik 1", "Lakukan tugas spesifik 2", "Selesaikan tugas spesifik 3"]

Input pengguna: ${userInput}

PENTING: Hanya berikan respons dalam format JSON array, tidak ada teks tambahan.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'Kamu adalah asisten produktivitas yang membantu. Buat item todo yang spesifik dan dapat dilakukan berdasarkan input pengguna. SELALU berikan respons dalam format JSON array yang valid dengan string. JANGAN berikan teks tambahan selain JSON.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return { error: 'Tidak ada respons dari AI' };
    }

    // Clean the content to extract JSON
    let cleanedContent = content.trim();
    
    // Remove any markdown formatting if present
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/```json\n?/, '').replace(/```\n?/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/```\n?/, '').replace(/```\n?/, '');
    }
    
    // Try to find JSON array in the content
    const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanedContent = jsonMatch[0];
    }

    // Try to parse JSON from the cleaned content
    try {
      const suggestions = JSON.parse(cleanedContent);
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        // Validate that all items are strings
        const validSuggestions = suggestions.filter(item => typeof item === 'string' && item.trim().length > 0);
        if (validSuggestions.length > 0) {
          return { data: validSuggestions };
        }
      }
      return { error: 'Format respons AI tidak valid' };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw content:', content);
      console.error('Cleaned content:', cleanedContent);
      return { error: 'Gagal memparse saran AI' };
    }

  } catch (error) {
    console.error('Error generating todo suggestions:', error);
    return { error: 'Gagal menghasilkan saran todo' };
  }
}