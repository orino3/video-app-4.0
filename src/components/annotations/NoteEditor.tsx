'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';

interface NoteEditorProps {
  initialContent?: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function NoteEditor({
  initialContent = '',
  onSave,
  onCancel,
  placeholder = 'Add your coaching notes here...',
  autoFocus = true,
}: NoteEditorProps) {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
      textareaRef.current.setSelectionRange(content.length, content.length);
    }
  }, [autoFocus]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleSave = () => {
    const trimmedContent = content.trim();
    if (trimmedContent) {
      onSave(trimmedContent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900">Add Note</h3>
        <div className="text-xs text-gray-500">
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
            Ctrl+Enter
          </kbd>{' '}
          to save
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        style={{ overflow: 'hidden' }}
      />

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!content.trim()}>
          Save Note
        </Button>
      </div>
    </div>
  );
}
