import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface ComboboxOption {
    value: string;
    label: string;
}

interface ComboboxProps {
    label?: string;
    options: ComboboxOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchable?: boolean;
}

export const Combobox: React.FC<ComboboxProps> = ({
    label,
    options,
    value,
    onChange,
    placeholder = 'Seleccionar...',
    searchable = true,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find((o) => o.value === value);

    const filteredOptions = search
        ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
        : options;

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Focus search when opened
    useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen, searchable]);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setSearch('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setSearch('');
        }
    };

    return (
        <div className="w-full space-y-2" ref={containerRef} onKeyDown={handleKeyDown}>
            {label && (
                <label className="text-sm font-medium leading-none text-gray-700">{label}</label>
            )}
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={`flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135D54] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${isOpen ? 'border-[#135D54] ring-2 ring-[#135D54] ring-offset-2' : 'border-gray-200 hover:border-gray-300'
                    }`}
            >
                <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Popover */}
            {isOpen && (
                <div className="relative z-[100]">
                    <div
                        className="absolute top-0 left-0 w-full rounded-md border border-gray-200 bg-white shadow-lg"
                        style={{ animation: 'comboboxFadeIn 0.15s ease-out' }}
                    >
                        {/* Search */}
                        {searchable && (
                            <div className="flex items-center border-b border-gray-100 px-3">
                                <Search size={14} className="text-gray-400 shrink-0" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    className="flex h-9 w-full bg-transparent py-2 px-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                                    placeholder="Buscar..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Options */}
                        <div className="max-h-[180px] overflow-y-auto p-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleSelect(option.value)}
                                        className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-3 text-sm transition-colors hover:bg-[#135D54]/5 hover:text-[#135D54] ${value === option.value
                                                ? 'bg-[#135D54]/5 text-[#135D54] font-medium'
                                                : 'text-gray-700'
                                            }`}
                                    >
                                        {value === option.value && (
                                            <Check size={14} className="absolute left-2 text-[#135D54]" />
                                        )}
                                        {option.label}
                                    </button>
                                ))
                            ) : (
                                <div className="py-4 text-center text-sm text-gray-400">
                                    Sin resultados
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
