'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface FamilyMember {
  id: string;
  relationship: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  whatsapp_number?: string;
  is_primary_contact: boolean;
}

export default function PlayerProfile() {
  const { user } = useAuth();
  const [contactInfo, setContactInfo] = useState({
    phone_number: '',
    whatsapp_number: '',
  });
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [newFamilyMember, setNewFamilyMember] = useState({
    relationship: 'mother',
    full_name: '',
    email: '',
    phone_number: '',
    whatsapp_number: '',
    is_primary_contact: false,
  });

  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Note: phone_number and whatsapp_number fields don't exist in the users table
      // This feature would require adding these fields to the database schema
      setContactInfo({
        phone_number: '',
        whatsapp_number: '',
      });

      // Note: family_members table doesn't exist in the current schema
      // This feature would require creating the table first
      setFamilyMembers([]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Note: Cannot save phone numbers as these fields don't exist in the users table
      throw new Error('Phone number fields not available in database');
    } catch (error) {
      console.error('Error saving contact info:', error);
      alert('This feature is not yet available');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      // Note: family_members table doesn't exist in the current schema
      throw new Error('Family members feature not available');
    } catch (error) {
      console.error('Error adding family member:', error);
      alert('This feature is not yet available');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFamilyMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this family member?')) return;

    try {
      // Note: family_members table doesn't exist in the current schema
      throw new Error('Family members feature not available');
    } catch (error) {
      console.error('Error removing family member:', error);
      alert('This feature is not yet available');
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Contact Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Contact Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <Input
              type="tel"
              value={contactInfo.phone_number}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, phone_number: e.target.value })
              }
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp Number
            </label>
            <Input
              type="tel"
              value={contactInfo.whatsapp_number}
              onChange={(e) =>
                setContactInfo({
                  ...contactInfo,
                  whatsapp_number: e.target.value,
                })
              }
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div className="mt-4">
          <Button onClick={handleSaveContact} disabled={saving}>
            {saving ? 'Saving...' : 'Save Contact Info'}
          </Button>
        </div>
      </div>

      {/* Family Members */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Family Members</h2>
          <Button
            variant="outline"
            onClick={() => setShowAddFamily(true)}
            size="sm"
          >
            Add Family Member
          </Button>
        </div>

        {familyMembers.length === 0 ? (
          <p className="text-gray-500">No family members added yet.</p>
        ) : (
          <div className="space-y-3">
            {familyMembers.map((member) => (
              <div key={member.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">
                        {member.full_name}
                      </h3>
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded capitalize">
                        {member.relationship}
                      </span>
                      {member.is_primary_contact && (
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Primary Contact
                        </span>
                      )}
                    </div>

                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      {member.email && <div>Email: {member.email}</div>}
                      {member.phone_number && (
                        <div>Phone: {member.phone_number}</div>
                      )}
                      {member.whatsapp_number && (
                        <div>WhatsApp: {member.whatsapp_number}</div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveFamilyMember(member.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Family Member Modal */}
      {showAddFamily && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add Family Member
            </h3>

            <form onSubmit={handleAddFamilyMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship
                </label>
                <select
                  value={newFamilyMember.relationship}
                  onChange={(e) =>
                    setNewFamilyMember({
                      ...newFamilyMember,
                      relationship: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="mother">Mother</option>
                  <option value="father">Father</option>
                  <option value="grandfather">Grandfather</option>
                  <option value="grandmother">Grandmother</option>
                  <option value="guardian">Guardian</option>
                  <option value="sibling">Sibling</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={newFamilyMember.full_name}
                  onChange={(e) =>
                    setNewFamilyMember({
                      ...newFamilyMember,
                      full_name: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={newFamilyMember.email}
                  onChange={(e) =>
                    setNewFamilyMember({
                      ...newFamilyMember,
                      email: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={newFamilyMember.phone_number}
                  onChange={(e) =>
                    setNewFamilyMember({
                      ...newFamilyMember,
                      phone_number: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Number
                </label>
                <Input
                  type="tel"
                  value={newFamilyMember.whatsapp_number}
                  onChange={(e) =>
                    setNewFamilyMember({
                      ...newFamilyMember,
                      whatsapp_number: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newFamilyMember.is_primary_contact}
                    onChange={(e) =>
                      setNewFamilyMember({
                        ...newFamilyMember,
                        is_primary_contact: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Set as primary contact
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddFamily(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Adding...' : 'Add Family Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
