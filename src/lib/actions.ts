'use server'

import { db } from '@/db';
import { todos, profiles } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { openai } from '@/lib/openai';



// Todo actions
export async function createTodo(userId: string, content: string) {
  try {
    await db.insert(todos).values({
      user_id: userId,
      content,
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
      .select()
      .from(todos)
      .where(eq(todos.user_id, userId))
      .orderBy(desc(todos.created_at));
    return { data: userTodos };
  } catch (error) {
    console.error('Error fetching todos:', error);
    return { error: 'Failed to fetch todos' };
  }
}

export async function updateTodo(todoId: string, content: string) {
  try {
    await db
      .update(todos)
      .set({ content, updated_at: new Date() })
      .where(eq(todos.id, todoId));
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error updating todo:', error);
    return { error: 'Failed to update todo' };
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