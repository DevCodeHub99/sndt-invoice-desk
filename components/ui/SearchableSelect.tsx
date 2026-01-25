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
}

export function SearchableSelect({
  label,
  error,
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleInputClick = () => {
    setIsOpen(true);
  };

  const selectId = label?.toLowerCase().replace(/\s+/g, '-');

  // Display value: show selected label when not searching, show search term when typing
  const displayValue = isOpen ? searchTerm : (selectedLabel || '');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <div ref={containerRef} className="relative">
        {/* Searchable Input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            id={selectId}
            value={displayValue}
            onChange={handleInputChange}
            onClick={handleInputClick}
            placeholder={placeholder}
            className={cn(
              'w-full h-10 px-3 pr-20 rounded-lg border border-border bg-card text-foreground transition-all text-sm',
              'focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20',
              'hover:border-border/80',
              error && 'border-danger/50 focus:border-danger focus:ring-danger/20',
              isOpen && 'border-primary/50 ring-1 ring-primary/20'
            )}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 hover:bg-muted rounded"
            >
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-muted-foreground transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            </button>
          </div>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-50">
            {/* Options List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  No results found
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
