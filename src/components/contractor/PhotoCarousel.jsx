import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

const PhotoCarousel = ({ images = [], title = "Photos", isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!images || images.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-500">No images available</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title} ({currentIndex + 1} of {images.length})</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-auto p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          {/* Main Image */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={images[currentIndex]}
              alt={`${title} ${currentIndex + 1}`}
              className={`w-full transition-transform duration-200 ${
                isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              style={{ 
                maxHeight: '60vh',
                objectFit: 'contain'
              }}
              onClick={toggleZoom}
            />
            
            {/* Zoom indicator */}
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 opacity-75 hover:opacity-100"
              onClick={toggleZoom}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 rounded-full p-2"
                onClick={goToPrevious}
                disabled={images.length <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full p-2"
                onClick={goToNext}
                disabled={images.length <= 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 mt-4 justify-center overflow-x-auto pb-2">
            {images.map((image, index) => (
              <div
                key={index}
                className={`flex-shrink-0 w-16 h-16 rounded border-2 cursor-pointer overflow-hidden ${
                  index === currentIndex ? 'border-primary' : 'border-gray-200'
                }`}
                onClick={() => setCurrentIndex(index)}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PhotoCarousel;