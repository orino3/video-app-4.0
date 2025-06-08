'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface Tag {
  name: string;
  category: string;
}

interface CompactTagSelectorProps {
  onSave: (tags: Tag[]) => void;
  onCancel: () => void;
  initialTags?: Tag[];
}

// Simplified tag categories for compact view
const QUICK_TAGS = {
  offensive: [
    'Fast Break',
    'Pick & Roll',
    'Zone Attack',
    'Drive',
    'Post Up',
    'Screen',
    'Cut',
    'Isolation',
  ],
  defensive: [
    'Man Defense',
    'Zone Defense',
    'Press',
    'Steal',
    'Block',
    'Rebound',
    'Help Defense',
    'Switch',
  ],
  outcome: [
    'Score',
    'Assist',
    'Turnover',
    'Foul',
    'Missed Shot',
    'Offensive Rebound',
    'Defensive Rebound',
  ],
  transition: ['Fast Break', 'Transition Defense', 'Outlet Pass', 'Leak Out'],
  technical: ['Timeout', 'Substitution', 'Technical Foul', 'Out of Bounds'],
};

export function CompactTagSelector({
  onSave,
  onCancel,
  initialTags = [],
}: CompactTagSelectorProps) {
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialTags);
  const [showMore, setShowMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleTag = (tag: Tag) => {
    const exists = selectedTags.some(
      (t) => t.name === tag.name && t.category === tag.category
    );
    if (exists) {
      setSelectedTags(
        selectedTags.filter(
          (t) => !(t.name === tag.name && t.category === tag.category)
        )
      );
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const isTagSelected = (tagName: string, category: string) => {
    return selectedTags.some(
      (t) => t.name === tagName && t.category === category
    );
  };

  return (
    <div className="bg-gray-800 rounded p-3 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-gray-300">Select Tags</h4>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-300"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 pb-2 border-b border-gray-700">
          {selectedTags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-900 text-blue-200"
            >
              {tag.name}
              <button
                onClick={() => toggleTag(tag)}
                className="ml-1 hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search tags..."
        className="w-full px-2 py-1 text-xs bg-gray-700 text-gray-200 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
      />

      {/* Quick tags */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {Object.entries(QUICK_TAGS).map(([category, tags]) => {
          // Filter tags based on search
          const filteredTags = tags.filter((tag) =>
            searchTerm ? tag.toLowerCase().includes(searchTerm.toLowerCase()) : true
          );

          if (filteredTags.length === 0) return null;

          return (
            <div key={category}>
              <p className="text-xs text-gray-400 mb-1 capitalize">{category}</p>
              <div className="flex flex-wrap gap-1">
                {filteredTags.map((tagName) => (
                  <button
                    key={tagName}
                    onClick={() => toggleTag({ name: tagName, category })}
                    className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                      isTagSelected(tagName, category)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {tagName}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="flex-1 text-xs py-1"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => onSave(selectedTags)}
          className="flex-1 text-xs py-1 bg-blue-600 hover:bg-blue-700"
        >
          Add ({selectedTags.length})
        </Button>
      </div>
    </div>
  );
}