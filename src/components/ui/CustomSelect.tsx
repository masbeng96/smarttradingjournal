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
        className={`w-full bg-[#F7F7F5] border border-[#E5E5E2] hover:border-[#D4D4D0] rounded-xl px-3 py-2 text-xs font-bold text-[#0F0F0F] flex items-center justify-between transition-all duration-150 focus:outline-none focus:border-[#0F0F0F] ${
          isOpen ? 'border-[#0F0F0F] ring-1 ring-[#0F0F0F]' : ''
        } ${className}`}
      >
        <div className="flex items-center space-x-2 truncate">
          {selectedOption?.icon && <span>{selectedOption.icon}</span>}
          <span className="truncate text-[#0F0F0F] font-bold">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#737373] flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#0F0F0F]' : ''
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
            className={`absolute z-50 left-0 right-0 mt-1 min-w-[200px] bg-white border border-[#E5E5E2] rounded-2xl p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.12)] backdrop-blur-xl ${dropdownClassName}`}
          >
            {/* Search Input */}
            {searchable && (
              <div className="p-1 pb-1.5 border-b border-[#E5E5E2] mb-1">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-[#A3A3A3] absolute left-2.5 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#0F0F0F] rounded-xl pl-8 pr-7 py-1.5 text-xs text-[#0F0F0F] placeholder:text-[#A3A3A3] focus:outline-none font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 text-[#737373] hover:text-[#0F0F0F] p-0.5"
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
                <div className="py-4 text-center text-xs text-[#737373]">
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left group ${
                        isSelected
                          ? 'bg-[#0F0F0F] text-white'
                          : 'text-[#0F0F0F] hover:bg-[#F2F2EF]'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        {option.icon && <span>{option.icon}</span>}
                        <div>
                          <span>{option.label}</span>
                          {option.subLabel && (
                            <span className={`text-[10px] font-normal block ${isSelected ? 'text-neutral-300' : 'text-[#737373]'}`}>
                              {option.subLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-white stroke-[2.5] flex-shrink-0 ml-2" />
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
