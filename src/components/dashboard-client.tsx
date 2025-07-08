'use client'

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { TodoList } from '@/components/todo-list';
import { CreateTodoForm } from '@/components/create-todo-form';
import { getTodos } from '@/lib/actions';
import { Todo } from '@/db/schema';

export function DashboardClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todosLoading, setTodosLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const loadTodos = useCallback(async () => {
    if (!user) return;
    
    setTodosLoading(true);
    const result = await getTodos(user.id);
    if (result?.data) {
      setTodos(result.data);
    }
    setTodosLoading(false);
  }, [user]);

  // Load todos when user is authenticated
  useEffect(() => {
    if (user) {
      loadTodos();
    }
  }, [user, loadTodos]);

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show dashboard if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Manage your todos here.
        </p>
      </div>

      <div className="space-y-6">
        <CreateTodoForm userId={user.id} onTodoCreated={loadTodos} />
        {todosLoading ? (
          <div className="text-center py-8">
            <p>Loading todos...</p>
          </div>
        ) : (
          <TodoList todos={todos} onTodoUpdated={loadTodos} onTodoDeleted={loadTodos} />
        )}
      </div>
    </div>
  );
} 