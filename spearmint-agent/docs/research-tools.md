# Spearmint BDE Intelligence Agent - Research Tools & Provider Interface Layer

This documentation outlines the architecture, tool specifications, caching logic, and error handling for the research abstractions implemented in **Phase 3**.

---

## 🏗️ Core Architecture & Provider Abstraction

Phase 3 builds a decoupled, highly robust, and provider-independent tool-and-adapter layer. The system separates the **tool capabilities** that the LLM agent (Hermes) will later choose dynamically from the **external API vendors** executing those operations.

```
+-------------------------------------------------------------+
|                     LLM Agent (Hermes)                      |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     Research Tool Layer                     |
|  (search_web, fetch_url, research_company_site, find_people) |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                 Provider Interface Protocols                |
|       (SearchProvider, JobProvider, PeopleProvider)          |
+-------------------------------------------------------------+
                               |
            +------------------+------------------+
            |                                     |
            v                                     v
+-----------------------+             +-----------------------+
|  Real API Adapters    |             |  Mock Deterministic   |
|   (TavilySearch, etc.)|             |       Adapters        |
+-----------------------+             +-----------------------+
```

---

## 🛠️ Tool Specifications

### 1. `search_web_tool`
* **Purpose**: Performs a raw search query over the web with full source provenance (URLs, titles, snippets).
* **Input**: 
  - `query` (str)
  - `max_results` (int, default: 10)
* **Output**: `WebSearchResult` model (contains `query` and `results: List[WebSearchResultItem]`).
* **Provider**: Tavily Search (real) or MockSearchProvider (fallback).
* **Caching**: Cached in Redis with a 2-hour TTL.
* **Failure Behavior**: Gracefully fails, logs the structured error, and raises standard exceptions.

### 2. `fetch_url_tool`
* **Purpose**: Fetches a single page URL safely, parsing it into raw text, headers, title, and hashing it.
* **Input**:
  - `url` (str)
  - `timeout_sec` (float, default: 10.0)
  - `max_bytes` (int, default: 1MB)
* **Output**: `FetchedURL` model.
* **Provider**: Async HTTPX Client with follow redirects.
* **Caching**: Cached in Redis with a 24-hour TTL.
* **Limits & Safety**:
  - Strict **1MB payload ceiling** enforced via streaming chunks to prevent memory blowouts.
  - Ignores binary, video, or non-text content-types.
  - Exponential retry backoff on server glitches.

### 3. `research_company_site_tool`
* **Purpose**: Performs targeted, safe exploration of the supplied company homepage and common directory paths.
* **Input**:
  - `company_name` (str)
  - `website` (str)
  - `max_pages` (int, default: 5)
* **Output**: `CompanySiteResearch` model (contains a list of `FetchedURL` objects).
* **Limits & Safety**:
  - No recursive crawls (guards against crawl traps).
  - Deduplicates paths automatically.

### 4. `search_jobs_tool`
* **Purpose**: Discovers open roles, hiring spikes, and skills demands.
* **Input**:
  - `company_name` (str)
  - `domain` (str)
* **Output**: List of `JobRecord` models.
* **Provider**: MockJobProvider (deterministic fallback).
* **Caching**: Cached in Redis with an 8-hour TTL.

### 5. `search_company_news_tool`
* **Purpose**: Searches for funding, expansions, launch and signal-news.
* **Input**:
  - `company_name` (str)
  - `domain` (str)
  - `query` (str)
* **Output**: List of `NewsSignal` models.
* **Provider**: Tavily Search wrapper.
* **Caching**: Cached in Redis with a 2-hour TTL.

### 6. `find_people_tool`
* **Purpose**: Identifies potential target buyers matching roles hints (e.g. "Sales", "Engineering").
* **Input**:
  - `company_name` (str)
  - `domain` (str)
  - `role_hints` (List[str], optional)
* **Output**: List of `PeopleCandidate` models.
* **Provider**: MockPeopleProvider (deterministic fallback). No LinkedIn scrapers to preserve compliance.
* **Caching**: Cached in Redis with a 4-hour TTL.

---

## ⚡ Redis Caching & Normalization

* **Deterministic Keys**: Cache keys are generated deterministically by sorting payload parameters, serialization to JSON, and SHA-256 hashing.
* **Memory Fallback**: If Redis is unconfigured or unreachable, the cache seamlessly falls back to a thread-safe Python memory store with native TTL checking to protect local runs.
* **Normalization**: Uses `normalize_url` to strip UTM query garbage, trailing slashes, and `www.` prefixes to maximize cache hits across slightly varying URLs.
