import React from 'react';
import { DebatePanel } from './DebatePanel';
import type { DebateTurn } from '../types/debate';

interface DebateArenaProps {
  turns: DebateTurn[];
  streamingContent: { A: string; B: string };
  currentDebater: 'A' | 'B';
  isRunning: boolean;
  debaterAModel: string;
  debaterBModel: string;
  debaterAPosition: string;
  debaterBPosition: string;
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
}) => {
  return (
    <div className="flex gap-4 h-full">
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
  );
};
