from fastapi import APIRouter, HTTPException
from app.models import ProviderType, ModelInfo
from app.providers.factory import ProviderFactory

router = APIRouter()


@router.get("/")
async def list_providers() -> list[str]:
    """List all available provider types."""
    return [p.value for p in ProviderType]


@router.get("/{provider}/models")
async def list_models(provider: ProviderType) -> list[ModelInfo]:
    """List available models for a specific provider."""
    try:
        provider_instance = ProviderFactory.get_provider(provider)
        return await provider_instance.list_models()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/available")
async def list_available_providers() -> dict:
    """List providers with their availability status."""
    availability = {}
    for provider_type in ProviderType:
        try:
            provider = ProviderFactory.get_provider(provider_type)
            availability[provider_type.value] = {
                "available": provider.is_available(),
                "models": await provider.list_models() if provider.is_available() else []
            }
        except Exception:
            availability[provider_type.value] = {"available": False, "models": []}
    return availability
