from abc import ABC, abstractmethod
from typing import AsyncGenerator

from app.models import Message, ModelInfo


class BaseProvider(ABC):
    """Abstract base class for AI model providers."""
    
    @abstractmethod
    async def generate_response(
        self,
        messages: list[Message],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 350,
        stream: bool = True
    ) -> AsyncGenerator[str, None]:
        """
        Generate a response from the model.
        
        Args:
            messages: Conversation history
            model: Model identifier
            temperature: Sampling temperature
            max_tokens: Maximum tokens per response
            stream: Whether to stream the response
            
        Yields:
            Response chunks if streaming, otherwise full response
        """
        pass
    
    @abstractmethod
    async def list_models(self) -> list[ModelInfo]:
        """List available models for this provider."""
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """Check if the provider is configured and available."""
        pass
