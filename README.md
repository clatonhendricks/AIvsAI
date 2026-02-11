# AI Debater

An AI-powered debate platform where two AI models argue different perspectives on any topic. Watch GPT-4, Claude, and local models (via Ollama) debate in real-time!

## Features

- **Multi-provider support**: OpenAI (GPT-4, GPT-3.5), Anthropic (Claude), and local models via Ollama
- **Real-time streaming**: Watch responses stream in as they're generated
- **Dual-mode debates**:
  - **Auto mode**: Models automatically respond to each other
  - **Manual mode**: You control when each model responds
- **Split-pane UI**: See both debaters side-by-side
- **Configurable positions**: Set different stances for each model to argue

## Prerequisites

- Python 3.10+
- Node.js 18+
- (Optional) Ollama for local models

## Setup

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure API keys
cp .env.example .env
# Edit .env and add your API keys
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

## Configuration

Edit `backend/.env` with your API keys:

```env
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
OLLAMA_BASE_URL=http://localhost:11434
```

## Running the App

### Start Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### Start Frontend

```bash
cd frontend
npm run dev
```

Visit http://localhost:5173 to use the app.

## Usage

1. **Enter a debate topic** (e.g., "Should AI be regulated?")
2. **Configure Debater A**: Choose provider, model, and position (e.g., "AI should be heavily regulated")
3. **Configure Debater B**: Choose provider, model, and position (e.g., "AI should have minimal regulation")
4. **Select mode**: Auto (continuous) or Manual (step-by-step)
5. **Click Start Debate** and watch the AI models argue!

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/providers/available` | GET | List available providers and models |
| `/api/debate/start` | POST | Start a new debate |
| `/api/debate/{id}` | GET | Get debate state |
| `/api/debate/{id}/pause` | POST | Pause a debate |
| `/api/debate/{id}/resume` | POST | Resume a debate |
| `/api/debate/{id}/ws` | WS | WebSocket for real-time streaming |

## Project Structure

```
AI_debater/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── config.py         # Settings
│   │   ├── models/           # Pydantic models
│   │   ├── providers/        # AI provider implementations
│   │   ├── services/         # Debate orchestration
│   │   └── routers/          # API endpoints
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API client
│   │   ├── types/            # TypeScript types
│   │   └── App.tsx           # Main app
│   └── package.json
└── README.md
```

## License

MIT
