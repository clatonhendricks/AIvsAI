from typing import AsyncGenerator
from openai import AsyncOpenAI

from app.providers.base import BaseProvider
from app.models import Message, ModelInfo, ProviderType
from app.config import settings


class OpenAIProvider(BaseProvider):
    """OpenAI API provider implementation."""
    
    def __init__(self):
        self.client = None
        if settings.openai_api_key:
            self.client = AsyncOpenAI(api_key=settings.openai_api_key)
    
    def is_available(self) -> bool:
        return self.client is not None
    
    async def list_models(self) -> list[ModelInfo]:
        if not self.is_available():
            return []
        
        # Return commonly used models (API has many fine-tuned variants)
        return [
            ModelInfo(
                id="gpt-4-turbo-preview",
                name="GPT-4 Turbo",
                provider=ProviderType.OPENAI,
                description="Most capable GPT-4 model, optimized for chat"
            ),
            ModelInfo(
                id="gpt-4",
                name="GPT-4",
                provider=ProviderType.OPENAI,
                description="Standard GPT-4 model"
            ),
            ModelInfo(
                id="gpt-3.5-turbo",
                name="GPT-3.5 Turbo",
                provider=ProviderType.OPENAI,
                description="Fast and cost-effective"
            ),
        ]
    
    async def generate_response(
        self,
        messages: list[Message],
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 350,
        stream: bool = True
    ) -> AsyncGenerator[str, None]:
        if not self.is_available():
            yield "Error: OpenAI API key not configured"
            return
        
        formatted_messages = [{"role": m.role, "content": m.content} for m in messages]
        
        if stream:
            response = await self.client.chat.completions.create(
                model=model,
                messages=formatted_messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True
            )
            
            async for chunk in response:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        else:
            response = await self.client.chat.completions.create(
                model=model,
                messages=formatted_messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=False
            )
            yield response.choices[0].message.content
