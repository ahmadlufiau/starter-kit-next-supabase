'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { type EnhancedTodo, type Priority } from '@/db/schema';
import { updateTodo, deleteTodo } from '@/lib/actions';
import { PrioritySelector } from '@/components/ui/priority-selector';
import { CategorySelector } from '@/components/ui/category-selector';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Edit, 
  X, 
  ChevronDown,
  CheckCircle,
  Circle
} from 'lucide-react';

interface BulkOperationsProps {
  todos: EnhancedTodo[];
  selectedTodos: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onTodosUpdated: () => void;
  userId: string;
}

export function BulkOperations({ 
  todos, 
  selectedTodos, 
  onSelectionChange, 
  onTodosUpdated,
  userId 
}: BulkOperationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bulkPriority, setBulkPriority] = useState<Priority>('medium');
  const [bulkCategoryId, setBulkCategoryId] = useState<string | undefined>();

  const selectedCount = selectedTodos.length;
  const allSelected = todos.length > 0 && selectedTodos.length === todos.length;
  const someSelected = selectedTodos.length > 0 && selectedTodos.length < todos.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(todos.map(todo => todo.id));
    }
  };

  const handleBulkComplete = async (completed: boolean) => {
    setIsLoading(true);
    try {
      await Promise.all(
        selectedTodos.map(todoId => 
          updateTodo(todoId, { completed })
        )
      );
      onTodosUpdated();
      onSelectionChange([]);
    } catch (error) {
      console.error('Error updating todos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCount} todo(s)?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all(
        selectedTodos.map(todoId => deleteTodo(todoId))
      );
      onTodosUpdated();
      onSelectionChange([]);
    } catch (error) {
      console.error('Error deleting todos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkUpdate = async () => {
    setIsLoading(true);
    try {
      await Promise.all(
        selectedTodos.map(todoId => 
          updateTodo(todoId, {
            priority: bulkPriority,
            category_id: bulkCategoryId,
          })
        )
      );
      onTodosUpdated();
      onSelectionChange([]);
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating todos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (todos.length === 0) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
      {/* Select All Checkbox */}
      <button
        onClick={handleSelectAll}
        className="flex items-center justify-center w-5 h-5 border-2 border-gray-300 rounded hover:border-blue-400 transition-colors"
      >
        {allSelected ? (
          <CheckSquare className="w-4 h-4 text-blue-600" />
        ) : someSelected ? (
          <Square className="w-4 h-4 text-blue-600 bg-blue-100" />
        ) : (
          <Square className="w-4 h-4 text-gray-400" />
        )}
      </button>

      <span className="text-sm text-gray-600">
        {selectedCount > 0 ? `${selectedCount} selected` : 'Select todos'}
      </span>

      {selectedCount > 0 && (
        <>
          {/* Quick Actions */}
          <div className="flex items-center gap-1 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkComplete(true)}
              disabled={isLoading}
              className="flex items-center gap-1 text-xs h-7"
            >
              <CheckCircle className="w-3 h-3" />
              Complete
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkComplete(false)}
              disabled={isLoading}
              className="flex items-center gap-1 text-xs h-7"
            >
              <Circle className="w-3 h-3" />
              Incomplete
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsOpen(!isOpen)}
              disabled={isLoading}
              className="flex items-center gap-1 text-xs h-7"
            >
              <Edit className="w-3 h-3" />
              Edit
              <ChevronDown className="w-3 h-3" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkDelete}
              disabled={isLoading}
              className="flex items-center gap-1 text-xs h-7 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSelectionChange([])}
              className="flex items-center gap-1 text-xs h-7"
            >
              <X className="w-3 h-3" />
              Clear
            </Button>
          </div>
        </>
      )}

      {/* Bulk Edit Panel */}
      {isOpen && selectedCount > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="font-medium text-sm">Bulk Edit {selectedCount} Todo(s)</h3>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <PrioritySelector
              value={bulkPriority}
              onChange={setBulkPriority}
              disabled={isLoading}
            />
            <CategorySelector
              userId={userId}
              value={bulkCategoryId}
              onChange={setBulkCategoryId}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleBulkUpdate}
              disabled={isLoading}
              className="text-xs"
            >
              {isLoading ? 'Updating...' : 'Apply Changes'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TodoCheckbox({ 
  todoId, 
  isSelected, 
  onSelectionChange 
}: { 
  todoId: string; 
  isSelected: boolean; 
  onSelectionChange: (todoId: string, selected: boolean) => void;
}) {
  return (
    <button
      onClick={() => onSelectionChange(todoId, !isSelected)}
      className="flex items-center justify-center w-4 h-4 border-2 border-gray-300 rounded hover:border-blue-400 transition-colors mr-2"
    >
      {isSelected ? (
        <CheckSquare className="w-3 h-3 text-blue-600" />
      ) : (
        <Square className="w-3 h-3 text-gray-400" />
      )}
    </button>
  );
}