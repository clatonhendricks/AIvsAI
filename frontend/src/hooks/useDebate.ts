import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  DebateConfig,
  DebateState,
  DebateEvent,
  DebateTurn,
  DebateStatus,
} from '../types/debate';
import { startDebate, createDebateWebSocket } from '../services/api';

interface UseDebateReturn {
  debateState: DebateState | null;
  isConnected: boolean;
  streamingContent: { A: string; B: string };
  error: string | null;
  startNewDebate: (config: DebateConfig) => Promise<void>;
  triggerNextTurn: () => void;
  pauseDebate: () => void;
  resumeDebate: () => void;
}

export function useDebate(): UseDebateReturn {
  const [debateState, setDebateState] = useState<DebateState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [streamingContent, setStreamingContent] = useState<{ A: string; B: string }>({
    A: '',
    B: '',
  });
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const debateIdRef = useRef<string | null>(null);

  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const data: DebateEvent = JSON.parse(event.data);
      
      switch (data.type) {
        case 'debate_started':
          setDebateState((prev) =>
            prev ? { ...prev, status: 'running' as DebateStatus } : prev
          );
          break;

        case 'turn_started':
          // Clear streaming content for this debater
          if (data.debater) {
            setStreamingContent((prev) => ({ ...prev, [data.debater!]: '' }));
          }
          break;

        case 'content_chunk':
          if (data.debater && data.chunk) {
            setStreamingContent((prev) => ({
              ...prev,
              [data.debater!]: prev[data.debater!] + data.chunk,
            }));
          }
          break;

        case 'turn_completed':
          if (data.debater && data.content) {
            const newTurn: DebateTurn = {
              debater: data.debater,
              content: data.content,
              timestamp: new Date().toISOString(),
              turn_number: data.turn_number || 0,
            };
            setDebateState((prev) =>
              prev
                ? {
                    ...prev,
                    turns: [...prev.turns, newTurn],
                    current_turn: (data.turn_number || 0),
                    current_debater: data.debater === 'A' ? 'B' : 'A',
                  }
                : prev
            );
            // Clear streaming content after turn completes
            setStreamingContent((prev) => ({ ...prev, [data.debater!]: '' }));
          }
          break;

        case 'debate_paused':
          setDebateState((prev) =>
            prev ? { ...prev, status: 'paused' as DebateStatus } : prev
          );
          break;

        case 'debate_resumed':
          setDebateState((prev) =>
            prev ? { ...prev, status: 'running' as DebateStatus } : prev
          );
          break;

        case 'waiting_for_trigger':
          setDebateState((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'paused' as DebateStatus,
                  current_debater: data.next_debater || prev.current_debater,
                }
              : prev
          );
          break;

        case 'debate_completed':
          setDebateState((prev) =>
            prev ? { ...prev, status: 'completed' as DebateStatus } : prev
          );
          break;

        case 'error':
          setError(data.error || 'Unknown error occurred');
          break;
      }
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e);
    }
  }, []);

  const startNewDebate = useCallback(async (config: DebateConfig) => {
    try {
      setError(null);
      setStreamingContent({ A: '', B: '' });
      
      // Start the debate via REST API
      const state = await startDebate(config);
      setDebateState(state);
      debateIdRef.current = state.id;

      // Close existing WebSocket if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Connect via WebSocket for streaming
      const ws = createDebateWebSocket(state.id);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = handleWebSocketMessage;

      ws.onerror = () => {
        setError('WebSocket connection error');
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start debate');
    }
  }, [handleWebSocketMessage]);

  const triggerNextTurn = useCallback(() => {
    if (debateIdRef.current) {
      fetch(`/api/debate/${debateIdRef.current}/resume`, { method: 'POST' });
    }
  }, []);

  const pauseDebate = useCallback(() => {
    if (debateIdRef.current) {
      fetch(`/api/debate/${debateIdRef.current}/pause`, { method: 'POST' });
    }
  }, []);

  const resumeDebate = useCallback(() => {
    if (debateIdRef.current) {
      fetch(`/api/debate/${debateIdRef.current}/resume`, { method: 'POST' });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    debateState,
    isConnected,
    streamingContent,
    error,
    startNewDebate,
    triggerNextTurn,
    pauseDebate,
    resumeDebate,
  };
}
