from pydantic import BaseModel
from typing import Optional, Literal
from enum import Enum
from datetime import datetime

from app.models.providers import ProviderType


class DebateMode(str, Enum):
    MANUAL = "manual"
    AUTO = "auto"


class DebateStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"


class Message(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class DebaterConfig(BaseModel):
    provider: ProviderType
    model: str
    position: str  # The stance/position this debater will argue for
    temperature: float = 0.7
    max_tokens: int = 350  # Token limit per turn


class DebateConfig(BaseModel):
    topic: str
    debater_a: DebaterConfig
    debater_b: DebaterConfig
    mode: DebateMode = DebateMode.MANUAL
    max_turns: int = 10
    auto_delay_seconds: float = 2.0


class DebateTurn(BaseModel):
    debater: Literal["A", "B"]
    content: str
    timestamp: datetime
    turn_number: int


class DebateState(BaseModel):
    id: str
    config: DebateConfig
    status: DebateStatus = DebateStatus.IDLE
    turns: list[DebateTurn] = []
    current_turn: int = 0
    current_debater: Literal["A", "B"] = "A"


class DebateExport(BaseModel):
    """Model for saving/loading debates"""
    config: DebateConfig
    turns: list[DebateTurn]
    exported_at: datetime
