import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Camera } from 'lucide-react';

const CustomerImageCarousel = ({ images, isOpen, onClose, jobTitle }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Customer Images - {jobTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col items-center justify-center relative">
          {/* Main Image */}
          <div className="relative w-full max-w-3xl h-96 bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={images[currentIndex]}
              alt={`Customer image ${currentIndex + 1}`}
              className="w-full h-full object-contain"
            />
            
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <Button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2"
                  size="sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
          
          {/* Image Counter */}
          {images.length > 1 && (
            <div className="mt-4 text-sm text-gray-600">
              {currentIndex + 1} of {images.length}
            </div>
          )}
          
          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="mt-4 flex gap-2 max-w-full overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                    index === currentIndex 
                      ? 'border-primary' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-center pt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerImageCarousel;