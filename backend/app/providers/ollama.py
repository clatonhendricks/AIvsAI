from typing import AsyncGenerator
import httpx
import json

from app.providers.base import BaseProvider
from app.models import Message, ModelInfo, ProviderType
from app.config import settings


class OllamaProvider(BaseProvider):
    """Ollama local model provider implementation."""
    
    def __init__(self):
        self.base_url = settings.ollama_base_url
        self._available = None
    
    def is_available(self) -> bool:
        # Cache availability check
        if self._available is None:
            try:
                response = httpx.get(f"{self.base_url}/api/tags", timeout=2.0)
                self._available = response.status_code == 200
            except Exception:
                self._available = False
        return self._available
    
    async def list_models(self) -> list[ModelInfo]:
        if not self.is_available():
            return []
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/api/tags")
                data = response.json()
                
                models = []
                for model in data.get("models", []):
                    models.append(ModelInfo(
                        id=model["name"],
                        name=model["name"],
                        provider=ProviderType.OLLAMA,
                        description=f"Local model: {model.get('size', 'unknown size')}"
                    ))
                return models
        except Exception:
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
            yield "Error: Ollama not available. Make sure it's running locally."
            return
        
        formatted_messages = [{"role": m.role, "content": m.content} for m in messages]
        
        # For thinking models, we don't limit tokens during generation
        # as thinking tokens shouldn't count. We'll truncate the final content if needed.
        # Use a high limit to allow thinking + response
        effective_max_tokens = max_tokens * 10  # Allow room for thinking
        
        try:
            async with httpx.AsyncClient() as client:
                if stream:
                    # For streaming, collect full response then extract content
                    # because thinking models stream thinking first, then content
                    full_response_data = []
                    async with client.stream(
                        "POST",
                        f"{self.base_url}/api/chat",
                        json={
                            "model": model,
                            "messages": formatted_messages,
                            "stream": True,
                            "options": {"temperature": temperature, "num_predict": effective_max_tokens}
                        },
                        timeout=180.0
                    ) as response:
                        async for line in response.aiter_lines():
                            if line:
                                try:
                                    data = json.loads(line)
                                    if "message" in data:
                                        # Only yield content, not thinking
                                        content = data["message"].get("content", "")
                                        if content:
                                            yield content
                                except json.JSONDecodeError:
                                    continue
                else:
                    response = await client.post(
                        f"{self.base_url}/api/chat",
                        json={
                            "model": model,
                            "messages": formatted_messages,
                            "stream": False,
                            "options": {"temperature": temperature, "num_predict": effective_max_tokens}
                        },
                        timeout=180.0
                    )
                    data = response.json()
                    # Only return content field, not thinking
                    content = data.get("message", {}).get("content", "")
                    if content:
                        yield content
                    else:
                        yield "[Model returned empty response]"
        except Exception as e:
            yield f"Error calling Ollama: {str(e)}"
