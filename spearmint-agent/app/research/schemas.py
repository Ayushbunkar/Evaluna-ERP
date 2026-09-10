from typing import Any

from pydantic import BaseModel, Field


class WebSearchResultItem(BaseModel):
    title: str
    url: str
    snippet: str
    published_at: str | None = None
    source: str

class WebSearchResult(BaseModel):
    query: str
    results: list[WebSearchResultItem]

class FetchedURL(BaseModel):
    url: str
    final_url: str
    status_code: int
    content_type: str
    title: str | None = None
    text: str
    retrieved_at: str
    content_hash: str
    latency_ms: float | None = None
    cache_hit: bool = False

class CompanySiteResearch(BaseModel):
    company_name: str
    website: str
    discovered_pages: list[FetchedURL]
    retrieved_at: str

class JobRecord(BaseModel):
    title: str
    location: str | None = None
    department: str | None = None
    url: str | None = None
    source: str
    published_at: str | None = None
    retrieved_at: str
    metadata: dict[str, Any] = Field(default_factory=dict)

class NewsSignal(BaseModel):
    title: str
    url: str
    snippet: str
    published_at: str | None = None
    source: str
    metadata: dict[str, Any] = Field(default_factory=dict)

class PeopleCandidate(BaseModel):
    name: str
    title: str
    department: str | None = None
    linkedin_url: str | None = None
    profile_url: str | None = None
    source: str
    source_url: str | None = None
    confidence: float
