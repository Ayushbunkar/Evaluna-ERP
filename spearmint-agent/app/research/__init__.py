import json
import time
from typing import Any, Dict, List, Optional

from app.research.cache import get_cache
from app.research.company.site import research_company_site
from app.research.jobs.search import search_jobs
from app.research.news.search import search_company_news
from app.research.people.search import find_people
from app.research.web.fetch import fetch_url
from app.research.web.search import search_web


def log_observability_event(
    tool_name: str, 
    payload: dict[str, Any], 
    success: bool, 
    latency_ms: float, 
    cache_hit: bool, 
    result_count: int, 
    provider: str,
    error: str | None = None
) -> None:
    """Structured audit and observability logs representing cost, hit-rates and status."""
    log_payload = {
        "event_type": "spearmint_research_action",
        "tool_name": tool_name,
        "provider": provider,
        "payload": payload,
        "success": success,
        "latency_ms": round(latency_ms, 2),
        "cache_hit": cache_hit,
        "result_count": result_count,
        "error": error
    }
    print(json.dumps(log_payload))

async def search_web_tool(query: str, max_results: int = 10) -> dict[str, Any]:
    """Wraps web search with robust Redis caching and latency audits."""
    start_time = time.time()
    cache = get_cache()
    payload = {"query": query, "max_results": max_results}
    
    # 1. Caching
    cached = cache.get("search_web", payload)
    if cached:
        latency = (time.time() - start_time) * 1000
        log_observability_event("search_web", payload, True, latency, True, len(cached.get("results", [])), "Tavily/Mock")
        return cached

    # 2. Execution
    try:
        results = await search_web(query, max_results)
        cache.set("search_web", payload, results, ttl_sec=7200) # Cache for 2 hours
        latency = (time.time() - start_time) * 1000
        log_observability_event("search_web", payload, True, latency, False, len(results.get("results", [])), "Tavily/Mock")
        return results
    except Exception as e:
        latency = (time.time() - start_time) * 1000
        log_observability_event("search_web", payload, False, latency, False, 0, "Tavily/Mock", str(e))
        raise e

async def fetch_url_tool(url: str, timeout_sec: float = 10.0, max_bytes: int = 1024*1024) -> dict[str, Any]:
    """Wraps URL fetching with caching and size limits."""
    start_time = time.time()
    cache = get_cache()
    payload = {"url": url, "timeout_sec": timeout_sec, "max_bytes": max_bytes}
    
    cached = cache.get("fetch_url", payload)
    if cached:
        latency = (time.time() - start_time) * 1000
        log_observability_event("fetch_url", payload, True, latency, True, 1, "HTTPX")
        # Mark as cache hit
        cached["cache_hit"] = True
        return cached

    try:
        res = await fetch_url(url, timeout_sec=timeout_sec, max_bytes=max_bytes)
        cache.set("fetch_url", payload, res, ttl_sec=86400) # Cache URL fetches for 24 hours
        latency = (time.time() - start_time) * 1000
        log_observability_event("fetch_url", payload, True, latency, False, 1, "HTTPX")
        return res
    except Exception as e:
        latency = (time.time() - start_time) * 1000
        log_observability_event("fetch_url", payload, False, latency, False, 0, "HTTPX", str(e))
        raise e

async def research_company_site_tool(company_name: str, website: str, max_pages: int = 5) -> dict[str, Any]:
    """Researches a company homepage and secondary links."""
    start_time = time.time()
    cache = get_cache()
    payload = {"company_name": company_name, "website": website, "max_pages": max_pages}
    
    cached = cache.get("research_site", payload)
    if cached:
        latency = (time.time() - start_time) * 1000
        log_observability_event("research_site", payload, True, latency, True, len(cached.get("discovered_pages", [])), "Crawler/HTTPX")
        return cached

    try:
        res = await research_company_site(company_name, website, max_pages)
        cache.set("research_site", payload, res, ttl_sec=14400) # Cache site runs for 4 hours
        latency = (time.time() - start_time) * 1000
        log_observability_event("research_site", payload, True, latency, False, len(res.get("discovered_pages", [])), "Crawler/HTTPX")
        return res
    except Exception as e:
        latency = (time.time() - start_time) * 1000
        log_observability_event("research_site", payload, False, latency, False, 0, "Crawler/HTTPX", str(e))
        raise e

async def search_jobs_tool(company_name: str, domain: str) -> list[dict[str, Any]]:
    """Crawls and queries job profiles for a company."""
    start_time = time.time()
    cache = get_cache()
    payload = {"company_name": company_name, "domain": domain}
    
    cached = cache.get("search_jobs", payload)
    if cached:
        latency = (time.time() - start_time) * 1000
        log_observability_event("search_jobs", payload, True, latency, True, len(cached), "ATS/Mock")
        return cached

    try:
        res = await search_jobs(company_name, domain)
        cache.set("search_jobs", payload, res, ttl_sec=28800) # Cache jobs for 8 hours
        latency = (time.time() - start_time) * 1000
        log_observability_event("search_jobs", payload, True, latency, False, len(res), "ATS/Mock")
        return res
    except Exception as e:
        latency = (time.time() - start_time) * 1000
        log_observability_event("search_jobs", payload, False, latency, False, 0, "ATS/Mock", str(e))
        raise e

async def search_company_news_tool(company_name: str, domain: str, query: str) -> list[dict[str, Any]]:
    """Queries funding, expansions, launch and signal-news."""
    start_time = time.time()
    cache = get_cache()
    payload = {"company_name": company_name, "domain": domain, "query": query}
    
    cached = cache.get("company_news", payload)
    if cached:
        latency = (time.time() - start_time) * 1000
        log_observability_event("company_news", payload, True, latency, True, len(cached), "Tavily/Mock")
        return cached

    try:
        res = await search_company_news(company_name, domain, query)
        cache.set("company_news", payload, res, ttl_sec=7200) # Cache news for 2 hours
        latency = (time.time() - start_time) * 1000
        log_observability_event("company_news", payload, True, latency, False, len(res), "Tavily/Mock")
        return res
    except Exception as e:
        latency = (time.time() - start_time) * 1000
        log_observability_event("company_news", payload, False, latency, False, 0, "Tavily/Mock", str(e))
        raise e

async def find_people_tool(company_name: str, domain: str, role_hints: list[str] | None = None) -> list[dict[str, Any]]:
    """Finds key personnel profiles matching role filters."""
    start_time = time.time()
    cache = get_cache()
    payload = {"company_name": company_name, "domain": domain, "role_hints": role_hints}
    
    cached = cache.get("find_people", payload)
    if cached:
        latency = (time.time() - start_time) * 1000
        log_observability_event("find_people", payload, True, latency, True, len(cached), "MockPeople")
        return cached

    try:
        res = await find_people(company_name, domain, role_hints)
        cache.set("find_people", payload, res, ttl_sec=14400) # Cache contacts for 4 hours
        latency = (time.time() - start_time) * 1000
        log_observability_event("find_people", payload, True, latency, False, len(res), "MockPeople")
        return res
    except Exception as e:
        latency = (time.time() - start_time) * 1000
        log_observability_event("find_people", payload, False, latency, False, 0, "MockPeople", str(e))
        raise e
