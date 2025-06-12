import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { VideoUploadForm } from '@/components/videos/VideoUploadForm';

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        <VideoUploadForm />
      </div>
    </ProtectedRoute>
  );
}
