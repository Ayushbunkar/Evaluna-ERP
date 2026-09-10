from typing import Any

from app.research.normalization import normalize_url


def deduplicate_urls(urls: list[str]) -> list[str]:
    """
    Deduplicates a list of URLs based on their normalized representation.
    Preserves the original insertion order.
    """
    seen = set()
    deduped = []
    for url in urls:
        normalized = normalize_url(url)
        if normalized not in seen:
            seen.add(normalized)
            deduped.append(url)
    return deduped

def deduplicate_search_results(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Deduplicates web search result dictionaries by their normalized URL.
    """
    seen_urls = set()
    deduped = []
    for res in results:
        url = res.get("url")
        if url:
            normalized = normalize_url(url)
            if normalized not in seen_urls:
                seen_urls.add(normalized)
                deduped.append(res)
        else:
            deduped.append(res)
    return deduped

def deduplicate_jobs(jobs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Deduplicates job records by title and normalized URL if present, or title + location.
    """
    seen = set()
    deduped = []
    for job in jobs:
        title = job.get("title", "").strip().lower()
        location = job.get("location", "").strip().lower() if job.get("location") else "remote"
        url = job.get("url", "")
        
        if url:
            key = f"url:{normalize_url(url)}"
        else:
            key = f"desc:{title}:{location}"
            
        if key not in seen:
            seen.add(key)
            deduped.append(job)
    return deduped

def deduplicate_people(people: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Deduplicates people profiles by Name + Title, or normalized LinkedIn profile URL.
    """
    seen = set()
    deduped = []
    for person in people:
        name = person.get("name", "").strip().lower()
        title = person.get("title", "").strip().lower()
        li_url = person.get("linkedin_url", "")
        
        if li_url:
            key = f"li:{normalize_url(li_url)}"
        else:
            key = f"profile:{name}:{title}"
            
        if key not in seen:
            seen.add(key)
            deduped.append(person)
    return deduped
