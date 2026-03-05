"use client";

import { useState, useEffect, useRef } from "react";

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  allowClear?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  allowClear = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && activeRef.current && listRef.current) {
      const container = listRef.current;
      const item = activeRef.current;
      container.scrollTop = item.offsetTop - container.offsetTop - container.clientHeight / 2 + item.clientHeight / 2;
    }
  }, [isOpen]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={`w-full px-4 py-3 text-base text-left border rounded-xl font-medium flex items-center justify-between transition-colors ${
          disabled
            ? "bg-stone-50 border-stone-200 text-stone-400 cursor-not-allowed"
            : value
            ? "bg-white border-stone-300 text-stone-900"
            : "bg-white border-stone-300 text-stone-500"
        } hover:border-stone-400`}
      >
        <span className="truncate">{value || placeholder}</span>
        <svg
          className={`w-4 h-4 text-stone-500 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white w-full sm:w-96 sm:rounded-2xl rounded-t-2xl max-h-[70vh] overflow-hidden shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50">
              <span className="font-semibold text-stone-900 text-base">{placeholder}</span>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200 text-stone-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div ref={listRef} className="overflow-y-auto max-h-[60vh]">
              {allowClear && (
                <button
                  type="button"
                  onClick={handleClear}
                  className={`w-full px-4 py-3.5 text-left text-sm border-b border-stone-100 flex items-center justify-between ${
                    !value
                      ? "bg-stone-100 text-stone-900 font-semibold"
                      : "text-stone-500 hover:bg-stone-50"
                  }`}
                >
                  {placeholder}
                  {!value && (
                    <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )}

              {options.map((option) => (
                <button
                  key={option}
                  ref={value === option ? activeRef : undefined}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full px-4 py-3.5 text-left text-sm border-b border-stone-100 flex items-center justify-between ${
                    value === option
                      ? "bg-stone-100 text-stone-900 font-semibold"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {option}
                  {value === option && (
                    <svg className="w-4 h-4 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
