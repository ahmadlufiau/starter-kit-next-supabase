'use client'

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type Tag } from '@/db/schema';
import { getTags, createTag, addTagToTodo, removeTagFromTodo } from '@/lib/actions';
import { ChevronDown, Plus, Tag as TagIcon, X } from 'lucide-react';

interface TagSelectorProps {
  userId: string;
  todoId?: string;
  selectedTags?: Tag[];
  onChange?: (tags: Tag[]) => void;
  disabled?: boolean;
}

const defaultColors = [
  '#6B7280', // Gray
  '#EF4444', // Red
  '#F59E0B', // Yellow
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
];

export function TagSelector({ userId, todoId, selectedTags = [], onChange, disabled }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(defaultColors[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTags();
  }, [userId]);

  const loadTags = async () => {
    setLoading(true);
    const result = await getTags(userId);
    if (result.data) {
      setAllTags(result.data);
    }
    setLoading(false);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    const result = await createTag(userId, newTagName.trim(), selectedColor);
    if (result.data) {
      setAllTags(prev => [...prev, result.data]);
      setNewTagName('');
      setIsCreating(false);
    }
  };

  const handleTagToggle = async (tag: Tag) => {
    const isSelected = selectedTags.some(t => t.id === tag.id);
    
    if (todoId) {
      // If we have a todoId, update the database directly
      if (isSelected) {
        await removeTagFromTodo(todoId, tag.id);
      } else {
        await addTagToTodo(todoId, tag.id);
      }
    }

    // Update local state
    const newSelectedTags = isSelected
      ? selectedTags.filter(t => t.id !== tag.id)
      : [...selectedTags, tag];
    
    onChange?.(newSelectedTags);
  };

  const availableTags = allTags.filter(tag => 
    !selectedTags.some(selected => selected.id === tag.id)
  );

  return (
    <div className="space-y-2">
      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <div
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border"
              style={{ 
                backgroundColor: `${tag.color}20`, 
                borderColor: tag.color,
                color: tag.color 
              }}
            >
              <TagIcon className="w-3 h-3" />
              {tag.name}
              <button
                type="button"
                onClick={() => handleTagToggle(tag)}
                disabled={disabled}
                className="hover:bg-black/10 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tag Selector Dropdown */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || loading}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2"
        >
          <TagIcon className="w-3 h-3" />
          <span className="text-xs">Add Tags</span>
          <ChevronDown className="w-3 h-3" />
        </Button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => {
                setIsOpen(false);
                setIsCreating(false);
                setNewTagName('');
              }}
            />
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-20 max-h-64 overflow-y-auto">
              {/* Available Tags */}
              {availableTags.length > 0 && (
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-700 mb-2">Available Tags</div>
                  <div className="space-y-1">
                    {availableTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        className="w-full flex items-center gap-2 px-2 py-1 text-left hover:bg-gray-50 rounded text-xs"
                        onClick={() => handleTagToggle(tag)}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Create New Tag */}
              {isCreating ? (
                <div className="p-3 border-t border-gray-100">
                  <div className="space-y-2">
                    <Input
                      placeholder="Tag name"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateTag();
                        } else if (e.key === 'Escape') {
                          setIsCreating(false);
                          setNewTagName('');
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
                        onClick={handleCreateTag}
                        disabled={!newTagName.trim()}
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
                          setNewTagName('');
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
                  <span className="text-xs text-gray-600">Create New Tag</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function TagBadges({ tags }: { tags: Tag[] }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <div
          key={tag.id}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border"
          style={{ 
            backgroundColor: `${tag.color}20`, 
            borderColor: tag.color,
            color: tag.color 
          }}
        >
          <TagIcon className="w-2 h-2" />
          {tag.name}
        </div>
      ))}
    </div>
  );
}