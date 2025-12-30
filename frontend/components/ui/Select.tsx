'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
  className = '',
  buttonClassName = '',
  searchable = false,
  searchPlaceholder = 'Search...',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;
  const isEmpty = !value || value === '';
  const filteredOptions = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full p-3 sm:p-3 border border-border rounded-lg text-xs sm:text-sm
          bg-white dark:bg-background text-foreground
          focus:outline-none focus:ring-2 focus:ring-primary/40
          transition
          flex items-center justify-between
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-ring'}
          ${buttonClassName}
        `}
      >
        <span className={isEmpty ? 'text-muted-foreground' : 'text-foreground'}>
          {displayValue}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''
            }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-auto"
            >
              <div className="p-2">
                {searchable && (
                  <div className="px-2 pb-2">
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={searchPlaceholder}
                      className="w-full p-2 text-sm border border-border rounded-lg bg-white dark:bg-background text-foreground focus:outline-none"
                    />
                  </div>
                )}
                {filteredOptions.map((option) => {
                  const isSelected = value === option.value;
                  const isEmptyOption = option.value === '';

                  return (
                    <button
                      key={option.value || 'empty'}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className={`
                        w-full px-4 py-2 text-left rounded-lg
                        flex items-center justify-between
                        transition-colors
                        ${isSelected
                          ? 'bg-primary text-primary-foreground'
                          : isEmptyOption
                            ? 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            : 'hover:bg-accent hover:text-accent-foreground text-foreground'
                        }
                      `}
                    >
                      <span>{option.label}</span>
                      {isSelected && !isEmptyOption && (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

