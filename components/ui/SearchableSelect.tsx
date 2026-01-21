'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, X } from 'lucide-react';

interface SearchableSelectProps {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  threshold?: number; // Switch to search at this item count (default: 10)
}

const DEFAULT_THRESHOLD = 10;

export function SearchableSelect({
  label,
  error,
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  threshold = DEFAULT_THRESHOLD,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine if we should use search mode
  const useSearchMode = options.length > threshold;

  // Filter options based on search term
  const filteredOptions = useSearchMode
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && useSearchMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, useSearchMode]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  const selectId = label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <div ref={containerRef} className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          id={selectId}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full h-10 px-3 rounded-lg border bg-card text-foreground transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'flex items-center justify-between',
            error && 'border-danger focus:ring-danger',
            isOpen && 'ring-2 ring-primary border-primary'
          )}
        >
          <span className={cn(
            'text-sm',
            !value && 'text-muted-foreground'
          )}>
            {selectedLabel || placeholder}
          </span>
          <div className="flex items-center gap-1">
            {value && (
              <X
                className="w-4 h-4 text-muted-foreground hover:text-foreground"
                onClick={handleClear}
              />
            )}
            <ChevronDown
              className={cn(
                'w-4 h-4 text-muted-foreground transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-50">
            {/* Search Input (only in search mode) */}
            {useSearchMode && (
              <div className="p-2 border-b">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(
                    'w-full h-9 px-3 rounded-lg border bg-card text-foreground text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                  )}
                />
              </div>
            )}

            {/* Options List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  {useSearchMode ? 'No results found' : 'No options available'}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm transition-colors',
                      'hover:bg-muted/50',
                      value === option.value && 'bg-primary/10 text-primary font-medium'
                    )}
                  >
                    {option.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
