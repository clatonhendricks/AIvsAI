import React, { useState } from 'react';
import { DebatePanel } from './DebatePanel';
import type { DebateTurn } from '../types/debate';

type ViewMode = 'chat' | 'side-by-side';

interface DebateArenaProps {
  turns: DebateTurn[];
  streamingContent: { A: string; B: string };
  currentDebater: 'A' | 'B';
  isRunning: boolean;
  debaterAModel: string;
  debaterBModel: string;
  debaterAPosition: string;
  debaterBPosition: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const DebateArena: React.FC<DebateArenaProps> = ({
  turns,
  streamingContent,
  currentDebater,
  isRunning,
  debaterAModel,
  debaterBModel,
  debaterAPosition,
  debaterBPosition,
  viewMode,
  onViewModeChange,
}) => {
  const [expandedTurn, setExpandedTurn] = useState<number | null>(null);

  const handleTurnClick = (turnNumber: number) => {
    setExpandedTurn(expandedTurn === turnNumber ? null : turnNumber);
  };

  // Sort turns by turn_number for chat view
  const sortedTurns = [...turns].sort((a, b) => a.turn_number - b.turn_number);

  return (
    <div className="h-full flex flex-col">
      {/* View Mode Toggle */}
      <div className="flex justify-end mb-2">
        <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
          <button
            onClick={() => onViewModeChange('chat')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'chat'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            💬 Chat
          </button>
          <button
            onClick={() => onViewModeChange('side-by-side')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'side-by-side'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className={viewMode === 'side-by-side' ? 'text-blue-200' : 'text-blue-500'}>■</span><span className={viewMode === 'side-by-side' ? 'text-green-200' : 'text-green-500'}>■</span> Side by Side
          </button>
        </div>
      </div>

      {viewMode === 'side-by-side' ? (
        <div className="flex gap-4 flex-1">
          {/* Debater A Panel */}
          <div className="flex-1 min-w-0">
            <DebatePanel
              debater="A"
              position={debaterAPosition}
              modelName={debaterAModel}
              turns={turns}
              streamingContent={streamingContent.A}
              isActive={isRunning && currentDebater === 'A'}
            />
          </div>

          {/* Divider */}
          <div className="w-1 bg-gray-300 rounded-full" />

          {/* Debater B Panel */}
          <div className="flex-1 min-w-0">
            <DebatePanel
              debater="B"
              position={debaterBPosition}
              modelName={debaterBModel}
              turns={turns}
              streamingContent={streamingContent.B}
              isActive={isRunning && currentDebater === 'B'}
            />
          </div>
        </div>
      ) : (
        /* Chat View */
        <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg border border-gray-300 p-4">
          {sortedTurns.map((turn) => {
            const isA = turn.debater === 'A';
            const bgColor = isA ? 'bg-blue-100 border-blue-300' : 'bg-green-100 border-green-300';
            const alignClass = isA ? 'mr-auto' : 'ml-auto';
            const modelName = isA ? debaterAModel : debaterBModel;
            const position = isA ? debaterAPosition : debaterBPosition;
            const isExpanded = expandedTurn === turn.turn_number;

            return (
              <div
                key={`${turn.debater}-${turn.turn_number}`}
                className={`max-w-[70%] mb-4 ${alignClass}`}
              >
                <div
                  className={`p-4 rounded-lg border ${bgColor} cursor-pointer`}
                  onClick={() => handleTurnClick(turn.turn_number)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600">
                      Debater {turn.debater} • {modelName} • Turn {turn.turn_number}
                    </span>
                    <span className="text-xs text-gray-500 italic">{position}</span>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">{turn.content}</p>
                  {isExpanded && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-gray-500">
                      💭 Model was thinking...
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Streaming content for current debater */}
          {(streamingContent.A || streamingContent.B) && (
            <div
              className={`max-w-[70%] mb-4 ${
                currentDebater === 'A' ? 'mr-auto' : 'ml-auto'
              }`}
            >
              <div
                className={`p-4 rounded-lg border ${
                  currentDebater === 'A'
                    ? 'bg-blue-100 border-blue-300'
                    : 'bg-green-100 border-green-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600">
                    Debater {currentDebater} • {currentDebater === 'A' ? debaterAModel : debaterBModel} • Turn {turns.filter(t => t.debater === currentDebater).length + 1}
                  </span>
                  <span className="flex items-center text-xs text-gray-500">
                    <span className="animate-pulse mr-1">●</span> Thinking...
                  </span>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap">
                  {currentDebater === 'A' ? streamingContent.A : streamingContent.B}
                </p>
              </div>
            </div>
          )}

          {/* Thinking indicator when running but no streaming yet */}
          {isRunning && !streamingContent.A && !streamingContent.B && (
            <div
              className={`max-w-[70%] mb-4 ${
                currentDebater === 'A' ? 'mr-auto' : 'ml-auto'
              }`}
            >
              <div
                className={`p-4 rounded-lg border ${
                  currentDebater === 'A'
                    ? 'bg-blue-100 border-blue-300'
                    : 'bg-green-100 border-green-300'
                }`}
              >
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="animate-pulse">●</span>
                  <span>Debater {currentDebater} is thinking...</span>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {sortedTurns.length === 0 && !streamingContent.A && !streamingContent.B && !isRunning && (
            <div className="text-center text-gray-400 py-8">
              Waiting for debate to start...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
