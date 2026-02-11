export type ProviderType = 'openai' | 'anthropic' | 'ollama';

export type DebateMode = 'manual' | 'auto';

export type DebateStatus = 'idle' | 'running' | 'paused' | 'completed';

export type Debater = 'A' | 'B';

export interface ModelInfo {
  id: string;
  name: string;
  provider: ProviderType;
  description: string;
}

export interface DebaterConfig {
  provider: ProviderType;
  model: string;
  position: string;
  temperature?: number;
  max_tokens?: number;
}

export interface DebateConfig {
  topic: string;
  debater_a: DebaterConfig;
  debater_b: DebaterConfig;
  mode: DebateMode;
  max_turns?: number;
  auto_delay_seconds?: number;
}

export interface DebateTurn {
  debater: Debater;
  content: string;
  timestamp: string;
  turn_number: number;
}

export interface DebateState {
  id: string;
  config: DebateConfig;
  status: DebateStatus;
  turns: DebateTurn[];
  current_turn: number;
  current_debater: Debater;
}

export interface DebateExport {
  config: DebateConfig;
  turns: DebateTurn[];
  exported_at: string;
}

// WebSocket event types
export type DebateEventType =
  | 'debate_started'
  | 'turn_started'
  | 'content_chunk'
  | 'turn_completed'
  | 'debate_paused'
  | 'debate_resumed'
  | 'waiting_for_trigger'
  | 'debate_completed'
  | 'error';

export interface DebateEvent {
  type: DebateEventType;
  debater?: Debater;
  chunk?: string;
  content?: string;
  turn_number?: number;
  debate_id?: string;
  next_debater?: Debater;
  total_turns?: number;
  turns?: DebateTurn[];
  error?: string;
}

export interface ProviderAvailability {
  available: boolean;
  models: ModelInfo[];
}

export interface ProvidersStatus {
  openai: ProviderAvailability;
  anthropic: ProviderAvailability;
  ollama: ProviderAvailability;
}
