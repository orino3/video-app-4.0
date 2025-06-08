'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface Tag {
  name: string;
  category: string;
}

interface TagSelectorProps {
  onSave: (tags: Tag[]) => void;
  onCancel: () => void;
  initialTags?: Tag[];
}

// Pre-defined tag categories and options
const TAG_CATEGORIES = {
  offensive: {
    label: 'Offensive',
    color: 'text-red-600 bg-red-50 border-red-200',
    tags: [
      'Fast Break',
      'Pick & Roll',
      'Zone Attack',
      'Isolation Play',
      'Post Up',
      'Screen',
      'Cut',
      'Drive',
    ],
  },
  defensive: {
    label: 'Defensive',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    tags: [
      'Man Defense',
      'Zone Defense',
      'Press',
      'Help Defense',
      'Switch',
      'Rotation',
      'Steal',
      'Block',
    ],
  },
  transition: {
    label: 'Transition',
    color: 'text-green-600 bg-green-50 border-green-200',
    tags: [
      'Offensive Rebound',
      'Defensive Rebound',
      'Outlet Pass',
      'Transition Defense',
      'Early Offense',
    ],
  },
  technical: {
    label: 'Technical',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    tags: [
      'Shooting Form',
      'Footwork',
      'Ball Handling',
      'Passing',
      'Positioning',
      'Communication',
    ],
  },
  situational: {
    label: 'Situational',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    tags: [
      'Out of Bounds',
      'End of Quarter',
      'Shot Clock',
      'Timeout',
      'Substitution',
      'Foul Trouble',
    ],
  },
  outcome: {
    label: 'Outcome',
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    tags: [
      'Score',
      'Assist',
      'Turnover',
      'Foul',
      'Violation',
      'Good Defense',
      'Good Offense',
    ],
  },
};

export function TagSelector({
  onSave,
  onCancel,
  initialTags = [],
}: TagSelectorProps) {
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialTags);
  const [customTag, setCustomTag] = useState('');
  const [customCategory, setCustomCategory] = useState('custom');
  const [activeCategory, setActiveCategory] = useState<string>('all');

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

  const addCustomTag = () => {
    if (customTag.trim()) {
      const newTag = { name: customTag.trim(), category: customCategory };
      if (!selectedTags.some((t) => t.name === newTag.name)) {
        setSelectedTags([...selectedTags, newTag]);
        setCustomTag('');
      }
    }
  };

  const isTagSelected = (tagName: string, category: string) => {
    return selectedTags.some(
      (t) => t.name === tagName && t.category === category
    );
  };

  const getFilteredCategories = () => {
    if (activeCategory === 'all') {
      return Object.entries(TAG_CATEGORIES);
    }
    return Object.entries(TAG_CATEGORIES).filter(
      ([key]) => key === activeCategory
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-2xl border border-gray-300 p-3 w-full max-w-sm overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900">Add Tags</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 p-0.5"
          title="Close"
        >
          <svg
            className="w-4 h-4"
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

      {/* Category selector bar */}
      <div className="flex gap-1 mb-2 pb-2 border-b overflow-x-auto">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap transition-colors ${
            activeCategory === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {Object.entries(TAG_CATEGORIES).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap transition-colors ${
              activeCategory === key
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Selected tags display - more compact */}
      {selectedTags.length > 0 && (
        <div className="mb-2 p-1.5 bg-gray-50 rounded text-xs max-h-16 overflow-y-auto">
          <span className="text-gray-600">Selected: </span>
          {selectedTags.map((tag, index) => (
            <span
              key={index}
              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs mr-1 mb-1 ${
                TAG_CATEGORIES[tag.category as keyof typeof TAG_CATEGORIES]
                  ?.color || 'text-gray-600 bg-gray-100'
              }`}
            >
              {tag.name}
              <button
                onClick={() => toggleTag(tag)}
                className="ml-1 hover:text-red-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Tag categories - scrollable */}
      <div className="flex-1 overflow-y-auto mb-2 pr-1">
        <div className="space-y-2">
          {getFilteredCategories().map(([category, config]) => (
            <div key={category}>
              <h4 className="text-xs font-medium text-gray-700 mb-1">
                {config.label}
              </h4>
              <div className="flex flex-wrap gap-1">
                {config.tags.map((tagName) => (
                  <button
                    key={tagName}
                    onClick={() => toggleTag({ name: tagName, category })}
                    className={`px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                      isTagSelected(tagName, category)
                        ? config.color
                        : 'text-gray-600 bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {tagName}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom tag input - even more compact */}
      <div className="border-t pt-1.5 mb-2">
        <div className="flex gap-1">
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
            placeholder="Custom tag"
            className="flex-1 px-1.5 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Button
            size="sm"
            onClick={addCustomTag}
            disabled={!customTag.trim()}
            className="text-xs px-2 py-1"
          >
            Add
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 pt-1.5 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="flex-1 text-xs py-1"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={() => onSave(selectedTags)}
          className="flex-1 text-xs py-1"
        >
          Save ({selectedTags.length})
        </Button>
      </div>
    </div>
  );
}
