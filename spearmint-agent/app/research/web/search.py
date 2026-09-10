from typing import Any

from app.research.providers.search_provider import get_search_provider


async def search_web(query: str, max_results: int = 10) -> dict[str, Any]:
    """
    Executes a web search on the configured provider, returning a normalized result dictionary.
    """
    provider = get_search_provider()
    result = await provider.search_web(query=query, max_results=max_results)
    return result.dict()
