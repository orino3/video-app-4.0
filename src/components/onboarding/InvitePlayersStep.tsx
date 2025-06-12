'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface InvitePlayersStepProps {
  onNext: (emails: string[]) => void;
  onSkip: () => void;
  isLoading: boolean;
}

export function InvitePlayersStep({
  onNext,
  onSkip,
  isLoading,
}: InvitePlayersStepProps) {
  const [emails, setEmails] = useState<string[]>(['']);
  const [bulkInput, setBulkInput] = useState('');
  const [inputMode, setInputMode] = useState<'individual' | 'bulk'>(
    'individual'
  );

  const handleAddEmail = () => {
    setEmails([...emails, '']);
  };

  const handleRemoveEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = () => {
    let emailList: string[] = [];

    if (inputMode === 'individual') {
      emailList = emails.filter(
        (email) => email.trim() && validateEmail(email.trim())
      );
    } else {
      // Parse bulk input (comma or newline separated)
      emailList = bulkInput
        .split(/[,\n]/)
        .map((email) => email.trim())
        .filter((email) => email && validateEmail(email));
    }

    if (emailList.length === 0) {
      alert('Please enter at least one valid email address');
      return;
    }

    onNext(emailList);
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Invite Your Players
        </h2>
        <p className="text-gray-600">
          Add your team members now or skip and do it later
        </p>
      </div>

      <div className="mb-6">
        <div className="flex justify-center space-x-4 mb-6">
          <button
            type="button"
            onClick={() => setInputMode('individual')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              inputMode === 'individual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Individual Emails
          </button>
          <button
            type="button"
            onClick={() => setInputMode('bulk')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              inputMode === 'bulk'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Bulk Add
          </button>
        </div>

        {inputMode === 'individual' ? (
          <div className="space-y-3">
            {emails.map((email, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  placeholder="player@email.com"
                  className="flex-1"
                />
                {emails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddEmail}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              + Add another player
            </button>
          </div>
        ) : (
          <div>
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="Enter email addresses separated by commas or new lines:

john@example.com, jane@example.com
mike@example.com
sarah@example.com"
              className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-2 text-sm text-gray-600">
              Tip: You can paste a list of emails from a spreadsheet
            </p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium">
              Don't worry if you don't have all emails yet!
            </p>
            <p>
              You can always invite more players later from your team management
              page.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={onSkip}
          className="flex-1"
          disabled={isLoading}
        >
          Skip for Now
        </Button>
        <Button
          size="lg"
          onClick={handleSubmit}
          className="flex-1"
          disabled={isLoading}
        >
          {isLoading ? 'Sending Invites...' : 'Send Invitations'}
        </Button>
      </div>
    </div>
  );
}
