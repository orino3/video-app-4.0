'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

interface ShareWithFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string;
  playerName: string;
  shareType: 'video' | 'compilation' | 'annotation' | 'stats';
  shareContent: any;
}

interface FamilyMember {
  id: string;
  relationship: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  whatsapp_number?: string;
  is_primary_contact: boolean;
}

export default function ShareWithFamilyModal({
  isOpen,
  onClose,
  playerId,
  playerName,
  shareType,
  shareContent,
}: ShareWithFamilyModalProps) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (isOpen && playerId) {
      fetchFamilyMembers();
    }
  }, [isOpen, playerId]);

  const fetchFamilyMembers = async () => {
    try {
      // Note: family_members table doesn't exist in the current schema
      // This feature would require creating the table first
      setFamilyMembers([]);
      setSelectedMembers([]);
    } catch (error) {
      console.error('Error fetching family members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (selectedMembers.length === 0) {
      alert('Please select at least one family member');
      return;
    }

    setSharing(true);
    try {
      // Note: family_share_history table doesn't exist in the current schema
      // This feature would require creating the table first
      throw new Error('Family sharing feature not available');
    } catch (error) {
      console.error('Error sharing with family:', error);
      alert('This feature is not yet available');
    } finally {
      setSharing(false);
    }
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Share with Family</h2>
              <p className="text-sm text-gray-600 mt-1">
                Share {shareType} with {playerName}'s family members
              </p>
            </div>
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
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">Loading family members...</div>
          ) : familyMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No family members found for this player
            </div>
          ) : (
            <div className="space-y-6">
              {/* Family Members Selection */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  Select Recipients
                </h3>
                <div className="space-y-2">
                  {familyMembers.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => toggleMember(member.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {member.full_name}
                          </span>
                          <span className="text-sm bg-gray-100 px-2 py-0.5 rounded capitalize">
                            {member.relationship}
                          </span>
                          {member.is_primary_contact && (
                            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {member.email && <div>Email: {member.email}</div>}
                          {member.phone_number && (
                            <div>Phone: {member.phone_number}</div>
                          )}
                          {member.whatsapp_number && (
                            <div>WhatsApp: {member.whatsapp_number}</div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add a Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a personal message to accompany the shared content..."
                />
              </div>

              {/* Share Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2">
                  Share Preview
                </h4>
                <div className="text-sm text-gray-600">
                  <div>
                    Type:{' '}
                    <span className="font-medium capitalize">{shareType}</span>
                  </div>
                  {shareContent.title && (
                    <div>
                      Title:{' '}
                      <span className="font-medium">{shareContent.title}</span>
                    </div>
                  )}
                  {shareContent.duration && (
                    <div>
                      Duration:{' '}
                      <span className="font-medium">
                        {shareContent.duration}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={sharing}>
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={sharing || selectedMembers.length === 0}
          >
            {sharing
              ? 'Sharing...'
              : `Share with ${selectedMembers.length} Family Member${selectedMembers.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
