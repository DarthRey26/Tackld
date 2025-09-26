import { supabase } from '@/integrations/supabase/client';

export const storageService = {
  // Upload a single file
  async uploadFile(file, folder = 'uploads') {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('job-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('job-images')
        .getPublicUrl(filePath);

      return {
        data: {
          path: data.path,
          publicUrl
        },
        error: null
      };
    } catch (error) {
      console.error('Upload file error:', error);
      return { data: null, error };
    }
  },

  // Upload multiple files
  async uploadFiles(files, folder = 'uploads') {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, folder));
      const results = await Promise.all(uploadPromises);

      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Failed to upload ${errors.length} files`);
      }

      const uploadedFiles = results.map(result => result.data);
      return { data: uploadedFiles, error: null };
    } catch (error) {
      console.error('Upload files error:', error);
      return { data: null, error };
    }
  },

  // Upload booking images
  async uploadBookingImages(files, bookingId) {
    try {
      const folder = `bookings/${bookingId}`;
      return await this.uploadFiles(files, folder);
    } catch (error) {
      console.error('Upload booking images error:', error);
      return { data: null, error };
    }
  },

  // Upload job photo
  async uploadJobPhoto(file, jobId) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `job-${jobId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('job-images')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('job-images')
        .getPublicUrl(data.path);

      return { data: { publicUrl, path: data.path }, error: null };
    } catch (error) {
      console.error('Upload job photo error:', error);
      return { data: null, error };
    }
  },

  // Upload profile photo
  async uploadProfilePhoto(file, userId) {
    try {
      const folder = `profiles/${userId}`;
      const result = await this.uploadFile(file, folder);
      
      if (result.error) throw result.error;

      // Update user profile with new photo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_photo_url: result.data.publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      return result;
    } catch (error) {
      console.error('Upload profile photo error:', error);
      return { data: null, error };
    }
  },

  // Delete file
  async deleteFile(filePath) {
    try {
      const { error } = await supabase.storage
        .from('job-images')
        .remove([filePath]);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Delete file error:', error);
      return { error };
    }
  },

  // Delete multiple files
  async deleteFiles(filePaths) {
    try {
      const { error } = await supabase.storage
        .from('job-images')
        .remove(filePaths);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Delete files error:', error);
      return { error };
    }
  },

  // Get file URL
  async getFileUrl(filePath) {
    try {
      const { data } = supabase.storage
        .from('job-images')
        .getPublicUrl(filePath);

      return { data: data.publicUrl, error: null };
    } catch (error) {
      console.error('Get file URL error:', error);
      return { data: null, error };
    }
  },

  // List files in folder
  async listFiles(folder = '') {
    try {
      const { data, error } = await supabase.storage
        .from('job-images')
        .list(folder);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('List files error:', error);
      return { data: null, error };
    }
  },

  // Create signed URL for private files
  async createSignedUrl(filePath, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from('job-images')
        .createSignedUrl(filePath, expiresIn);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Create signed URL error:', error);
      return { data: null, error };
    }
  }
};