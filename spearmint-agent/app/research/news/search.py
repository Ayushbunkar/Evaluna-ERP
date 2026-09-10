from typing import Any

from app.research.providers.search_provider import get_search_provider
from app.research.schemas import NewsSignal


async def search_company_news(company_name: str, domain: str, query: str) -> list[dict[str, Any]]:
    """
    Search for company news signals, funding, expansions, and events.
    Exposes raw sources with precise metadata to later be evaluated by Hermes.
    """
    provider = get_search_provider()
    # Combine signals to build a structured query
    full_query = f"{company_name} {domain} {query}"
    search_res = await provider.search_web(query=full_query, max_results=5)
    
    signals = []
    for item in search_res.results:
        signals.append(
            NewsSignal(
                title=item.title,
                url=item.url,
                snippet=item.snippet,
                published_at=item.published_at,
                source=item.source,
                metadata={"original_query": query}
            )
        )
    return [sig.dict() for sig in signals]
