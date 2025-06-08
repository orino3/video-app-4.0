'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function TestUploadPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, teams } = useAuth();
  const supabase = createClient();

  const testUpload = async () => {
    setLoading(true);
    setMessage('Testing upload configuration...\n');

    try {
      // Test 1: Check auth
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setMessage((prev) => prev + '❌ Not authenticated\n');
        return;
      }
      setMessage(
        (prev) => prev + '✅ Authenticated as: ' + session.user.email + '\n'
      );

      // Test 2: Check teams
      if (!teams.length) {
        setMessage((prev) => prev + '❌ No teams found\n');
        return;
      }
      const team = teams[0];
      setMessage((prev) => prev + `✅ Found team: ${team.name} (${team.id})\n`);
      setMessage((prev) => prev + `✅ Your role: ${team.role}\n`);

      // Test 3: Create a test file
      const testContent = 'This is a test file';
      const testBlob = new Blob([testContent], { type: 'text/plain' });
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });

      const timestamp = Date.now();
      const filePath = `${team.id}/videos/test_${timestamp}.txt`;
      setMessage((prev) => prev + `\n📤 Uploading test file to: ${filePath}\n`);

      // Test 4: Try upload
      const { data, error } = await supabase.storage
        .from('videos')
        .upload(filePath, testFile);

      if (error) {
        setMessage((prev) => prev + `❌ Upload failed: ${error.message}\n`);
        setMessage(
          (prev) => prev + `Error details: ${JSON.stringify(error, null, 2)}\n`
        );
      } else {
        setMessage((prev) => prev + '✅ Upload successful!\n');
        setMessage((prev) => prev + `File path: ${data.path}\n`);

        // Test 5: Try to get URL
        const { data: urlData } = supabase.storage
          .from('videos')
          .getPublicUrl(filePath);
        setMessage((prev) => prev + `Public URL: ${urlData.publicUrl}\n`);

        // Test 6: Clean up
        const { error: deleteError } = await supabase.storage
          .from('videos')
          .remove([filePath]);

        if (deleteError) {
          setMessage(
            (prev) => prev + `⚠️  Cleanup failed: ${deleteError.message}\n`
          );
        } else {
          setMessage((prev) => prev + '✅ Test file cleaned up\n');
        }
      }
    } catch (err) {
      setMessage((prev) => prev + `\n❌ Unexpected error: ${err.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Upload Configuration Test</h1>

          <div className="bg-white rounded-lg border p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Current User: {user?.email || 'Not loaded'}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Teams: {teams.length}
              </p>
            </div>

            <button
              onClick={testUpload}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Run Upload Test'}
            </button>

            {message && (
              <pre className="mt-4 bg-gray-100 p-4 rounded text-sm overflow-auto">
                {message}
              </pre>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
