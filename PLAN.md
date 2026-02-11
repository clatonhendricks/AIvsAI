# AI Debater App - Implementation Plan

## Problem Statement
Create an AI debater application where users can select two AI models to debate on a topic. The UI is split into two panels showing each model's responses in real-time. Models respond to each other in turns, creating an interactive debate experience.

## Key Requirements
- **Multi-provider support**: OpenAI, Anthropic, local models (Ollama), extensible architecture
- **Tech Stack**: React + TypeScript frontend, Python FastAPI backend
- **Debate modes**: Automatic (auto-respond) and Manual (user-triggered) turns
- **Persistence**: Session-only (no database)
- **UI**: Desktop-first split-pane design
- **Deployment**: Works locally and on web

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend                           │
│  ┌─────────────────┐         ┌─────────────────┐           │
│  │   Model A Panel │         │   Model B Panel │           │
│  │   - Responses   │         │   - Responses   │           │
│  │   - Typing...   │         │   - Typing...   │           │
│  └─────────────────┘         └─────────────────┘           │
│           ┌─────────────────────────────┐                   │
│           │  Topic Input + Controls     │                   │
│           │  [Start] [Pause] [Mode]     │                   │
│           └─────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                            │
                    WebSocket / REST
                            │
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Debate Orchestrator                      │  │
│  │   - Manages turn order                               │  │
│  │   - Queues responses between models                  │  │
│  │   - Handles auto/manual modes                        │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Provider Abstraction Layer                  │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │  │
│  │  │ OpenAI  │ │Anthropic│ │ Ollama  │ │ Custom  │    │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
AI_debater/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app entry
│   │   ├── config.py            # Settings & env vars
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── debate.py        # Pydantic models
│   │   │   └── providers.py     # Provider enums
│   │   ├── providers/
│   │   │   ├── __init__.py
│   │   │   ├── base.py          # Abstract provider class
│   │   │   ├── openai.py        # OpenAI implementation
│   │   │   ├── anthropic.py     # Anthropic implementation
│   │   │   ├── ollama.py        # Ollama local models
│   │   │   └── factory.py       # Provider factory
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── debate.py        # Debate orchestration logic
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── debate.py        # Debate endpoints
│   │       └── providers.py     # List available providers
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DebatePanel.tsx      # Single model panel
│   │   │   ├── DebateArena.tsx      # Split view container
│   │   │   ├── TopicInput.tsx       # Topic entry form
│   │   │   ├── ModelSelector.tsx    # Model dropdown
│   │   │   ├── ControlBar.tsx       # Start/pause/mode controls
│   │   │   └── MessageBubble.tsx    # Individual response
│   │   ├── hooks/
│   │   │   ├── useDebate.ts         # Debate state management
│   │   │   └── useWebSocket.ts      # WS connection hook
│   │   ├── types/
│   │   │   └── debate.ts            # TypeScript interfaces
│   │   ├── services/
│   │   │   └── api.ts               # API client
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── docker-compose.yml           # Optional containerization
└── README.md
```

---

## Workplan

### Phase 1: Project Setup
- [ ] Initialize backend with FastAPI + Poetry/pip
- [ ] Initialize frontend with Vite + React + TypeScript
- [ ] Set up Tailwind CSS for styling
- [ ] Create basic project structure
- [ ] Set up environment variable handling

### Phase 2: Backend - Provider Layer
- [ ] Create abstract base provider class
- [ ] Implement OpenAI provider (GPT-4, GPT-3.5)
- [ ] Implement Anthropic provider (Claude)
- [ ] Implement Ollama provider (local models)
- [ ] Create provider factory for dynamic instantiation
- [ ] Add provider listing endpoint

### Phase 3: Backend - Debate Logic
- [ ] Create Pydantic models for debate state
- [ ] Implement debate orchestrator service
- [ ] Handle turn management and message queuing
- [ ] Add WebSocket support for real-time streaming
- [ ] Implement auto-mode with configurable delays
- [ ] Add debate start/pause/stop controls

### Phase 4: Frontend - Core UI
- [ ] Create split-pane layout component
- [ ] Build model selector dropdowns
- [ ] Build topic input form
- [ ] Create message bubble component with streaming support
- [ ] Build control bar (start, pause, mode toggle)

### Phase 5: Frontend - State & Integration
- [ ] Set up WebSocket connection hook
- [ ] Implement debate state management
- [ ] Connect UI to backend endpoints
- [ ] Add real-time response streaming display
- [ ] Handle loading and error states

### Phase 6: Bug Fixes & Testing
- [x] Fix Vite WebSocket proxy configuration
- [x] Add error handling to Ollama provider
- [x] Add logging to debug debate flow
- [ ] Test with backend running
- [ ] Add typing indicators
- [ ] Style refinements (animations, transitions)

### Phase 7: Documentation & Deployment
- [x] Write README with setup instructions
- [ ] Create Docker compose for easy deployment
- [x] Document API endpoints
- [ ] Add environment variable documentation

---

## Technical Notes

### Real-time Communication
Using WebSocket for real-time streaming of responses. The debate orchestrator will:
1. Receive a message from Model A
2. Stream it to the frontend while buffering
3. Once complete, queue it as context for Model B
4. Trigger Model B's response

### Provider Abstraction
Each provider implements:
```python
class BaseProvider(ABC):
    @abstractmethod
    async def generate_response(
        self, 
        messages: list[Message], 
        stream: bool = True
    ) -> AsyncGenerator[str, None]:
        pass
    
    @abstractmethod
    async def list_models(self) -> list[str]:
        pass
```

### Debate Context Management
Each model receives:
- System prompt: "You are debating [topic]. Argue for [position]."
- Conversation history: All previous exchanges
- Opponent's last message as the user prompt

### Auto-mode Configuration
- Configurable delay between turns (default: 2 seconds)
- Max turns limit (default: 10, configurable)
- Stop conditions (user pause, max turns, or model signals end)

---

## Open Questions / Future Enhancements
- Add "judge" mode with a third model scoring the debate
- Export debate transcript
- Preset debate topics/formats
- Model temperature/personality configuration per side
- Debate time limits per response
