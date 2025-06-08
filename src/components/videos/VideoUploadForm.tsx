'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { createClient } from '@/lib/supabase/client';
import { useMonitoring, EVENTS } from '@/hooks/useMonitoring';

interface VideoUploadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function VideoUploadForm({ onSuccess, onCancel }: VideoUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { user, teams } = useAuth();
  const { getActiveTeam } = useAuthStore();
  const router = useRouter();
  const supabase = createClient();
  const { logEvent, trackError } = useMonitoring();

  // File validation
  const validateFile = (file: File): string | null => {
    const maxSize = 500 * 1024 * 1024; // 500MB
    const allowedTypes = [
      'video/mp4',
      'video/mov',
      'video/quicktime',
      'video/avi',
      'video/x-msvideo',
    ];

    console.log('File validation:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2),
    });

    if (file.size > maxSize) {
      return 'File size must be less than 500MB';
    }

    if (!allowedTypes.includes(file.type)) {
      return `Please select a valid video file (MP4, MOV, AVI). Your file type: ${file.type}`;
    }

    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Auto-populate title from filename if empty
    if (!title) {
      const nameWithoutExtension = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExtension);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a video file');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a video title');
      return;
    }

    if (!user) {
      setError('You must be logged in to upload videos');
      return;
    }

    const currentTeam = getActiveTeam();
    if (!currentTeam) {
      setError('Please select a team to upload to');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Create file path: {team_id}/videos/{timestamp}_{filename}
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = `${currentTeam.id}/videos/${fileName}`;

      // Upload file to Supabase Storage
      console.log('Uploading file:', {
        filePath,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        teamId: currentTeam.id,
      });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(Math.round(percent));
          },
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL for the uploaded file
      const {
        data: { publicUrl },
      } = supabase.storage.from('videos').getPublicUrl(filePath);

      // Save video metadata to database
      const { error: dbError } = await supabase.from('videos').insert({
        team_id: currentTeam.id,
        title: title.trim(),
        description: description.trim() || null,
        video_url: publicUrl,
        source: 'upload',
        file_name: file.name,
        file_size: file.size,
        storage_path: filePath,
        uploaded_by: user.id,
      });

      if (dbError) {
        // If database insert fails, clean up the uploaded file
        await supabase.storage.from('videos').remove([filePath]);
        throw new Error(`Failed to save video details: ${dbError.message}`);
      }

      // Success!
      setUploadProgress(100);
      
      // Track the successful upload
      await logEvent(EVENTS.VIDEO_UPLOADED, {
        file_size: file.size,
        file_type: file.type,
        team_id: currentTeam.id,
        source: 'upload',
      });
      
      onSuccess?.();

      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setUploadProgress(0);

      // Navigate to videos page
      router.push('/dashboard/videos');
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      
      // Track the error
      trackError(err instanceof Error ? err : new Error(errorMessage), {
        file_size: file?.size,
        file_type: file?.type,
        team_id: currentTeam?.id,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const validationError = validateFile(droppedFile);
      if (validationError) {
        setError(validationError);
        return;
      }

      setFile(droppedFile);
      setError(null);

      if (!title) {
        const nameWithoutExtension = droppedFile.name.replace(/\.[^/.]+$/, '');
        setTitle(nameWithoutExtension);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg border">
      <h2 className="text-2xl font-bold mb-6">Upload Video</h2>

      <form onSubmit={handleUpload} className="space-y-6">
        {/* File Upload Area */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Video File *</label>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-2">
                <div className="text-green-600 font-medium">📹 {file.name}</div>
                <div className="text-sm text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-gray-400 text-4xl">📹</div>
                <div className="text-gray-600">
                  Drag and drop your video here, or{' '}
                  <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                    browse files
                    <input
                      type="file"
                      accept="video/mp4,video/mov,video/quicktime,video/avi"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="text-sm text-gray-500">
                  Supports MP4, MOV, AVI (max 500MB)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Title Field */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium">
            Video Title *
          </label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter video title"
            required
            className="w-full"
          />
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter video description (optional)"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={!file || !title.trim() || uploading}
            className="flex-1"
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={uploading}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
