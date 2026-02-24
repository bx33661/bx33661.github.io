"use client";

import { useState, useEffect, useRef } from "react";
import type { ImageMetadata } from "astro";

interface GalleryImage {
  src: string;
  alt: string;
  title: string;
  date: string;
  width?: number;
  height?: number;
}

interface ArtGallerySliderProps {
  images: GalleryImage[];
}

export default function ArtGallerySlider({ images }: ArtGallerySliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 75) {
      nextSlide();
    }
    if (touchStartX.current - touchEndX.current < -75) {
      prevSlide();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAnimating]);

  const currentImage = images[currentIndex];

  return (
    <div className="gallery-slider-container">
      {/* Main Gallery Display */}
      <div className="gallery-main">
        <div
          className="gallery-stage"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            disabled={isAnimating}
            className="gallery-nav gallery-nav-prev"
            aria-label="Previous image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Image Container */}
          <div className="gallery-image-wrapper">
            <div className="gallery-image-container">
              <img
                key={currentIndex}
                src={currentImage.src}
                alt={currentImage.alt}
                className="gallery-image"
                loading="eager"
              />
            </div>

            {/* Image Info Overlay */}
            <div className="gallery-info">
              <div className="gallery-info-content">
                <h3 className="gallery-title">{currentImage.title}</h3>
                <p className="gallery-date">
                  {new Date(currentImage.date).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={nextSlide}
            disabled={isAnimating}
            className="gallery-nav gallery-nav-next"
            aria-label="Next image"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="gallery-progress">
          <span className="gallery-counter">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div className="gallery-thumbnails">
        <div className="gallery-thumbnails-track">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`gallery-thumbnail ${index === currentIndex ? "gallery-thumbnail-active" : ""}`}
              aria-label={`Go to image ${index + 1}`}
            >
              <img src={image.src} alt={image.alt} loading="lazy" />
              <div className="gallery-thumbnail-overlay" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
