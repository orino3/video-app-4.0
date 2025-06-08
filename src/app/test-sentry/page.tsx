'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function TestSentryPage() {
  const [errorSent, setErrorSent] = useState(false);

  const triggerError = () => {
    try {
      // This will create an error
      throw new Error('Test error from Sentry test page');
    } catch (error) {
      // Send to Sentry
      Sentry.captureException(error);
      setErrorSent(true);
      console.log('Error sent to Sentry:', error);
    }
  };

  const triggerUnhandledError = () => {
    // This will create an unhandled error that Sentry should catch automatically
    throw new Error('Unhandled test error for Sentry');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Test Sentry Integration</h1>
        
        <div className="space-y-4">
          <button
            onClick={triggerError}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Send Test Error to Sentry
          </button>
          
          {errorSent && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              Error sent! Check your Sentry dashboard.
            </div>
          )}
          
          <button
            onClick={triggerUnhandledError}
            className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
          >
            Trigger Unhandled Error
          </button>
          
          <p className="text-sm text-gray-600">
            After clicking the buttons, check your Sentry dashboard at{' '}
            <a
              href="https://sentry.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              sentry.io
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}