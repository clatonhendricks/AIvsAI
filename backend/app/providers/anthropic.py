from typing import AsyncGenerator
from anthropic import AsyncAnthropic

from app.providers.base import BaseProvider
from app.models import Message, ModelInfo, ProviderType
from app.config import settings


class AnthropicProvider(BaseProvider):
    """Anthropic Claude API provider implementation."""
    
    def __init__(self):
        self.client = None
        if settings.anthropic_api_key:
            self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    
    def is_available(self) -> bool:
        return self.client is not None
    
    async def list_models(self) -> list[ModelInfo]:
        # Return empty list - let user type model name
        return []
    
    async def generate_response(
        self,
        messages: list[Message],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 350,
        stream: bool = True
    ) -> AsyncGenerator[str, None]:
        if not self.is_available():
            yield "Error: Anthropic API key not configured"
            return
        
        # Anthropic requires system message to be separate
        system_message = ""
        chat_messages = []
        
        for msg in messages:
            if msg.role == "system":
                system_message = msg.content
            else:
                chat_messages.append({"role": msg.role, "content": msg.content})
        
        if stream:
            async with self.client.messages.stream(
                model=model,
                max_tokens=max_tokens,
                system=system_message,
                messages=chat_messages,
                temperature=temperature
            ) as response:
                async for text in response.text_stream:
                    yield text
        else:
            response = await self.client.messages.create(
                model=model,
                max_tokens=max_tokens,
                system=system_message,
                messages=chat_messages,
                temperature=temperature
            )
            yield response.content[0].text
