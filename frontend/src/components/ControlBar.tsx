import React from 'react';
import type { DebateMode, DebateStatus } from '../types/debate';

interface ControlBarProps {
  status: DebateStatus;
  mode: DebateMode;
  onModeChange: (mode: DebateMode) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onNextTurn: () => void;
  disabled?: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  status,
  mode,
  onModeChange,
  onStart,
  onPause,
  onResume,
  onNextTurn,
  disabled = false,
}) => {
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isCompleted = status === 'completed';
  const isIdle = status === 'idle';

  return (
    <div className="flex items-center justify-center gap-4 p-4 bg-gray-100 rounded-lg">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Mode:</span>
        <button
          onClick={() => onModeChange(mode === 'auto' ? 'manual' : 'auto')}
          disabled={!isIdle || disabled}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            mode === 'auto'
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {mode === 'auto' ? 'Auto' : 'Manual'}
        </button>
      </div>

      <div className="h-6 w-px bg-gray-300" />

      {/* Control Buttons */}
      {isIdle && (
        <button
          onClick={onStart}
          disabled={disabled}
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Debate
        </button>
      )}

      {isRunning && mode === 'auto' && (
        <button
          onClick={onPause}
          className="px-6 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors"
        >
          Pause
        </button>
      )}

      {isPaused && mode === 'auto' && (
        <button
          onClick={onResume}
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          Resume
        </button>
      )}

      {isPaused && mode === 'manual' && (
        <button
          onClick={onNextTurn}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Next Turn →
        </button>
      )}

      {isCompleted && (
        <span className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium">
          Debate Completed
        </span>
      )}

      {/* Status Indicator */}
      <div className="flex items-center gap-2 ml-4">
        <span
          className={`w-3 h-3 rounded-full ${
            isRunning
              ? 'bg-green-500 animate-pulse'
              : isPaused
              ? 'bg-yellow-500'
              : isCompleted
              ? 'bg-gray-500'
              : 'bg-gray-300'
          }`}
        />
        <span className="text-sm text-gray-600 capitalize">{status}</span>
      </div>
    </div>
  );
};
