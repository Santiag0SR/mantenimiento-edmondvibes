"use client";

import { useState, useRef } from "react";

interface ImageUploadProps {
  onImagesChange: (urls: string[]) => void;
}

export default function ImageUpload({ onImagesChange }: ImageUploadProps) {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Error al subir imagen");
        }

        const { url } = await res.json();
        newUrls.push(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al subir imagen");
      }
    }

    const allImages = [...images, ...newUrls];
    setImages(allImages);
    onImagesChange(allImages);
    setUploading(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">
        Fotos <span className="text-slate-400 font-normal">(opcional)</span>
      </label>

      <div className="flex flex-wrap gap-3">
        {images.map((url, index) => (
          <div key={index} className="relative w-20 h-20 group">
            <img
              src={url}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover rounded-xl border-2 border-slate-200"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm shadow-lg opacity-0 group-hover:opacity-100 hover:bg-red-600 active:scale-90"
            >
              ×
            </button>
          </div>
        ))}

        <label className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-amber-50 transition-colors">
          {uploading ? (
            <svg className="animate-spin h-6 w-6 text-amber-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <>
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs text-slate-500 mt-1">Añadir</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
