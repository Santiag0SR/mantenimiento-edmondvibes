"use client";

import { useState, useRef } from "react";

interface FileUploadProps {
  files: string[];
  onFilesChange: (urls: string[]) => void;
  label: string;
  accept?: string;
}

export default function FileUpload({ files, onFilesChange, label, accept = "*" }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    setError(null);

    const newUrls: string[] = [];

    for (const file of Array.from(selectedFiles)) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Error al subir archivo");
        }

        const { url } = await res.json();
        newUrls.push(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al subir archivo");
      }
    }

    const allFiles = [...files, ...newUrls];
    onFilesChange(allFiles);
    setUploading(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const getFileName = (url: string) => {
    const parts = url.split("/");
    const name = parts[parts.length - 1];
    return name.replace(/^\d+-/, "").substring(0, 25) + (name.length > 25 ? "..." : "");
  };

  const isPdf = (url: string) => url.toLowerCase().endsWith(".pdf");

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">
        {label}
      </label>

      {/* Lista de archivos */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((url, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3 group hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isPdf(url) ? 'bg-red-100' : 'bg-blue-100'}`}>
                  {isPdf(url) ? (
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-700 hover:text-amber-600 text-sm font-medium truncate flex-1 transition-colors"
                >
                  {getFileName(url)}
                </a>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-2 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botón de subir */}
      <label className="flex items-center justify-center gap-2 w-full py-4 px-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-all group">
        {uploading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-500 border-t-transparent"></div>
            <span className="text-slate-600 text-sm font-medium">Subiendo...</span>
          </div>
        ) : (
          <>
            <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-slate-500 group-hover:text-amber-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-slate-600 group-hover:text-slate-800 text-sm font-medium transition-colors">Añadir archivo</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleUpload}
          className="hidden"
          disabled={uploading}
        />
      </label>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
