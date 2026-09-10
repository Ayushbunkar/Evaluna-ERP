
import pytest

from app.research import (
    fetch_url_tool,
    find_people_tool,
    research_company_site_tool,
    search_jobs_tool,
    search_web_tool,
)
from app.research.cache import get_cache
from app.research.deduplication import (
    deduplicate_jobs,
    deduplicate_search_results,
    deduplicate_urls,
)
from app.research.normalization import (
    normalize_domain,
    normalize_timestamp,
    normalize_url,
)

# Set up Event Loop for Asyncio tests
pytestmark = pytest.mark.asyncio

def test_url_normalization():
    """Test standard URL normalization rules."""
    assert normalize_url("https://www.google.com/") == "https://google.com"
    assert normalize_url("http://example.com/about/") == "http://example.com/about"
    assert normalize_url("https://example.com/page?utm_source=fb&gclid=123") == "https://example.com/page"
    assert normalize_url("") == ""

def test_domain_normalization():
    """Test raw domain extraction."""
    assert normalize_domain("https://www.Spearmint.com/about") == "spearmint.com"
    assert normalize_domain("http://abc.co.uk/") == "abc.co.uk"
    assert normalize_domain("www.example.com") == "example.com"

def test_timestamp_normalization():
    """Test parsing standard timestamps."""
    iso_str = normalize_timestamp(1771120000)
    assert "2026" in iso_str
    assert iso_str.endswith("Z")

def test_url_deduplication():
    """Test canonical URL deduplication."""
    raw = [
        "https://www.example.com/",
        "https://example.com",
        "https://example.com/about",
        "https://www.example.com/?utm_medium=email"
    ]
    deduped = deduplicate_urls(raw)
    assert len(deduped) == 2
    assert deduped[0] == "https://www.example.com/"
    assert deduped[1] == "https://example.com/about"

def test_search_results_deduplication():
    """Test search results deduplication."""
    results = [
        {"title": "Result 1", "url": "https://example.com"},
        {"title": "Result 2", "url": "https://www.example.com/?utm_source=fb"},
        {"title": "Result 3", "url": "https://example.com/about"}
    ]
    deduped = deduplicate_search_results(results)
    assert len(deduped) == 2
    assert deduped[0]["title"] == "Result 1"
    assert deduped[1]["title"] == "Result 3"

def test_jobs_deduplication():
    """Test job records deduplication."""
    jobs = [
        {"title": "Engineer", "location": "Remote", "url": "https://example.com/jobs/1"},
        {"title": "Engineer", "location": "Remote", "url": "https://www.example.com/jobs/1?utm=1"},
        {"title": "Manager", "location": "SF", "url": ""}
    ]
    deduped = deduplicate_jobs(jobs)
    assert len(deduped) == 2

@pytest.mark.asyncio
async def test_cache_hit_and_miss():
    """Test local caching layer hits, misses, and TTL behavior."""
    cache = get_cache()
    namespace = "test_run"
    payload = {"query": "spearmint funding"}
    data = {"results": [{"title": "Spearmint raised Series A", "url": "https://example.com"}]}
    
    # Cache Miss
    assert cache.get(namespace, payload) is None
    
    # Set Cache
    cache.set(namespace, payload, data, ttl_sec=5)
    
    # Cache Hit
    cached_data = cache.get(namespace, payload)
    assert cached_data is not None
    assert cached_data["results"][0]["title"] == "Spearmint raised Series A"

@pytest.mark.asyncio
async def test_search_web_tool():
    """Test web search tool integration with mock data."""
    res = await search_web_tool("FastAPI speed optimization")
    assert "results" in res
    assert len(res["results"]) > 0
    assert "Mock Result" in res["results"][0]["title"]

@pytest.mark.asyncio
async def test_fetch_url_tool_error_handling():
    """Test fetch_url fallback and safety under non-existent hosts."""
    res = await fetch_url_tool("https://this-is-not-a-real-hostname-spearmint.com")
    assert res["status_code"] == -1
    assert "Failed to retrieve url" in res["text"]

@pytest.mark.asyncio
async def test_research_company_site_tool():
    """Test site crawler is safe, bounded and respects max_pages."""
    res = await research_company_site_tool("Spearmint", "spearmint.com", max_pages=3)
    assert res["company_name"] == "Spearmint"
    # Max pages bounded
    assert len(res["discovered_pages"]) <= 3

@pytest.mark.asyncio
async def test_search_jobs_tool():
    """Test hiring search endpoint."""
    res = await search_jobs_tool("Spearmint", "spearmint.com")
    assert len(res) > 0
    assert "Backend Engineer" in res[0]["title"]

@pytest.mark.asyncio
async def test_find_people_tool():
    """Test personnel discovery tool outputs."""
    res = await find_people_tool("Spearmint", "spearmint.com", role_hints=["Sales"])
    assert len(res) == 1
    assert res[0]["name"] == "John Doe"
    assert res[0]["title"] == "VP of Sales"
