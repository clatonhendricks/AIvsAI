"""
Test script for OpenAI API integration.
Run from backend directory: python test_openai.py
"""
import asyncio
import sys
from openai import AsyncOpenAI
from app.config import settings


async def test_raw_api(model: str = "gpt-5-nano"):
    """Test the OpenAI API directly to see what parameters work."""
    print(f"\n{'='*60}")
    print(f"Testing OpenAI API with model: {model}")
    print(f"{'='*60}")
    
    if not settings.openai_api_key:
        print("ERROR: OPENAI_API_KEY not set in .env")
        return False
    
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    messages = [{"role": "user", "content": "Say hello in exactly 5 words"}]
    
    # Test 1: Try with max_completion_tokens (new parameter)
    print("\n[Test 1] Using max_completion_tokens...")
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            max_completion_tokens=50,
            stream=False
        )
        print(f"SUCCESS: {response.choices[0].message.content}")
    except Exception as e:
        print(f"FAILED: {e}")
    
    # Test 2: Try with max_tokens (old parameter)
    print("\n[Test 2] Using max_tokens...")
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=50,
            stream=False
        )
        print(f"SUCCESS: {response.choices[0].message.content}")
    except Exception as e:
        print(f"FAILED: {e}")
    
    # Test 3: Try with temperature
    print("\n[Test 3] Using temperature=0.7...")
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            max_completion_tokens=50,
            temperature=0.7,
            stream=False
        )
        print(f"SUCCESS: {response.choices[0].message.content}")
    except Exception as e:
        print(f"FAILED: {e}")
    
    # Test 4: Minimal call (no optional params)
    print("\n[Test 4] Minimal call (no max_tokens or temperature)...")
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            stream=False
        )
        print(f"SUCCESS: {response.choices[0].message.content}")
    except Exception as e:
        print(f"FAILED: {e}")
    
    return True


async def test_provider(model: str = "gpt-5-nano"):
    """Test our OpenAI provider implementation."""
    print(f"\n{'='*60}")
    print(f"Testing OpenAIProvider with model: {model}")
    print(f"{'='*60}")
    
    from app.providers.openai import OpenAIProvider
    from app.models import Message
    
    provider = OpenAIProvider()
    if not provider.is_available():
        print("ERROR: OpenAI provider not available")
        return False
    
    messages = [Message(role="user", content="Say hello in exactly 5 words")]
    
    print("\n[Provider Test] Streaming response...")
    try:
        response = ""
        async for chunk in provider.generate_response(messages, model=model, max_tokens=50):
            response += chunk
        print(f"SUCCESS: {response}")
        return True
    except Exception as e:
        print(f"FAILED: {e}")
        return False


async def main():
    import openai
    print(f"OpenAI library version: {openai.__version__}")
    
    model = sys.argv[1] if len(sys.argv) > 1 else "gpt-5-nano"
    
    await test_raw_api(model)
    await test_provider(model)


if __name__ == "__main__":
    asyncio.run(main())
