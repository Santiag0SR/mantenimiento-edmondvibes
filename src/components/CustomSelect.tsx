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
      {/* Botón del select */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={`w-full px-4 py-3 text-base text-left border-2 rounded-xl bg-white font-medium flex items-center justify-between ${
          disabled
            ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
            : value
            ? "border-slate-300 text-slate-800"
            : "border-slate-200 text-slate-400"
        } hover:border-slate-300`}
      >
        <span>{value || placeholder}</span>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Modal con opciones */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white w-full sm:w-96 sm:rounded-2xl rounded-t-2xl max-h-[70vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <span className="font-bold text-slate-800 text-lg">{placeholder}</span>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Opciones */}
            <div ref={listRef} className="overflow-y-auto max-h-[60vh]">
              {/* Opción para limpiar */}
              {allowClear && (
                <button
                  type="button"
                  onClick={handleClear}
                  className={`w-full px-4 py-4 text-left text-base border-b border-slate-50 flex items-center justify-between ${
                    !value
                      ? "bg-amber-50 text-amber-700 font-semibold"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {placeholder}
                  {!value && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className={`w-full px-4 py-4 text-left text-base border-b border-slate-50 flex items-center justify-between ${
                    value === option
                      ? "bg-amber-50 text-amber-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {option}
                  {value === option && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
