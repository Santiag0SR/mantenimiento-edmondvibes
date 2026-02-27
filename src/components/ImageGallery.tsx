"use client";

import { useState } from "react";

interface ImageGalleryProps {
  images: string[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const openModal = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      {/* Thumbnails */}
      <div className="flex flex-wrap gap-2">
        {images.map((foto, i) => (
          <button
            key={i}
            onClick={() => openModal(i)}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors"
          >
            <img
              src={foto}
              alt={`Foto ${i + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeModal}
        >
          {/* Close button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-white text-3xl font-bold z-10 w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-full"
          >
            ×
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Previous button */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-2 sm:left-4 text-white text-4xl font-bold w-12 h-12 flex items-center justify-center hover:bg-white/20 rounded-full"
            >
              ‹
            </button>
          )}

          {/* Image */}
          <div
            className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[currentIndex]}
              alt={`Foto ${currentIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>

          {/* Next button */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-2 sm:right-4 text-white text-4xl font-bold w-12 h-12 flex items-center justify-center hover:bg-white/20 rounded-full"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
}
