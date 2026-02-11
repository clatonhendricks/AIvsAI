import type { DebateConfig, DebateState, DebateExport, ProvidersStatus } from '../types/debate';

const API_BASE = '/api';

export async function fetchProviders(): Promise<ProvidersStatus> {
  const response = await fetch(`${API_BASE}/providers/available`);
  if (!response.ok) {
    throw new Error('Failed to fetch providers');
  }
  return response.json();
}

export async function startDebate(config: DebateConfig): Promise<DebateState> {
  const response = await fetch(`${API_BASE}/debate/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });
  if (!response.ok) {
    throw new Error('Failed to start debate');
  }
  return response.json();
}

export async function getDebate(debateId: string): Promise<DebateState> {
  const response = await fetch(`${API_BASE}/debate/${debateId}`);
  if (!response.ok) {
    throw new Error('Failed to get debate');
  }
  return response.json();
}

export async function exportDebate(debateId: string): Promise<DebateExport> {
  const response = await fetch(`${API_BASE}/debate/${debateId}/export`);
  if (!response.ok) {
    throw new Error('Failed to export debate');
  }
  return response.json();
}

export async function importDebate(debateExport: DebateExport): Promise<DebateState> {
  const response = await fetch(`${API_BASE}/debate/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(debateExport),
  });
  if (!response.ok) {
    throw new Error('Failed to import debate');
  }
  return response.json();
}

export async function triggerNextTurn(debateId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/debate/${debateId}/next-turn`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to trigger next turn');
  }
}

export async function pauseDebate(debateId: string): Promise<DebateState> {
  const response = await fetch(`${API_BASE}/debate/${debateId}/pause`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to pause debate');
  }
  return response.json();
}

export async function resumeDebate(debateId: string): Promise<DebateState> {
  const response = await fetch(`${API_BASE}/debate/${debateId}/resume`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to resume debate');
  }
  return response.json();
}

export function createDebateWebSocket(debateId: string): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return new WebSocket(`${protocol}//${host}/api/debate/${debateId}/ws`);
}
