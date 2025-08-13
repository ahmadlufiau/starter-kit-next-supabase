'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { deleteTodo, updateTodo, toggleTodoComplete } from '@/lib/actions';
import { type EnhancedTodo, type Priority } from '@/db/schema';
import { PrioritySelector, PriorityBadge } from '@/components/ui/priority-selector';
import { CategorySelector, CategoryBadge } from '@/components/ui/category-selector';
import { TagSelector, TagBadges } from '@/components/ui/tag-selector';
import { BulkOperations, TodoCheckbox } from '@/components/bulk-operations';
import { Trash2, Edit, Check, X, Calendar, Clock } from 'lucide-react';

interface TodoListProps {
  todos: EnhancedTodo[];
  onTodoUpdated: () => void;
  onTodoDeleted: () => void;
  userId: string;
}

export function TodoList({ todos, onTodoUpdated, onTodoDeleted, userId }: TodoListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editCategoryId, setEditCategoryId] = useState<string | undefined>();
  const [optimisticTodos, setOptimisticTodos] = useState<EnhancedTodo[]>(todos);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [selectedTodos, setSelectedTodos] = useState<string[]>([]);

  // Sync optimistic todos with props
  useEffect(() => {
    setOptimisticTodos(todos);
    // Clear selection when todos change
    setSelectedTodos([]);
  }, [todos]);

  const handleEdit = (todo: EnhancedTodo) => {
    setEditingId(todo.id);
    setEditContent(todo.content);
    setEditPriority(todo.priority as Priority);
    setEditCategoryId(todo.category_id || undefined);
  };

  const handleSave = async (todoId: string) => {
    // Optimistic update
    setOptimisticTodos(prev =>
      prev.map(todo =>
        todo.id === todoId
          ? {
              ...todo,
              content: editContent,
              priority: editPriority,
              category_id: editCategoryId || null,
              updated_at: new Date()
            }
          : todo
      )
    );
    
    setEditingId(null);
    setEditContent('');
    
    // Server update
    await updateTodo(todoId, {
      content: editContent,
      priority: editPriority,
      category_id: editCategoryId,
    });
    onTodoUpdated(); // Refresh the todos list
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditContent('');
    setEditPriority('medium');
    setEditCategoryId(undefined);
  };

  const handleToggleComplete = async (todoId: string, completed: boolean) => {
    // Optimistic update
    setTogglingIds(prev => new Set(prev).add(todoId));
    setOptimisticTodos(prev =>
      prev.map(todo =>
        todo.id === todoId
          ? { ...todo, completed, updated_at: new Date() }
          : todo
      )
    );
    
    // Server update
    await toggleTodoComplete(todoId, completed);
    setTogglingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(todoId);
      return newSet;
    });
    onTodoUpdated();
  };

  const handleTodoSelection = (todoId: string, selected: boolean) => {
    setSelectedTodos(prev =>
      selected
        ? [...prev, todoId]
        : prev.filter(id => id !== todoId)
    );
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

  const formatDueDate = (dueDate: Date) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, color: 'text-red-600' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'text-orange-600' };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', color: 'text-yellow-600' };
    } else {
      return { text: `Due in ${diffDays} days`, color: 'text-gray-600' };
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Todos</h2>
      </div>
      
      {/* Bulk Operations */}
      <BulkOperations
        todos={optimisticTodos}
        selectedTodos={selectedTodos}
        onSelectionChange={setSelectedTodos}
        onTodosUpdated={onTodoUpdated}
        userId={userId}
      />

      {optimisticTodos.map((todo) => (
        <div
          key={todo.id}
          className={`border rounded-lg bg-card transition-all ${
            deletingIds.has(todo.id) ? 'opacity-50' : ''
          } ${todo.completed ? 'bg-gray-50' : ''}`}
        >
          {editingId === todo.id ? (
            <div className="p-4 space-y-3">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full"
                placeholder="Todo content..."
              />
              <div className="flex items-center gap-2 flex-wrap">
                <PrioritySelector
                  value={editPriority}
                  onChange={setEditPriority}
                />
                <CategorySelector
                  userId={userId}
                  value={editCategoryId}
                  onChange={setEditCategoryId}
                />
              </div>
              <TagSelector
                userId={userId}
                todoId={todo.id}
                selectedTags={todo.tags || []}
                onChange={() => onTodoUpdated()} // Refresh todos when tags change
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSave(todo.id)}
                  disabled={!editContent.trim()}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 mt-1">
                  <TodoCheckbox
                    todoId={todo.id}
                    isSelected={selectedTodos.includes(todo.id)}
                    onSelectionChange={handleTodoSelection}
                  />
                  <button
                    onClick={() => handleToggleComplete(todo.id, !todo.completed)}
                    disabled={togglingIds.has(todo.id)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      todo.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {todo.completed && <Check className="w-3 h-3" />}
                  </button>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                    {todo.content}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <PriorityBadge priority={todo.priority as Priority} />
                    {todo.category && <CategoryBadge category={todo.category} />}
                    {todo.tags && todo.tags.length > 0 && <TagBadges tags={todo.tags} />}
                    {todo.due_date && (
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${formatDueDate(todo.due_date).color} bg-gray-100`}>
                        <Calendar className="w-3 h-3" />
                        {formatDueDate(todo.due_date).text}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    Created {new Date(todo.created_at).toLocaleDateString()}
                    {todo.updated_at !== todo.created_at && (
                      <span> • Updated {new Date(todo.updated_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
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
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 