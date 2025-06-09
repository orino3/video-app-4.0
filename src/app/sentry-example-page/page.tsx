'use client';

import * as Sentry from '@sentry/nextjs';
import { useState } from 'react';

export default function SentryExamplePage() {
  const [status, setStatus] = useState<string>('');

  const checkSentry = () => {
    console.log('Checking Sentry configuration...');
    console.log('DSN:', process.env.NEXT_PUBLIC_SENTRY_DSN);
    console.log('Sentry initialized:', !!Sentry.getCurrentScope().getClient());
    
    const client = Sentry.getCurrentScope().getClient();
    if (client) {
      const options = client.getOptions();
      console.log('Sentry options:', options);
      setStatus('Sentry is initialized with DSN: ' + (options.dsn || 'No DSN'));
    } else {
      setStatus('Sentry is NOT initialized');
    }
  };

  const triggerError = () => {
    try {
      setStatus('Sending error to Sentry...');
      throw new Error("Sentry Example Error - " + new Date().toISOString());
    } catch (error) {
      console.log('Capturing exception:', error);
      Sentry.captureException(error);
      setStatus('Error sent! Check Sentry dashboard.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold">Sentry Test Page</h1>
        
        <button
          onClick={checkSentry}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Check Sentry Configuration
        </button>
        
        <button
          onClick={triggerError}
          className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
        >
          Trigger Test Error
        </button>
        
        {status && (
          <div className="p-4 bg-gray-100 rounded text-sm">
            {status}
          </div>
        )}
        
        <p className="text-xs text-gray-500">
          Check browser console for detailed logs
        </p>
      </div>
    </div>
  );
}