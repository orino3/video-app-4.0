'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TestConnection() {
  const [status, setStatus] = useState<string>('Testing connection...');
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient();

        // Test basic connection by checking auth status
        const { error } = await supabase.auth.getSession();

        if (!error) {
          setStatus('✅ Successfully connected to Supabase!');
          setIsConnected(true);
        } else {
          setStatus(`❌ Connection error: ${error.message}`);
          setIsConnected(false);
        }
      } catch (err) {
        setStatus(
          `❌ Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
        setIsConnected(false);
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Supabase Connection Test
          </h2>
          <p
            className={`mt-4 text-lg ${isConnected ? 'text-green-600' : 'text-red-600'}`}
          >
            {status}
          </p>
          {isConnected && (
            <div className="mt-6 text-sm text-gray-600">
              <p>Project URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
