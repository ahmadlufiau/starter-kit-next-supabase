'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deleteTodo, updateTodo } from '@/lib/actions';
import { Todo } from '@/db/schema';
import { Trash2, Edit, Check, X } from 'lucide-react';

interface TodoListProps {
  todos: Todo[];
  onTodoUpdated: () => void;
  onTodoDeleted: () => void;
}

export function TodoList({ todos, onTodoUpdated, onTodoDeleted }: TodoListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [optimisticTodos, setOptimisticTodos] = useState<Todo[]>(todos);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Sync optimistic todos with props
  useEffect(() => {
    setOptimisticTodos(todos);
  }, [todos]);

  const handleEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditContent(todo.content);
  };

  const handleSave = async (todoId: string) => {
    // Optimistic update
    setOptimisticTodos(prev => 
      prev.map(todo => 
        todo.id === todoId 
          ? { ...todo, content: editContent, updated_at: new Date() }
          : todo
      )
    );
    
    setEditingId(null);
    setEditContent('');
    
    // Server update
    await updateTodo(todoId, editContent);
    onTodoUpdated(); // Refresh the todos list
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = async (todoId: string) => {
    // Optimistic update
    setDeletingIds(prev => new Set(prev).add(todoId));
    setOptimisticTodos(prev => prev.filter(todo => todo.id !== todoId));
    
    // Server update
    await deleteTodo(todoId);
    setDeletingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(todoId);
      return newSet;
    });
    onTodoDeleted(); // Refresh the todos list
  };

  if (optimisticTodos.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No todos yet. Create your first one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Your Todos</h2>
      {optimisticTodos.map((todo) => (
        <div
          key={todo.id}
          className={`flex items-center gap-3 p-4 border rounded-lg bg-card ${
            deletingIds.has(todo.id) ? 'opacity-50' : ''
          }`}
        >
          {editingId === todo.id ? (
            <>
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => handleSave(todo.id)}
                className="h-8 w-8 p-0"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <p className="flex-1">{todo.content}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEdit(todo)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(todo.id)}
                disabled={deletingIds.has(todo.id)}
                className="h-8 w-8 p-0 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ))}
    </div>
  );
} 