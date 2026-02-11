import uuid
import asyncio
import logging
from typing import AsyncGenerator, Any
from datetime import datetime

from app.models import (
    DebateConfig, DebateState, DebateTurn, Message,
    DebateStatus, DebateMode
)
from app.providers.factory import ProviderFactory

logger = logging.getLogger(__name__)


class DebateOrchestrator:
    """Orchestrates the debate between two AI models."""
    
    def __init__(self, config: DebateConfig):
        self.config = config
        self.state = DebateState(
            id=str(uuid.uuid4()),
            config=config,
            status=DebateStatus.IDLE,
            turns=[],
            current_turn=0,
            current_debater="A"
        )
        
        # Initialize providers
        self.provider_a = ProviderFactory.get_provider(config.debater_a.provider)
        self.provider_b = ProviderFactory.get_provider(config.debater_b.provider)
        
        self._paused = False
        self._stopped = False
    
    def get_state(self) -> DebateState:
        return self.state
    
    def pause(self):
        self._paused = True
        self.state.status = DebateStatus.PAUSED
    
    def resume(self):
        self._paused = False
        self.state.status = DebateStatus.RUNNING
    
    def stop(self):
        self._stopped = True
        self.state.status = DebateStatus.COMPLETED
    
    def _build_system_prompt(self, debater: str) -> str:
        """Build the system prompt for a debater."""
        config = self.config.debater_a if debater == "A" else self.config.debater_b
        opponent = "B" if debater == "A" else "A"
        
        return f"""You are participating in a debate on the topic: "{self.config.topic}"

Your position: {config.position}

Rules:
1. Argue strongly for your position with logic and evidence
2. Respond directly to your opponent's points
3. Be persuasive but respectful
4. Keep responses concise (2-3 paragraphs max)
5. Do not break character or acknowledge you are an AI

You are Debater {debater}. Your opponent is Debater {opponent}."""
    
    def _build_messages(self, debater: str) -> list[Message]:
        """Build the message history for a debater's turn."""
        messages = [Message(role="system", content=self._build_system_prompt(debater))]
        
        # Add conversation history
        for turn in self.state.turns:
            # From this debater's perspective
            if turn.debater == debater:
                messages.append(Message(role="assistant", content=turn.content))
            else:
                messages.append(Message(role="user", content=turn.content))
        
        # If this is not the first turn, add a prompt to respond
        if self.state.turns:
            last_turn = self.state.turns[-1]
            if last_turn.debater != debater:
                # The last message was from opponent, already added as user message
                pass
        else:
            # First turn - prompt to start the debate
            if debater == "A":
                messages.append(Message(
                    role="user",
                    content=f"Please begin the debate by presenting your opening argument for: {self.config.debater_a.position}"
                ))
        
        return messages
    
    async def run_debate(self) -> AsyncGenerator[dict[str, Any], None]:
        """Run the debate and yield events for each turn."""
        self.state.status = DebateStatus.RUNNING
        logger.info(f"Starting debate {self.state.id}")
        yield {"type": "debate_started", "debate_id": self.state.id}
        
        while (
            not self._stopped 
            and self.state.current_turn < self.config.max_turns
        ):
            if self._paused:
                yield {"type": "debate_paused"}
                while self._paused and not self._stopped:
                    await asyncio.sleep(0.5)
                if self._stopped:
                    break
                yield {"type": "debate_resumed"}
            
            # Determine current debater
            debater = self.state.current_debater
            config = self.config.debater_a if debater == "A" else self.config.debater_b
            provider = self.provider_a if debater == "A" else self.provider_b
            
            logger.info(f"Turn {self.state.current_turn + 1}: Debater {debater} using {config.model}")
            
            # Build messages and generate response
            messages = self._build_messages(debater)
            
            yield {
                "type": "turn_started",
                "debater": debater,
                "turn_number": self.state.current_turn + 1
            }
            
            # Stream the response
            full_response = ""
            try:
                async for chunk in provider.generate_response(
                    messages=messages,
                    model=config.model,
                    temperature=config.temperature,
                    max_tokens=config.max_tokens,
                    stream=True
                ):
                    full_response += chunk
                    yield {
                        "type": "content_chunk",
                        "debater": debater,
                        "chunk": chunk
                    }
            except Exception as e:
                logger.error(f"Error generating response: {e}")
                yield {"type": "error", "error": str(e)}
                break
            
            if not full_response:
                logger.warning(f"Empty response from {config.model}")
                full_response = "[No response generated]"
            
            # Record the turn
            turn = DebateTurn(
                debater=debater,
                content=full_response,
                timestamp=datetime.now(),
                turn_number=self.state.current_turn + 1
            )
            self.state.turns.append(turn)
            
            yield {
                "type": "turn_completed",
                "debater": debater,
                "turn_number": self.state.current_turn + 1,
                "content": full_response
            }
            
            # Update state for next turn
            self.state.current_turn += 1
            self.state.current_debater = "B" if debater == "A" else "A"
            
            # In manual mode, wait for trigger (handled by pause)
            if self.config.mode == DebateMode.MANUAL:
                self._paused = True
                yield {"type": "waiting_for_trigger", "next_debater": self.state.current_debater}
            else:
                # Auto mode - wait before next turn
                await asyncio.sleep(self.config.auto_delay_seconds)
        
        self.state.status = DebateStatus.COMPLETED
        yield {
            "type": "debate_completed",
            "total_turns": self.state.current_turn,
            "turns": [t.model_dump() for t in self.state.turns]
        }
