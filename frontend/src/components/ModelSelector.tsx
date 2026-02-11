import React from 'react';
import type { ModelInfo, ProviderType } from '../types/debate';

interface ModelSelectorProps {
  label: string;
  selectedProvider: ProviderType;
  selectedModel: string;
  position: string;
  maxTokens: number;
  availableModels: ModelInfo[];
  onProviderChange: (provider: ProviderType) => void;
  onModelChange: (model: string) => void;
  onPositionChange: (position: string) => void;
  onMaxTokensChange: (maxTokens: number) => void;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  label,
  selectedProvider,
  selectedModel,
  position,
  maxTokens,
  availableModels,
  onProviderChange,
  onModelChange,
  onPositionChange,
  onMaxTokensChange,
  disabled = false,
}) => {
  const providers: ProviderType[] = ['openai', 'anthropic', 'ollama'];
  const filteredModels = availableModels.filter((m) => m.provider === selectedProvider);

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-white">
      <h3 className="font-semibold text-lg mb-3">{label}</h3>
      
      {/* Provider Selection */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Provider
        </label>
        <select
          value={selectedProvider}
          onChange={(e) => onProviderChange(e.target.value as ProviderType)}
          disabled={disabled}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          {providers.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Model Selection */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Model
        </label>
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={disabled || filteredModels.length === 0}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          {filteredModels.length === 0 ? (
            <option value="">No models available</option>
          ) : (
            filteredModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Max Tokens Input */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Max Tokens per Turn
        </label>
        <input
          type="number"
          value={maxTokens}
          onChange={(e) => onMaxTokensChange(parseInt(e.target.value) || 350)}
          disabled={disabled}
          min={50}
          max={4000}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
      </div>

      {/* Position Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Position / Stance
        </label>
        <textarea
          value={position}
          onChange={(e) => onPositionChange(e.target.value)}
          disabled={disabled}
          placeholder="e.g., 'In favor of renewable energy'"
          rows={3}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 resize-none"
          style={{ wordWrap: 'break-word' }}
        />
      </div>
    </div>
  );
};
