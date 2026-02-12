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
            yield "Error: OpenAI API key not configured"
            return
        
        formatted_messages = [{"role": m.role, "content": m.content} for m in messages]
        
        model_lower = model.lower()
        
        # Reasoning models (o1, o3, nano) use internal reasoning tokens
        # They need much higher max_completion_tokens or none at all
        is_reasoning_model = any(x in model_lower for x in ['o1', 'o3', 'nano'])
        
        # Use max_completion_tokens for newer models (gpt-4o, gpt-5, o1, o3, etc.)
        uses_new_token_param = any(x in model_lower for x in ['gpt-4o', 'gpt-5', 'o1-', 'o3-', 'o1', 'o3'])
        
        # Some models don't support temperature parameter
        no_temperature_models = any(x in model_lower for x in ['o1', 'o3', 'nano'])
        
        # Build kwargs dynamically
        kwargs = {
            'model': model,
            'messages': formatted_messages,
            'stream': stream,
        }
        
        # For reasoning models, either omit max_tokens or set very high
        # The reasoning tokens count against the limit, so we need room for reasoning + output
        if is_reasoning_model:
            # For reasoning models, multiply by 10 to account for reasoning overhead
            # or omit entirely for short prompts
            if max_tokens < 500:
                # Don't set a limit for small requests - let the model use what it needs
                pass
            else:
                kwargs['max_completion_tokens'] = max_tokens * 10
        elif uses_new_token_param:
            kwargs['max_completion_tokens'] = max_tokens
        else:
            kwargs['max_tokens'] = max_tokens
        
        if not no_temperature_models:
            kwargs['temperature'] = temperature
        
        if stream:
            response = await self.client.chat.completions.create(**kwargs)
            
            async for chunk in response:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        else:
            response = await self.client.chat.completions.create(**kwargs)
            yield response.choices[0].message.content
