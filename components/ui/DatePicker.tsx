import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface DatePickerProps {
    label?: string;
    value: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    placeholder?: string;
    minYear?: number;
    maxYear?: number;
}

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAY_NAMES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday = 0
};

export const DatePicker: React.FC<DatePickerProps> = ({
    label,
    value,
    onChange,
    placeholder = 'Seleccionar fecha',
    minYear = 1940,
    maxYear,
}) => {
    const currentYear = new Date().getFullYear();
    const resolvedMaxYear = maxYear ?? currentYear;

    const parsed = useMemo(() => {
        if (!value) return null;
        const [y, m, d] = value.split('-').map(Number);
        if (y && m && d) return { year: y, month: m - 1, day: d };
        return null;
    }, [value]);

    const [viewYear, setViewYear] = useState(parsed?.year ?? currentYear);
    const [viewMonth, setViewMonth] = useState(parsed?.month ?? new Date().getMonth());
    const [isOpen, setIsOpen] = useState(false);
    const [showYearSelect, setShowYearSelect] = useState(false);
    const [showMonthSelect, setShowMonthSelect] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const yearListRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setShowYearSelect(false);
                setShowMonthSelect(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    // Scroll to selected year when year picker opens
    useEffect(() => {
        if (showYearSelect && yearListRef.current) {
            const activeEl = yearListRef.current.querySelector('[data-active="true"]');
            if (activeEl) {
                activeEl.scrollIntoView({ block: 'center' });
            }
        }
    }, [showYearSelect]);

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

    const years = useMemo(() => {
        const arr: number[] = [];
        for (let y = resolvedMaxYear; y >= minYear; y--) arr.push(y);
        return arr;
    }, [minYear, resolvedMaxYear]);

    const handlePrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear((y) => y - 1);
        } else {
            setViewMonth((m) => m - 1);
        }
    };

    const handleNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear((y) => y + 1);
        } else {
            setViewMonth((m) => m + 1);
        }
    };

    const handleDayClick = (day: number) => {
        const mm = String(viewMonth + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        onChange(`${viewYear}-${mm}-${dd}`);
        setIsOpen(false);
        setShowYearSelect(false);
        setShowMonthSelect(false);
    };

    const handleYearSelect = (y: number) => {
        setViewYear(y);
        setShowYearSelect(false);
    };

    const handleMonthSelect = (m: number) => {
        setViewMonth(m);
        setShowMonthSelect(false);
    };

    const formatDisplay = (val: string) => {
        if (!val) return '';
        const [y, m, d] = val.split('-');
        return `${d}/${m}/${y}`;
    };

    const today = new Date();
    const isToday = (day: number) =>
        viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();

    const isSelected = (day: number) =>
        parsed ? viewYear === parsed.year && viewMonth === parsed.month && day === parsed.day : false;

    return (
        <div className="w-full space-y-2" ref={containerRef}>
            {label && (
                <label className="text-sm font-medium leading-none text-gray-700">{label}</label>
            )}

            {/* Trigger */}
            <button
                type="button"
                onClick={() => {
                    setIsOpen((prev) => !prev);
                    setShowYearSelect(false);
                    setShowMonthSelect(false);
                }}
                className={`flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#135D54] focus-visible:ring-offset-2 ${isOpen ? 'border-[#135D54] ring-2 ring-[#135D54] ring-offset-2' : 'border-gray-200 hover:border-gray-300'
                    }`}
            >
                <span className={value ? 'text-gray-900' : 'text-gray-500'}>
                    {value ? formatDisplay(value) : placeholder}
                </span>
                <CalendarDays size={16} className="text-gray-400" />
            </button>

            {/* Calendar Popover */}
            {isOpen && (
                <div className="relative z-[100]">
                    <div
                        className="absolute top-0 left-0 w-full sm:w-[300px] rounded-md border border-gray-200 bg-white shadow-lg p-3"
                        style={{ animation: 'comboboxFadeIn 0.15s ease-out' }}
                    >
                        {/* Header: Month/Year navigation */}
                        <div className="flex items-center justify-between mb-3">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <div className="flex items-center gap-1">
                                {/* Month selector */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowMonthSelect((prev) => !prev);
                                            setShowYearSelect(false);
                                        }}
                                        className="text-sm font-semibold text-gray-800 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                                    >
                                        {MONTH_NAMES[viewMonth]}
                                        <ChevronDown size={12} className={`transition-transform ${showMonthSelect ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showMonthSelect && (
                                        <div className="absolute top-full left-0 mt-1 w-36 max-h-[200px] overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg p-1 z-10">
                                            {MONTH_NAMES.map((name, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleMonthSelect(idx)}
                                                    className={`w-full text-left text-sm px-3 py-1.5 rounded-sm transition-colors hover:bg-[#135D54]/5 hover:text-[#135D54] ${idx === viewMonth ? 'bg-[#135D54]/5 text-[#135D54] font-medium' : 'text-gray-700'
                                                        }`}
                                                >
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Year selector */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowYearSelect((prev) => !prev);
                                            setShowMonthSelect(false);
                                        }}
                                        className="text-sm font-semibold text-gray-800 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                                    >
                                        {viewYear}
                                        <ChevronDown size={12} className={`transition-transform ${showYearSelect ? 'rotate-180' : ''}`} />
                                    </button>
                                    {showYearSelect && (
                                        <div
                                            ref={yearListRef}
                                            className="absolute top-full right-0 mt-1 w-24 max-h-[200px] overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg p-1 z-10"
                                        >
                                            {years.map((y) => (
                                                <button
                                                    key={y}
                                                    type="button"
                                                    data-active={y === viewYear}
                                                    onClick={() => handleYearSelect(y)}
                                                    className={`w-full text-center text-sm px-2 py-1.5 rounded-sm transition-colors hover:bg-[#135D54]/5 hover:text-[#135D54] ${y === viewYear ? 'bg-[#135D54]/5 text-[#135D54] font-medium' : 'text-gray-700'
                                                        }`}
                                                >
                                                    {y}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleNextMonth}
                                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        {/* Day names */}
                        <div className="grid grid-cols-7 mb-1">
                            {DAY_NAMES.map((d) => (
                                <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Days grid */}
                        <div className="grid grid-cols-7">
                            {/* Empty cells for days before month start */}
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const selected = isSelected(day);
                                const todayDay = isToday(day);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => handleDayClick(day)}
                                        className={`relative h-9 w-full rounded-md text-sm transition-all hover:bg-[#135D54]/10 ${selected
                                                ? 'bg-[#135D54] text-white hover:bg-[#135D54] font-semibold'
                                                : todayDay
                                                    ? 'font-semibold text-[#135D54]'
                                                    : 'text-gray-700'
                                            }`}
                                    >
                                        {day}
                                        {todayDay && !selected && (
                                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#135D54]" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
