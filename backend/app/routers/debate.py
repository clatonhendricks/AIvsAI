from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.models import DebateConfig, DebateState, DebateExport
from app.services.debate import DebateOrchestrator

router = APIRouter()

# Store active debates (in production, use Redis or similar)
active_debates: dict[str, DebateOrchestrator] = {}


@router.post("/start")
async def start_debate(config: DebateConfig) -> DebateState:
    """Initialize a new debate session."""
    orchestrator = DebateOrchestrator(config)
    debate_state = orchestrator.get_state()
    active_debates[debate_state.id] = orchestrator
    return debate_state


@router.get("/{debate_id}")
async def get_debate(debate_id: str) -> DebateState:
    """Get the current state of a debate."""
    if debate_id not in active_debates:
        return {"error": "Debate not found"}
    return active_debates[debate_id].get_state()


@router.get("/{debate_id}/export")
async def export_debate(debate_id: str) -> DebateExport:
    """Export a debate for saving."""
    if debate_id not in active_debates:
        return {"error": "Debate not found"}
    
    state = active_debates[debate_id].get_state()
    return DebateExport(
        config=state.config,
        turns=state.turns,
        exported_at=datetime.now()
    )


@router.post("/import")
async def import_debate(debate_export: DebateExport) -> DebateState:
    """Import a previously saved debate."""
    orchestrator = DebateOrchestrator(debate_export.config)
    # Restore the turns
    orchestrator.state.turns = debate_export.turns
    orchestrator.state.current_turn = len(debate_export.turns)
    if debate_export.turns:
        last_debater = debate_export.turns[-1].debater
        orchestrator.state.current_debater = "B" if last_debater == "A" else "A"
    
    active_debates[orchestrator.state.id] = orchestrator
    return orchestrator.get_state()


@router.post("/{debate_id}/next-turn")
async def trigger_next_turn(debate_id: str) -> dict:
    """Manually trigger the next turn in a debate."""
    if debate_id not in active_debates:
        return {"error": "Debate not found"}
    
    orchestrator = active_debates[debate_id]
    return {"message": "Turn triggered", "current_debater": orchestrator.state.current_debater}


@router.post("/{debate_id}/pause")
async def pause_debate(debate_id: str) -> DebateState:
    """Pause an auto-mode debate."""
    if debate_id not in active_debates:
        return {"error": "Debate not found"}
    
    active_debates[debate_id].pause()
    return active_debates[debate_id].get_state()


@router.post("/{debate_id}/resume")
async def resume_debate(debate_id: str) -> DebateState:
    """Resume a paused debate."""
    if debate_id not in active_debates:
        return {"error": "Debate not found"}
    
    active_debates[debate_id].resume()
    return active_debates[debate_id].get_state()


@router.websocket("/{debate_id}/ws")
async def debate_websocket(websocket: WebSocket, debate_id: str):
    """WebSocket endpoint for real-time debate streaming."""
    await websocket.accept()
    
    if debate_id not in active_debates:
        await websocket.send_json({"error": "Debate not found"})
        await websocket.close()
        return
    
    orchestrator = active_debates[debate_id]
    
    try:
        # Run the debate and stream responses
        async for event in orchestrator.run_debate():
            await websocket.send_json(event)
    except WebSocketDisconnect:
        orchestrator.pause()
    except Exception as e:
        await websocket.send_json({"error": str(e)})
    finally:
        await websocket.close()
