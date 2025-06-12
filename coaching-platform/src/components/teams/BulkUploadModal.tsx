'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  onSuccess: () => void;
}

interface CSVRow {
  email?: string;
  full_name: string;
  jersey_number?: string;
  role: 'player' | 'coach' | 'analyst';
  position?: string;
  phone_number?: string;
  whatsapp_number?: string;
}

export default function BulkUploadModal({
  isOpen,
  onClose,
  teamId,
  onSuccess,
}: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [mode, setMode] = useState<'invite' | 'direct'>('direct'); // Default to direct add

  if (!isOpen) return null;

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    const headers = lines[0]
      .toLowerCase()
      .split(',')
      .map((h) => h.trim());

    const requiredHeaders = ['full_name'];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        if (values[index]) {
          row[header] = values[index];
        }
      });

      // Validate email if provided
      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        throw new Error(`Invalid email on line ${i + 1}: ${row.email}`);
      }

      // Validate full_name
      if (!row.full_name || row.full_name.trim() === '') {
        throw new Error(`Missing full name on line ${i + 1}`);
      }

      // Set defaults
      row.role = row.role || 'player';
      if (!['player', 'coach', 'analyst'].includes(row.role)) {
        throw new Error(
          `Invalid role on line ${i + 1}: ${row.role}. Must be player, coach, or analyst`
        );
      }

      rows.push(row as CSVRow);
    }

    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setErrors([]);
    } else {
      setErrors(['Please select a valid CSV file']);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setErrors([]);
    setSuccessCount(0);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        throw new Error('No valid data found in CSV file');
      }

      const supabase = createClient();
      let successfulAdds = 0;
      const addErrors: string[] = [];

      // Get current user for created_by field
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mode === 'direct') {
        // Directly create pending team members
        for (const row of rows) {
          try {
            // Check if a player with this name already exists (to avoid duplicates)
            const { data: existingMember } = await supabase
              .from('team_members')
              .select('id')
              .eq('team_id', teamId)
              .eq('pending_player_name', row.full_name)
              .eq('is_pending', true)
              .single();

            if (existingMember) {
              addErrors.push(
                `${row.full_name}: A pending player with this name already exists`
              );
              continue;
            }

            // Create as pending team member
            const { error } = await supabase.from('team_members').insert({
              team_id: teamId,
              role: row.role,
              jersey_number: row.jersey_number || null,
              is_pending: true,
              pending_player_name: row.full_name.trim(),
              pending_player_position: row.position?.trim() || null,
              user_id: null, // Important: null user_id for pending players
            });

            if (error) {
              addErrors.push(`${row.full_name}: ${error.message}`);
            } else {
              successfulAdds++;
            }
          } catch (err) {
            addErrors.push(`${row.full_name}: Failed to process`);
          }
        }
      } else {
        // Create invitations (existing logic)
        for (const row of rows) {
          try {
            if (!row.email) {
              addErrors.push(
                `${row.full_name}: Email is required for sending invitations`
              );
              continue;
            }

            const { error } = await supabase.from('team_invitations').insert({
              team_id: teamId,
              email: row.email.toLowerCase(),
              role: row.role,
              expires_at: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
              metadata: {
                full_name: row.full_name,
                jersey_number: row.jersey_number
                  ? parseInt(row.jersey_number)
                  : null,
                phone_number: row.phone_number,
                whatsapp_number: row.whatsapp_number,
              },
            });

            if (error) {
              if (error.code === '23505') {
                addErrors.push(`${row.email}: Already invited`);
              } else {
                addErrors.push(`${row.email}: ${error.message}`);
              }
            } else {
              successfulAdds++;
            }
          } catch (err) {
            addErrors.push(`${row.email}: Failed to process`);
          }
        }
      }

      setSuccessCount(successfulAdds);
      if (addErrors.length > 0) {
        setErrors(addErrors);
      }

      if (successfulAdds > 0) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err) {
      setErrors([
        err instanceof Error ? err.message : 'Failed to process CSV file',
      ]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Bulk Upload Team Members</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Mode Selection */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Upload Mode</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    value="direct"
                    checked={mode === 'direct'}
                    onChange={(e) =>
                      setMode(e.target.value as 'invite' | 'direct')
                    }
                    className="text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Direct Add (Recommended)</div>
                    <div className="text-sm text-gray-600">
                      Add players as pending members that can be tagged
                      immediately
                    </div>
                  </div>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    value="invite"
                    checked={mode === 'invite'}
                    onChange={(e) =>
                      setMode(e.target.value as 'invite' | 'direct')
                    }
                    className="text-blue-600"
                  />
                  <div>
                    <div className="font-medium">Send Invitations</div>
                    <div className="text-sm text-gray-600">
                      Create invitations (requires email setup)
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                CSV Upload Guide
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>
                  Download the{' '}
                  <a
                    href="/templates/team-roster-template.csv"
                    download
                    className="underline font-medium"
                  >
                    template CSV file
                  </a>
                </li>
                <li>Fill in the required field: full_name</li>
                <li>
                  Optional fields:{' '}
                  {mode === 'direct'
                    ? 'jersey_number, position, role'
                    : 'email, jersey_number, phone_number, whatsapp_number, role'}
                </li>
                <li>Role defaults to "player" if not specified</li>
                <li>Save the file as CSV and upload below</li>
              </ol>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>

            {/* CSV Format Example */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-2">
                CSV Format Example:
              </h4>
              <pre className="text-xs overflow-x-auto">
                {mode === 'direct'
                  ? `full_name,jersey_number,position,role
John Doe,7,Forward,player
Jane Smith,10,Midfielder,player
Coach Williams,,,coach`
                  : `email,full_name,jersey_number,role,phone_number,whatsapp_number
john.doe@example.com,John Doe,7,player,+1234567890,+1234567890
jane.smith@example.com,Jane Smith,10,player,+0987654321,+0987654321`}
              </pre>
            </div>

            {/* Success Message */}
            {successCount > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">
                  {mode === 'direct'
                    ? `Successfully added ${successCount} player${successCount > 1 ? 's' : ''}!`
                    : `Successfully sent ${successCount} invitation${successCount > 1 ? 's' : ''}!`}
                </p>
              </div>
            )}

            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!file || uploading}>
                {uploading
                  ? 'Processing...'
                  : mode === 'direct'
                    ? 'Upload & Add Players'
                    : 'Upload & Send Invites'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
