'use client'

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { TodoList } from '@/components/todo-list';
import { CreateTodoForm } from '@/components/create-todo-form';
import { TodoFilters } from '@/components/todo-filters';
import { KeyboardShortcuts, KeyboardShortcutsIndicator, useKeyboardShortcuts } from '@/components/keyboard-shortcuts';
import { getTodos, getFilteredTodos } from '@/lib/actions';
import { type EnhancedTodo, type Priority } from '@/db/schema';

export function DashboardClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [todos, setTodos] = useState<EnhancedTodo[]>([]);
  const [todosLoading, setTodosLoading] = useState(true);
  const [filters, setFilters] = useState<{
    completed?: boolean;
    priority?: Priority;
    categoryId?: string;
    tagIds?: string[];
  }>({});
  const [selectedTodos, setSelectedTodos] = useState<string[]>([]);

  const { focusCreateTodoInput, toggleFiltersPanel } = useKeyboardShortcuts();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const loadTodos = useCallback(async () => {
    if (!user) return;
    
    setTodosLoading(true);
    const hasFilters = Object.keys(filters).length > 0;
    const result = hasFilters
      ? await getFilteredTodos(user.id, filters)
      : await getTodos(user.id);
    
    if (result?.data) {
      setTodos(result.data as EnhancedTodo[]);
    }
    setTodosLoading(false);
  }, [user, filters]);

  // Load todos when user is authenticated
  useEffect(() => {
    if (user) {
      loadTodos();
    }
  }, [user, loadTodos]);

  const handleSelectAll = () => {
    if (selectedTodos.length === todos.length) {
      setSelectedTodos([]);
    } else {
      setSelectedTodos(todos.map(todo => todo.id));
    }
  };

  const handleBulkComplete = async () => {
    // This will be handled by the BulkOperations component
  };

  const handleBulkDelete = async () => {
    // This will be handled by the BulkOperations component
  };

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
        
        <div className="flex items-center justify-between">
          <TodoFilters userId={user.id} onFiltersChange={setFilters} />
          <div className="text-sm text-gray-500">
            {todos.length} {todos.length === 1 ? 'todo' : 'todos'}
            {Object.keys(filters).length > 0 && ' (filtered)'}
            {selectedTodos.length > 0 && ` • ${selectedTodos.length} selected`}
          </div>
        </div>

        {todosLoading ? (
          <div className="text-center py-8">
            <p>Loading todos...</p>
          </div>
        ) : (
          <TodoList todos={todos} onTodoUpdated={loadTodos} onTodoDeleted={loadTodos} userId={user.id} />
        )}

        {/* Keyboard Shortcuts */}
        <KeyboardShortcuts
          todos={todos}
          onCreateTodo={focusCreateTodoInput}
          onToggleFilters={toggleFiltersPanel}
          onSelectAll={handleSelectAll}
          onClearSelection={() => setSelectedTodos([])}
          selectedTodos={selectedTodos}
          onBulkComplete={handleBulkComplete}
          onBulkDelete={handleBulkDelete}
        />

        {/* Keyboard Shortcuts Indicator */}
        <KeyboardShortcutsIndicator />
      </div>
    </div>
  );
} 