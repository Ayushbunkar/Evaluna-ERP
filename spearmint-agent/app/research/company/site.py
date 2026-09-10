from datetime import datetime
from typing import Any

from app.research.normalization import normalize_domain, normalize_url
from app.research.schemas import CompanySiteResearch, FetchedURL
from app.research.web.fetch import fetch_url


async def research_company_site(
    company_name: str, 
    website: str, 
    max_pages: int = 5,
    timeout_sec: float = 10.0,
    max_bytes: int = 1 * 1024 * 1024
) -> dict[str, Any]:
    """
    Researches a company website by fetching a small set of standard pages (e.g. /, /about, /careers, /products).
    Ensures safe crawling within strict maximum page limits, duplicate prevention, and response byte caps.
    """
    clean_domain = normalize_domain(website)
    base_url = f"https://{clean_domain}"
    
    # Candidate list of standard pages
    candidate_paths = [
        "",
        "/about",
        "/company",
        "/careers",
        "/jobs",
        "/products",
        "/solutions",
        "/news",
        "/press"
    ]
    
    # Generate canonical candidate URLs
    unique_urls = []
    seen_normalized = set()
    for path in candidate_paths:
        full_url = f"{base_url}{path}"
        normalized = normalize_url(full_url)
        if normalized not in seen_normalized:
            seen_normalized.add(normalized)
            unique_urls.append(full_url)
            
    # Fetch up to max_pages
    discovered_pages: list[FetchedURL] = []
    fetched_count = 0
    
    for url in unique_urls:
        if fetched_count >= max_pages:
            break
            
        try:
            raw_res = await fetch_url(url, timeout_sec=timeout_sec, max_bytes=max_bytes)
            # Create the FetchedURL schema model
            fetched_page = FetchedURL(
                url=raw_res["url"],
                final_url=raw_res["final_url"],
                status_code=raw_res["status_code"],
                content_type=raw_res["content_type"],
                title=raw_res["title"],
                text=raw_res["text"],
                retrieved_at=raw_res["retrieved_at"],
                content_hash=raw_res["content_hash"],
                latency_ms=raw_res["latency_ms"],
                cache_hit=raw_res["cache_hit"]
            )
            discovered_pages.append(fetched_page)
            fetched_count += 1
        except Exception as e:
            # Silently log errors on individual page fetches to maintain robustness
            print(f"[CompanySiteResearch] Warning: failed to fetch {url}: {e}")
            
    research_result = CompanySiteResearch(
        company_name=company_name,
        website=website,
        discovered_pages=discovered_pages,
        retrieved_at=datetime.utcnow().isoformat() + "Z"
    )
    
    return research_result.dict()
