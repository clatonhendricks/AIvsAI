import React from 'react';
import type { Debater } from '../types/debate';

interface MessageBubbleProps {
  content: string;
  debater: Debater;
  turnNumber: number;
  isStreaming?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  debater,
  turnNumber,
  isStreaming = false,
}) => {
  const bgColor = debater === 'A' ? 'bg-blue-100' : 'bg-green-100';
  const borderColor = debater === 'A' ? 'border-blue-300' : 'border-green-300';

  return (
    <div className={`p-4 rounded-lg border ${bgColor} ${borderColor} mb-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-600">
          Turn {turnNumber}
        </span>
        {isStreaming && (
          <span className="flex items-center text-xs text-gray-500">
            <span className="animate-pulse mr-1">●</span> Typing...
          </span>
        )}
      </div>
      <p className="text-gray-800 whitespace-pre-wrap">{content}</p>
    </div>
  );
};
