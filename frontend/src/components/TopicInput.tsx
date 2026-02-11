import React from 'react';

interface TopicInputProps {
  topic: string;
  onTopicChange: (topic: string) => void;
  disabled?: boolean;
}

export const TopicInput: React.FC<TopicInputProps> = ({
  topic,
  onTopicChange,
  disabled = false,
}) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Debate Topic
      </label>
      <input
        type="text"
        value={topic}
        onChange={(e) => onTopicChange(e.target.value)}
        disabled={disabled}
        placeholder="Enter a topic for the AI models to debate..."
        className="w-full p-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
      />
    </div>
  );
};
