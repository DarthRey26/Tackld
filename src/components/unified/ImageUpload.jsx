import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ImageUpload = ({ 
  label = "Upload Images", 
  images = [], 
  onImagesChange, 
  maxImages = 5,
  bucketName = 'job-images',
  folder = '',
  className = '',
  required = false,
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadToSupabase = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder ? folder + '/' : ''}${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      return {
        success: true,
        url: publicUrl,
        path: fileName
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  const handleFileUpload = useCallback(async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (images.length + files.length > maxImages) {
      toast({
        title: "Too many images",
        description: `You can only upload up to ${maxImages} images.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const uploadPromises = files.map(uploadToSupabase);
    
    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(result => result.success);
      const failedUploads = results.filter(result => !result.success);

      if (successfulUploads.length > 0) {
        const newImageUrls = successfulUploads.map(result => result.url);
        onImagesChange([...images, ...newImageUrls]);
        
        toast({
          title: "Upload successful",
          description: `${successfulUploads.length} image(s) uploaded successfully.`,
        });
      }

      if (failedUploads.length > 0) {
        toast({
          title: "Some uploads failed",
          description: `${failedUploads.length} image(s) failed to upload.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading images.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset the input
      event.target.value = '';
    }
  }, [images, maxImages, onImagesChange, toast, bucketName, folder]);

  const removeImage = useCallback((indexToRemove) => {
    onImagesChange(images.filter((_, index) => index !== indexToRemove));
  }, [images, onImagesChange]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">
          {label} {required && '*'}
        </label>
        <span className="text-xs text-muted-foreground">
          {images.length}/{maxImages} images
        </span>
      </div>

      {/* Upload Button */}
      <div className="flex items-center gap-4">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          id="image-upload-input"
          disabled={disabled || uploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('image-upload-input')?.click()}
          disabled={disabled || uploading || images.length >= maxImages}
          className="flex items-center gap-2"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? 'Uploading...' : 'Choose Files'}
        </Button>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={imageUrl}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkM5Ljc5IDE2IDggMTQuMjEgOCAxMlM5Ljc5IDggMTIgOFMxNiA5Ljc5IDE2IDEyUzE0LjIxIDE2IDEyIDE2Wk0xMiA5QzEwLjM0IDkgOSAxMC4zNCA5IDEyUzEwLjM0IDE1IDEyIDE1UzE1IDEzLjY2IDE1IDEyUzEzLjY2IDkgMTIgOVoiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
                  }}
                />
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
          onClick={() => !disabled && document.getElementById('image-upload-input')?.click()}
        >
          <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">Click to upload images</p>
          <p className="text-sm text-gray-400">PNG, JPG, GIF up to 10MB each</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;