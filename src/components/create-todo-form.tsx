'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createTodo, generateTodoSuggestions } from '@/lib/actions';
import { Sparkles, Loader2, Plus } from 'lucide-react';

interface CreateTodoFormProps {
  userId: string;
  onTodoCreated: () => void;
}

export function CreateTodoForm({ userId, onTodoCreated }: CreateTodoFormProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    if (!content.trim()) {
      setError('Todo content cannot be empty');
      setIsLoading(false);
      return;
    }
    
    const result = await createTodo(userId, content);
    if (result?.error) {
      setError(result.error);
    } else {
      setContent('');
      onTodoCreated(); // Refresh the todos list
    }
    setIsLoading(false);
  };

  const handleGenerateSuggestions = async () => {
    if (!content.trim()) {
      setError('Silakan masukkan tujuan atau deskripsi terlebih dahulu');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setShowSuggestions(false);

    try {
      const result = await generateTodoSuggestions(content);
      
      if (result?.error) {
        setError(result.error);
      } else if (result?.data) {
        setSuggestions(result.data);
        setShowSuggestions(true);
      }
    } catch {
      setError('Gagal menghasilkan saran');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setContent(suggestion);
    setShowSuggestions(false);
  };

  const handleAddSuggestion = async (suggestion: string) => {
    setIsLoading(true);
    setError(null);
    
    const result = await createTodo(userId, suggestion);
    if (result?.error) {
      setError(result.error);
    } else {
      onTodoCreated(); // Refresh the todos list
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tambahkan todo baru atau jelaskan tujuan Anda untuk saran AI..."
          className="flex-1"
          disabled={isLoading || isGenerating}
        />
        <Button 
          type="button" 
          variant="outline"
          onClick={handleGenerateSuggestions}
          disabled={isLoading || isGenerating || !content.trim()}
          className="flex items-center gap-2"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isGenerating ? 'Generating...' : 'AI'}
        </Button>
        <Button type="submit" disabled={isLoading || isGenerating}>
          {isLoading ? 'Menambahkan...' : 'Tambah'}
        </Button>
      </form>
      
      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">Saran AI:</h3>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="flex-1 text-left justify-start"
                >
                  {suggestion}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSuggestion(suggestion)}
                  disabled={isLoading}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Tambah
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 