import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SelectOption {
  value: string | number;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  options: (SelectOption | string | number)[];
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  dropdownClassName?: string;
  renderOption?: (option: SelectOption) => React.ReactNode;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Pilih opsi...',
  searchable = false,
  searchPlaceholder = 'Cari...',
  disabled = false,
  className = '',
  dropdownClassName = '',
  renderOption,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to standard object format
  const normalizedOptions: SelectOption[] = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null && 'value' in opt) {
      return opt as SelectOption;
    }
    return {
      value: opt,
      label: String(opt),
    };
  });

  // Selected Option Object
  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  // Filtered options based on search
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(q)) ||
      String(opt.value).toLowerCase().includes(q)
    );
  });

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto focus search input when opened
      if (searchable) {
        setTimeout(() => searchInputRef.current?.focus(), 60);
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, searchable]);

  // Reset search when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelect = (val: string | number) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-[#070a12] border border-slate-700/80 hover:border-slate-600 rounded-xl px-3 py-2 text-xs font-medium text-white flex items-center justify-between transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 ${
          isOpen ? 'border-emerald-500 ring-1 ring-emerald-500/30' : ''
        } ${className}`}
      >
        <div className="flex items-center space-x-2 truncate">
          {selectedOption?.icon && <span>{selectedOption.icon}</span>}
          <span className="truncate text-slate-100 font-semibold">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Floating Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className={`absolute z-50 left-0 right-0 mt-1 min-w-[200px] bg-[#0c101d] border border-slate-700/80 rounded-2xl p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.7)] backdrop-blur-xl ${dropdownClassName}`}
          >
            {/* Search Input */}
            {searchable && (
              <div className="p-1 pb-1.5 border-b border-slate-800/80 mb-1">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full bg-[#070a12] border border-slate-700/70 focus:border-emerald-500 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 text-slate-400 hover:text-white p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5 scrollbar-thin">
              {filteredOptions.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500">
                  Tidak ada opsi yang cocok
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = String(option.value) === String(value);

                  return (
                    <button
                      key={String(option.value)}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left group ${
                        isSelected
                          ? 'bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        {option.icon && <span>{option.icon}</span>}
                        <div>
                          <span>{option.label}</span>
                          {option.subLabel && (
                            <span className="text-[10px] text-slate-400 font-normal block">
                              {option.subLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-400 stroke-[2.5] flex-shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
