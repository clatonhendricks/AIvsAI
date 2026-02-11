from enum import Enum
from pydantic import BaseModel


class ProviderType(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    OLLAMA = "ollama"


class ModelInfo(BaseModel):
    id: str
    name: str
    provider: ProviderType
    description: str = ""
