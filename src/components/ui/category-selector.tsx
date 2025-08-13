'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type Category } from '@/db/schema';
import { getCategories, createCategory } from '@/lib/actions';
import { ChevronDown, Plus, Tag, X } from 'lucide-react';

interface CategorySelectorProps {
  userId: string;
  value?: string;
  onChange: (categoryId: string | undefined) => void;
  disabled?: boolean;
}

const defaultColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

export function CategorySelector({ userId, value, onChange, disabled }: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(defaultColors[0]);
  const [loading, setLoading] = useState(false);

  const selectedCategory = categories.find(cat => cat.id === value);

  useEffect(() => {
    loadCategories();
  }, [userId]);

  const loadCategories = async () => {
    setLoading(true);
    const result = await getCategories(userId);
    if (result.data) {
      setCategories(result.data);
    }
    setLoading(false);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    const result = await createCategory(userId, newCategoryName.trim(), selectedColor);
    if (result.data) {
      setCategories(prev => [...prev, result.data]);
      onChange(result.data.id);
      setNewCategoryName('');
      setIsCreating(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || loading}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        {selectedCategory ? (
          <>
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedCategory.color }}
            />
            <span className="text-xs">{selectedCategory.name}</span>
          </>
        ) : (
          <>
            <Tag className="w-3 h-3" />
            <span className="text-xs">Category</span>
          </>
        )}
        <ChevronDown className="w-3 h-3" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false);
              setIsCreating(false);
              setNewCategoryName('');
            }}
          />
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-64 overflow-y-auto">
            {/* No Category Option */}
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100"
              onClick={() => {
                onChange(undefined);
                setIsOpen(false);
              }}
            >
              <X className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-600">No Category</span>
            </button>

            {/* Existing Categories */}
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
                onClick={() => {
                  onChange(category.id);
                  setIsOpen(false);
                }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-xs">{category.name}</span>
              </button>
            ))}

            {/* Create New Category */}
            {isCreating ? (
              <div className="p-3 border-t border-gray-100">
                <div className="space-y-2">
                  <Input
                    placeholder="Category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateCategory();
                      } else if (e.key === 'Escape') {
                        setIsCreating(false);
                        setNewCategoryName('');
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-1 flex-wrap">
                    {defaultColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-4 h-4 rounded-full border-2 ${
                          selectedColor === color ? 'border-gray-400' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateCategory}
                      disabled={!newCategoryName.trim()}
                      className="text-xs h-6"
                    >
                      Create
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsCreating(false);
                        setNewCategoryName('');
                      }}
                      className="text-xs h-6"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 border-t border-gray-100"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-600">Create Category</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function CategoryBadge({ category }: { category?: Category }) {
  if (!category) return null;

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: category.color }}
      />
      {category.name}
    </div>
  );
}