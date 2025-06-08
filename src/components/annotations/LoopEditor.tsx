'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface LoopEditorProps {
  currentTime: number;
  duration: number;
  onSave: (loopStart: number, loopEnd: number, name?: string) => void;
  onCancel: () => void;
  onPreview?: (start: number, end: number) => void;
}

export function LoopEditor({
  currentTime,
  duration,
  onSave,
  onCancel,
  onPreview,
}: LoopEditorProps) {
  const [startTime, setStartTime] = useState(currentTime);
  const [loopDuration, setLoopDuration] = useState(5); // Default 5 seconds
  const [loopName, setLoopName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimeChange = (value: string) => {
    const [mins, secs] = value.split(':').map(Number);
    const totalSeconds = mins * 60 + (secs || 0);
    if (!isNaN(totalSeconds) && totalSeconds >= 0 && totalSeconds <= duration) {
      setStartTime(totalSeconds);
    }
  };

  const handleDurationChange = (value: string) => {
    const seconds = parseFloat(value);
    if (!isNaN(seconds) && seconds > 0) {
      setLoopDuration(seconds);
    }
  };

  const selectPreset = (seconds: number) => {
    setLoopDuration(seconds);
  };

  const handlePreview = () => {
    if (onPreview) {
      const endTime = Math.min(startTime + loopDuration, duration);
      setIsPlaying(true);
      onPreview(startTime, endTime);
      // Reset after loop duration
      setTimeout(() => setIsPlaying(false), loopDuration * 1000);
    }
  };

  const handleSave = () => {
    const endTime = Math.min(startTime + loopDuration, duration);
    onSave(startTime, endTime, loopName.trim() || undefined);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-full max-w-xs max-h-[50vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sticky top-0 bg-white z-10 pb-2">
        <h3 className="text-base font-medium text-gray-900">Create Loop</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 p-1"
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

      {/* Duration Presets */}
      <div className="mb-3">
        <p className="text-xs text-gray-700 font-medium mb-1.5">
          Select duration:
        </p>
        <div className="flex gap-1.5">
          {[5, 10, 15].map((seconds) => (
            <button
              key={seconds}
              onClick={() => selectPreset(seconds)}
              className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                loopDuration === seconds
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {seconds}s
            </button>
          ))}
        </div>
      </div>

      {/* Start Time and Custom Duration in one row */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Start Time
          </label>
          <input
            type="text"
            value={formatTime(startTime)}
            onChange={(e) => handleStartTimeChange(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder="0:00"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Duration (sec)
          </label>
          <input
            type="number"
            value={loopDuration}
            onChange={(e) => handleDurationChange(e.target.value)}
            min="0.5"
            step="0.5"
            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Loop Name */}
      <div className="mb-3">
        <input
          type="text"
          value={loopName}
          onChange={(e) => setLoopName(e.target.value)}
          placeholder="Loop name (optional)"
          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      {/* Summary */}
      <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
        <p className="text-gray-600">
          <span className="font-medium text-gray-900">
            {formatTime(startTime)}
          </span>
          {' → '}
          <span className="font-medium text-gray-900">
            {formatTime(Math.min(startTime + loopDuration, duration))}
          </span>{' '}
          ({loopDuration}s)
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="flex-1 text-xs py-1.5"
        >
          Cancel
        </Button>
        {onPreview && (
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={isPlaying}
            className="flex-1 text-xs py-1.5"
          >
            {isPlaying ? 'Playing...' : 'Preview'}
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleSave}
          className="flex-1 bg-green-600 hover:bg-green-700 text-xs py-1.5"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
