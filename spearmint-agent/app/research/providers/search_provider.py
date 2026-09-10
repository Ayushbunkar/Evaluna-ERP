import os

import httpx

from app.research.base import SearchProvider
from app.research.schemas import WebSearchResult, WebSearchResultItem


class MockSearchProvider(SearchProvider):
    async def search_web(self, query: str, max_results: int = 10) -> WebSearchResult:
        """Determinstic mock search provider for unit testing."""
        results = [
            WebSearchResultItem(
                title=f"Mock Result 1 for: {query}",
                url="https://mock1-example.com/about",
                snippet="This is a mock snippet describing mock company services and products.",
                published_at="2026-01-15T00:00:00Z",
                source="MockSearchProvider"
            ),
            WebSearchResultItem(
                title=f"Mock Result 2 for: {query}",
                url="https://mock2-example.com/careers",
                snippet="We are looking for senior staff engineers to join our growing team.",
                published_at="2026-03-01T00:00:00Z",
                source="MockSearchProvider"
            )
        ]
        return WebSearchResult(query=query, results=results[:max_results])

class TavilySearchProvider(SearchProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key

    async def search_web(self, query: str, max_results: int = 10) -> WebSearchResult:
        """Real web search using Tavily search API."""
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": self.api_key,
            "query": query,
            "max_results": max_results,
            "search_depth": "basic"
        }
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, timeout=15.0)
                if response.status_code == 200:
                    data = response.json()
                    results = []
                    for item in data.get("results", []):
                        results.append(
                            WebSearchResultItem(
                                title=item.get("title", ""),
                                url=item.get("url", ""),
                                snippet=item.get("content", ""),
                                published_at=None,
                                source="Tavily"
                            )
                        )
                    return WebSearchResult(query=query, results=results)
                else:
                    raise Exception(f"Tavily API error: Status {response.status_code}. Response: {response.text}")
        except Exception as e:
            raise Exception(f"Tavily request failed: {e}")

def get_search_provider() -> SearchProvider:
    """
    Factory function returning the configured SearchProvider.
    Defaults to MockSearchProvider if no real provider API key is found.
    """
    tavily_key = os.getenv("TAVILY_API_KEY")
    if tavily_key:
        return TavilySearchProvider(api_key=tavily_key)
    
    # Fallback to Mock
    return MockSearchProvider()
