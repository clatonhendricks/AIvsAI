from app.models import ProviderType
from app.providers.base import BaseProvider
from app.providers.openai import OpenAIProvider
from app.providers.anthropic import AnthropicProvider
from app.providers.ollama import OllamaProvider


class ProviderFactory:
    """Factory for creating AI provider instances."""
    
    _instances: dict[ProviderType, BaseProvider] = {}
    
    @classmethod
    def get_provider(cls, provider_type: ProviderType) -> BaseProvider:
        """Get or create a provider instance."""
        if provider_type not in cls._instances:
            if provider_type == ProviderType.OPENAI:
                cls._instances[provider_type] = OpenAIProvider()
            elif provider_type == ProviderType.ANTHROPIC:
                cls._instances[provider_type] = AnthropicProvider()
            elif provider_type == ProviderType.OLLAMA:
                cls._instances[provider_type] = OllamaProvider()
            else:
                raise ValueError(f"Unknown provider type: {provider_type}")
        
        return cls._instances[provider_type]
