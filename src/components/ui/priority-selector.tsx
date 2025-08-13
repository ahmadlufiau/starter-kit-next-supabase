'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { type Priority } from '@/db/schema';
import { ChevronDown, AlertCircle, Circle, Minus } from 'lucide-react';

interface PrioritySelectorProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  disabled?: boolean;
}

const priorityConfig = {
  high: {
    label: 'High',
    color: 'text-red-600 bg-red-50 border-red-200',
    icon: AlertCircle,
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    icon: Circle,
  },
  low: {
    label: 'Low',
    color: 'text-green-600 bg-green-50 border-green-200',
    icon: Minus,
  },
};

export function PrioritySelector({ value, onChange, disabled }: PrioritySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentPriority = priorityConfig[value];
  const CurrentIcon = currentPriority.icon;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 ${currentPriority.color}`}
      >
        <CurrentIcon className="w-3 h-3" />
        <span className="text-xs font-medium">{currentPriority.label}</span>
        <ChevronDown className="w-3 h-3" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-20">
            {Object.entries(priorityConfig).map(([priority, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={priority}
                  type="button"
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 first:rounded-t-md last:rounded-b-md ${config.color}`}
                  onClick={() => {
                    onChange(priority as Priority);
                    setIsOpen(false);
                  }}
                >
                  <Icon className="w-3 h-3" />
                  <span className="text-xs font-medium">{config.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </div>
  );
}