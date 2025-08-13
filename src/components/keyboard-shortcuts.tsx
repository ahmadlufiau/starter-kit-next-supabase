'use client'

import { useEffect, useCallback } from 'react';
import { type EnhancedTodo } from '@/db/schema';

interface KeyboardShortcutsProps {
  todos: EnhancedTodo[];
  onCreateTodo: () => void;
  onToggleFilters: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onFocusSearch?: () => void;
  selectedTodos: string[];
  onBulkComplete?: (completed: boolean) => void;
  onBulkDelete?: () => void;
}

export function KeyboardShortcuts({
  todos,
  onCreateTodo,
  onToggleFilters,
  onSelectAll,
  onClearSelection,
  onFocusSearch,
  selectedTodos,
  onBulkComplete,
  onBulkDelete,
}: KeyboardShortcutsProps) {
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      (event.target as HTMLElement)?.contentEditable === 'true'
    ) {
      return;
    }

    const { key, ctrlKey, metaKey, shiftKey } = event;
    const isModifierPressed = ctrlKey || metaKey;

    // Prevent default for our shortcuts
    const shouldPreventDefault = () => {
      event.preventDefault();
      event.stopPropagation();
    };

    switch (key.toLowerCase()) {
      // Create new todo (Ctrl/Cmd + N)
      case 'n':
        if (isModifierPressed) {
          shouldPreventDefault();
          onCreateTodo();
        }
        break;

      // Toggle filters (Ctrl/Cmd + F)
      case 'f':
        if (isModifierPressed) {
          shouldPreventDefault();
          onToggleFilters();
        }
        break;

      // Focus search (Ctrl/Cmd + K)
      case 'k':
        if (isModifierPressed && onFocusSearch) {
          shouldPreventDefault();
          onFocusSearch();
        }
        break;

      // Select all (Ctrl/Cmd + A)
      case 'a':
        if (isModifierPressed) {
          shouldPreventDefault();
          onSelectAll();
        }
        break;

      // Clear selection (Escape)
      case 'escape':
        if (selectedTodos.length > 0) {
          shouldPreventDefault();
          onClearSelection();
        }
        break;

      // Bulk complete selected (Ctrl/Cmd + Enter)
      case 'enter':
        if (isModifierPressed && selectedTodos.length > 0 && onBulkComplete) {
          shouldPreventDefault();
          onBulkComplete(true);
        }
        break;

      // Bulk incomplete selected (Ctrl/Cmd + Shift + Enter)
      case 'enter':
        if (isModifierPressed && shiftKey && selectedTodos.length > 0 && onBulkComplete) {
          shouldPreventDefault();
          onBulkComplete(false);
        }
        break;

      // Delete selected (Delete or Backspace)
      case 'delete':
      case 'backspace':
        if (selectedTodos.length > 0 && onBulkDelete) {
          shouldPreventDefault();
          onBulkDelete();
        }
        break;

      // Help (?)
      case '?':
        if (shiftKey) {
          shouldPreventDefault();
          showKeyboardShortcuts();
        }
        break;
    }
  }, [
    todos,
    onCreateTodo,
    onToggleFilters,
    onSelectAll,
    onClearSelection,
    onFocusSearch,
    selectedTodos,
    onBulkComplete,
    onBulkDelete,
  ]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const showKeyboardShortcuts = () => {
    const shortcuts = [
      { key: 'Ctrl/Cmd + N', description: 'Create new todo' },
      { key: 'Ctrl/Cmd + F', description: 'Toggle filters' },
      { key: 'Ctrl/Cmd + K', description: 'Focus search' },
      { key: 'Ctrl/Cmd + A', description: 'Select all todos' },
      { key: 'Escape', description: 'Clear selection' },
      { key: 'Ctrl/Cmd + Enter', description: 'Complete selected todos' },
      { key: 'Ctrl/Cmd + Shift + Enter', description: 'Mark selected as incomplete' },
      { key: 'Delete/Backspace', description: 'Delete selected todos' },
      { key: 'Shift + ?', description: 'Show this help' },
    ];

    const helpText = shortcuts
      .map(({ key, description }) => `${key}: ${description}`)
      .join('\n');

    alert(`Keyboard Shortcuts:\n\n${helpText}`);
  };

  // This component doesn't render anything visible
  return null;
}

// Hook for using keyboard shortcuts in components
export function useKeyboardShortcuts() {
  const focusCreateTodoInput = useCallback(() => {
    const createInput = document.querySelector('input[placeholder*="todo"]') as HTMLInputElement;
    if (createInput) {
      createInput.focus();
      createInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const focusSearchInput = useCallback(() => {
    const searchInput = document.querySelector('input[placeholder*="search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const toggleFiltersPanel = useCallback(() => {
    const filtersButton = document.querySelector('button:has([data-lucide="filter"])') as HTMLButtonElement;
    if (filtersButton) {
      filtersButton.click();
    }
  }, []);

  return {
    focusCreateTodoInput,
    focusSearchInput,
    toggleFiltersPanel,
  };
}

// Keyboard shortcuts indicator component
export function KeyboardShortcutsIndicator() {
  const handleShowShortcuts = () => {
    const shortcuts = [
      { key: 'Ctrl/Cmd + N', description: 'Create new todo' },
      { key: 'Ctrl/Cmd + F', description: 'Toggle filters' },
      { key: 'Ctrl/Cmd + K', description: 'Focus search' },
      { key: 'Ctrl/Cmd + A', description: 'Select all todos' },
      { key: 'Escape', description: 'Clear selection' },
      { key: 'Ctrl/Cmd + Enter', description: 'Complete selected todos' },
      { key: 'Ctrl/Cmd + Shift + Enter', description: 'Mark selected as incomplete' },
      { key: 'Delete/Backspace', description: 'Delete selected todos' },
      { key: 'Shift + ?', description: 'Show keyboard shortcuts' },
    ];

    const helpText = shortcuts
      .map(({ key, description }) => `${key}: ${description}`)
      .join('\n');

    alert(`Keyboard Shortcuts:\n\n${helpText}`);
  };

  return (
    <button
      onClick={handleShowShortcuts}
      className="fixed bottom-4 right-4 w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center text-sm font-medium hover:bg-gray-700 transition-colors z-50"
      title="Keyboard shortcuts (Shift + ?)"
    >
      ?
    </button>
  );
}