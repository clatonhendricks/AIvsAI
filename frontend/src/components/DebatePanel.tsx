import React, { useRef, useEffect } from 'react';
import type { Debater, DebateTurn } from '../types/debate';
import { MessageBubble } from './MessageBubble';

interface DebatePanelProps {
  debater: Debater;
  position: string;
  modelName: string;
  turns: DebateTurn[];
  streamingContent: string;
  isActive: boolean;
}

export const DebatePanel: React.FC<DebatePanelProps> = ({
  debater,
  position,
  modelName,
  turns,
  streamingContent,
  isActive,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, streamingContent]);

  const headerColor = debater === 'A' ? 'bg-blue-600' : 'bg-green-600';
  const filteredTurns = turns.filter((t) => t.debater === debater);
  const currentTurnNumber = filteredTurns.length + 1;

  return (
    <div className="flex flex-col h-full border border-gray-300 rounded-lg overflow-hidden">
      {/* Header */}
      <div className={`${headerColor} text-white p-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Debater {debater}</h2>
            <p className="text-sm opacity-90">{modelName}</p>
          </div>
          {isActive && (
            <span className="flex items-center text-sm">
              <span className="animate-pulse mr-2 text-xl">●</span> Thinking
            </span>
          )}
        </div>
        <p className="mt-2 text-sm italic">Position: {position}</p>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 bg-gray-50"
      >
        {filteredTurns.map((turn, index) => (
          <MessageBubble
            key={index}
            content={turn.content}
            debater={debater}
            turnNumber={turn.turn_number}
          />
        ))}
        
        {/* Streaming content */}
        {streamingContent && (
          <MessageBubble
            content={streamingContent}
            debater={debater}
            turnNumber={currentTurnNumber}
            isStreaming={true}
          />
        )}
        
        {/* Empty state */}
        {filteredTurns.length === 0 && !streamingContent && (
          <div className="text-center text-gray-400 py-8">
            Waiting for debate to start...
          </div>
        )}
      </div>
    </div>
  );
};
