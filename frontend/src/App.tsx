import { useState, useEffect, useRef } from 'react';
import { useDebate } from './hooks/useDebate';
import { fetchProviders, exportDebate, importDebate } from './services/api';
import { DebateArena } from './components/DebateArena';
import { ModelSelector } from './components/ModelSelector';
import { TopicInput } from './components/TopicInput';
import { ControlBar } from './components/ControlBar';
import type { ModelInfo, ProviderType, DebateMode, DebateConfig, DebateExport } from './types/debate';

function App() {
  // Debate hook
  const {
    debateState,
    isConnected,
    streamingContent,
    error,
    startNewDebate,
    triggerNextTurn,
    pauseDebate,
    resumeDebate,
  } = useDebate();

  // Configuration state
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<DebateMode>('manual');
  const [maxTurns, setMaxTurns] = useState(10);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Debater A config
  const [providerA, setProviderA] = useState<ProviderType>('openai');
  const [modelA, setModelA] = useState('');
  const [positionA, setPositionA] = useState('');
  const [maxTokensA, setMaxTokensA] = useState(350);

  // Debater B config
  const [providerB, setProviderB] = useState<ProviderType>('anthropic');
  const [modelB, setModelB] = useState('');
  const [positionB, setPositionB] = useState('');
  const [maxTokensB, setMaxTokensB] = useState(350);

  // File input ref for loading debates
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch available providers and models on mount
  useEffect(() => {
    async function loadProviders() {
      try {
        const status = await fetchProviders();
        const allModels: ModelInfo[] = [
          ...status.openai.models,
          ...status.anthropic.models,
          ...status.ollama.models,
        ];
        setAvailableModels(allModels);

        // Set default models
        if (status.openai.models.length > 0) {
          setModelA(status.openai.models[0].id);
        }
        if (status.anthropic.models.length > 0) {
          setModelB(status.anthropic.models[0].id);
        }
      } catch (e) {
        console.error('Failed to fetch providers:', e);
      } finally {
        setLoading(false);
      }
    }
    loadProviders();
  }, []);

  // Update model when provider changes
  useEffect(() => {
    const models = availableModels.filter((m) => m.provider === providerA);
    if (models.length > 0 && !models.find((m) => m.id === modelA)) {
      setModelA(models[0].id);
    }
  }, [providerA, availableModels]);

  useEffect(() => {
    const models = availableModels.filter((m) => m.provider === providerB);
    if (models.length > 0 && !models.find((m) => m.id === modelB)) {
      setModelB(models[0].id);
    }
  }, [providerB, availableModels]);

  const handleStart = async () => {
    if (!topic || !modelA || !modelB || !positionA || !positionB) {
      alert('Please fill in all fields: topic, models, and positions');
      return;
    }

    const config: DebateConfig = {
      topic,
      debater_a: {
        provider: providerA,
        model: modelA,
        position: positionA,
        max_tokens: maxTokensA,
      },
      debater_b: {
        provider: providerB,
        model: modelB,
        position: positionB,
        max_tokens: maxTokensB,
      },
      mode,
      max_turns: maxTurns,
    };

    await startNewDebate(config);
  };

  const handleSaveDebate = async () => {
    if (!debateState) return;
    
    try {
      const data = await exportDebate(debateState.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `debate-${debateState.id.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to save debate:', e);
      alert('Failed to save debate');
    }
  };

  const handleLoadDebate = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const debateExport: DebateExport = JSON.parse(text);
      
      // Restore config to UI
      setTopic(debateExport.config.topic);
      setMode(debateExport.config.mode);
      setMaxTurns(debateExport.config.max_turns || 10);
      
      setProviderA(debateExport.config.debater_a.provider);
      setModelA(debateExport.config.debater_a.model);
      setPositionA(debateExport.config.debater_a.position);
      setMaxTokensA(debateExport.config.debater_a.max_tokens || 350);
      
      setProviderB(debateExport.config.debater_b.provider);
      setModelB(debateExport.config.debater_b.model);
      setPositionB(debateExport.config.debater_b.position);
      setMaxTokensB(debateExport.config.debater_b.max_tokens || 350);

      // Import to backend and start viewing
      await importDebate(debateExport);
      alert('Debate loaded successfully! Click Start to continue the debate.');
    } catch (err) {
      console.error('Failed to load debate:', err);
      alert('Failed to load debate file');
    }
    
    // Reset file input
    e.target.value = '';
  };

  const isDebateActive = debateState !== null && debateState.status !== 'idle';
  const status = debateState?.status || 'idle';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Hidden file input for loading debates */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".json"
        className="hidden"
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">🎭 AI Debater</h1>
            <div className="flex items-center gap-4">
              {/* Save/Load Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleLoadDebate}
                  className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  📂 Load
                </button>
                {debateState && debateState.turns.length > 0 && (
                  <button
                    onClick={handleSaveDebate}
                    className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
                  >
                    💾 Save
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
                <span className="text-sm text-gray-500">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
        {/* Configuration Section */}
        {!isDebateActive && (
          <div className="space-y-6">
            {/* Topic Input */}
            <TopicInput
              topic={topic}
              onTopicChange={setTopic}
              disabled={isDebateActive}
            />

            {/* Model Selectors */}
            <div className="grid grid-cols-2 gap-6">
              <ModelSelector
                label="Debater A"
                selectedProvider={providerA}
                selectedModel={modelA}
                position={positionA}
                maxTokens={maxTokensA}
                availableModels={availableModels}
                onProviderChange={setProviderA}
                onModelChange={setModelA}
                onPositionChange={setPositionA}
                onMaxTokensChange={setMaxTokensA}
                disabled={isDebateActive}
              />
              <ModelSelector
                label="Debater B"
                selectedProvider={providerB}
                selectedModel={modelB}
                position={positionB}
                maxTokens={maxTokensB}
                availableModels={availableModels}
                onProviderChange={setProviderB}
                onModelChange={setModelB}
                onPositionChange={setPositionB}
                onMaxTokensChange={setMaxTokensB}
                disabled={isDebateActive}
              />
            </div>

            {/* Max Turns (for Auto mode) */}
            <div className="bg-white p-4 rounded-lg border border-gray-300">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">
                  Max Turns (total):
                </label>
                <input
                  type="number"
                  value={maxTurns}
                  onChange={(e) => setMaxTurns(parseInt(e.target.value) || 10)}
                  min={2}
                  max={50}
                  className="w-20 p-2 border border-gray-300 rounded-md"
                />
                <span className="text-sm text-gray-500">
                  (Limits total exchanges in Auto mode)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Control Bar - shown at top when not in debate */}
        {!isDebateActive && (
          <ControlBar
            status={status}
            mode={mode}
            onModeChange={setMode}
            onStart={handleStart}
            onPause={pauseDebate}
            onResume={resumeDebate}
            onNextTurn={triggerNextTurn}
            disabled={!topic || !modelA || !modelB || !positionA || !positionB}
          />
        )}

        {/* Debate Arena */}
        {debateState && (
          <div className="flex-1 min-h-[500px]">
            <DebateArena
              turns={debateState.turns}
              streamingContent={streamingContent}
              currentDebater={debateState.current_debater}
              isRunning={debateState.status === 'running'}
              debaterAModel={modelA}
              debaterBModel={modelB}
              debaterAPosition={positionA}
              debaterBPosition={positionB}
            />
          </div>
        )}

        {/* Control Bar - shown at bottom during active debate */}
        {isDebateActive && (
          <div className="sticky bottom-4">
            <ControlBar
              status={status}
              mode={mode}
              onModeChange={setMode}
              onStart={handleStart}
              onPause={pauseDebate}
              onResume={resumeDebate}
              onNextTurn={triggerNextTurn}
              disabled={!topic || !modelA || !modelB || !positionA || !positionB}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          AI Debater - Watch AI models argue different perspectives
        </div>
      </footer>
    </div>
  );
}

export default App;
