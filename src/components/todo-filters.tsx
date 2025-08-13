'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { type Priority, type Category, type Tag } from '@/db/schema';
import { getCategories, getTags } from '@/lib/actions';
import { Filter, X, CheckCircle, Circle, AlertCircle, Minus, Tag as TagIcon, Check } from 'lucide-react';

interface TodoFiltersProps {
  userId: string;
  onFiltersChange: (filters: {
    completed?: boolean;
    priority?: Priority;
    categoryId?: string;
    tagIds?: string[];
  }) => void;
}

export function TodoFilters({ userId, onFiltersChange }: TodoFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeFilters, setActiveFilters] = useState<{
    completed?: boolean;
    priority?: Priority;
    categoryId?: string;
    tagIds?: string[];
  }>({});

  useEffect(() => {
    loadCategories();
    loadTags();
  }, [userId]);

  const loadCategories = async () => {
    const result = await getCategories(userId);
    if (result.data) {
      setCategories(result.data);
    }
  };

  const loadTags = async () => {
    const result = await getTags(userId);
    if (result.data) {
      setTags(result.data);
    }
  };

  const updateFilters = (newFilters: typeof activeFilters) => {
    setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    updateFilters({});
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  const priorityOptions = [
    { value: 'high' as Priority, label: 'High Priority', icon: AlertCircle, color: 'text-red-600' },
    { value: 'medium' as Priority, label: 'Medium Priority', icon: Circle, color: 'text-yellow-600' },
    { value: 'low' as Priority, label: 'Low Priority', icon: Minus, color: 'text-green-600' },
  ];

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 ${hasActiveFilters ? 'bg-blue-50 border-blue-200' : ''}`}
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
        {hasActiveFilters && (
          <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {Object.keys(activeFilters).length}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm">Filter Todos</h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs h-6 px-2"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {/* Completion Status */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-2 block">
                  Status
                </label>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => updateFilters({ ...activeFilters, completed: false })}
                    className={`w-full flex items-center gap-2 px-2 py-1 text-left text-xs rounded hover:bg-gray-50 ${
                      activeFilters.completed === false ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    <Circle className="w-3 h-3" />
                    Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => updateFilters({ ...activeFilters, completed: true })}
                    className={`w-full flex items-center gap-2 px-2 py-1 text-left text-xs rounded hover:bg-gray-50 ${
                      activeFilters.completed === true ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    <CheckCircle className="w-3 h-3" />
                    Completed
                  </button>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-2 block">
                  Priority
                </label>
                <div className="space-y-1">
                  {priorityOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateFilters({ ...activeFilters, priority: option.value })}
                        className={`w-full flex items-center gap-2 px-2 py-1 text-left text-xs rounded hover:bg-gray-50 ${
                          activeFilters.priority === option.value ? 'bg-blue-50 text-blue-700' : option.color
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-2 block">
                    Category
                  </label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => updateFilters({ ...activeFilters, categoryId: category.id })}
                        className={`w-full flex items-center gap-2 px-2 py-1 text-left text-xs rounded hover:bg-gray-50 ${
                          activeFilters.categoryId === category.id ? 'bg-blue-50 text-blue-700' : ''
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-2 block">
                    Tags
                  </label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {tags.map((tag) => {
                      const isSelected = activeFilters.tagIds?.includes(tag.id) || false;
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            const currentTagIds = activeFilters.tagIds || [];
                            const newTagIds = isSelected
                              ? currentTagIds.filter(id => id !== tag.id)
                              : [...currentTagIds, tag.id];
                            updateFilters({
                              ...activeFilters,
                              tagIds: newTagIds.length > 0 ? newTagIds : undefined
                            });
                          }}
                          className={`w-full flex items-center gap-2 px-2 py-1 text-left text-xs rounded hover:bg-gray-50 ${
                            isSelected ? 'bg-blue-50 text-blue-700' : ''
                          }`}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <TagIcon className="w-3 h-3" />
                          {tag.name}
                          {isSelected && <Check className="w-3 h-3 ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}