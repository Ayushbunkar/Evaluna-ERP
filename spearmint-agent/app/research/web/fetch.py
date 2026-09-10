import hashlib
import re
import time
from datetime import datetime

# Fallback parser using built-in HTMLParser in case BeautifulSoup is missing
from html.parser import HTMLParser
from typing import Any

import httpx


class MLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.in_ignored_tag = False
        self.ignored_tags = {"script", "style", "nav", "footer", "header", "noscript"}

    def handle_starttag(self, tag, attrs):
        if tag.lower() in self.ignored_tags:
            self.in_ignored_tag = True

    def handle_endtag(self, tag):
        if tag.lower() in self.ignored_tags:
            self.in_ignored_tag = False

    def handle_data(self, data):
        if not self.in_ignored_tag:
            self.text_parts.append(data)

    def get_text(self) -> str:
        raw_text = "".join(self.text_parts)
        # Clean extra whitespace
        return re.sub(r"\s+", " ", raw_text).strip()

def extract_metadata_fallback(html_content: str) -> dict[str, Any]:
    """Extract page title and clean text using Python's built-in HTMLParser."""
    # Fast title regex fallback
    title_match = re.search(r"<title>(.*?)</title>", html_content, re.IGNORECASE | re.DOTALL)
    title = title_match.group(1).strip() if title_match else ""
    
    parser = MLTextExtractor()
    try:
        parser.feed(html_content)
        text = parser.get_text()
    except Exception:
        # Extreme fallback
        text = re.sub(r"<[^>]+>", " ", html_content)
        text = re.sub(r"\s+", " ", text).strip()
        
    return {"title": title, "text": text}

async def fetch_url(
    url: str, 
    timeout_sec: float = 10.0, 
    max_bytes: int = 1 * 1024 * 1024, # 1MB limit for safety
    max_retries: int = 2
) -> dict[str, Any]:
    """
    Safely fetches a URL and extracts raw-ish text content and metadata.
    Protects against excessively large payloads, implements standard retries with backoff,
    and returns a normalized dict structure.
    """
    headers = {
        "User-Agent": "SpearmintBDEIntelligenceAgent/1.0 (+https://spearmint.com)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
    }
    
    client = httpx.AsyncClient(
        follow_redirects=True,
        timeout=httpx.Timeout(timeout_sec)
    )
    
    retrieved_at = datetime.utcnow().isoformat() + "Z"
    start_time = time.time()
    
    response_body = ""
    status_code = -1
    final_url = url
    content_type = "unknown"
    error_msg = None
    
    # Simple retry loop
    for attempt in range(max_retries + 1):
        try:
            # We fetch stream to prevent loading excessively large responses into memory
            async with client.stream("GET", url, headers=headers) as response:
                status_code = response.status_code
                final_url = str(response.url)
                content_type = response.headers.get("content-type", "text/html").split(";")[0]
                
                # Check headers to avoid streaming non-text content types
                if "text/" not in content_type and "xml" not in content_type:
                    return {
                        "url": url,
                        "final_url": final_url,
                        "status_code": status_code,
                        "content_type": content_type,
                        "title": "Non-Text Payload",
                        "text": f"Bypassed fetching non-text payload of type: {content_type}",
                        "retrieved_at": retrieved_at,
                        "content_hash": hashlib.sha256(b"").hexdigest(),
                        "latency_ms": (time.time() - start_time) * 1000,
                        "cache_hit": False
                    }
                
                content_length = 0
                chunks = []
                async for chunk in response.aiter_text():
                    chunks.append(chunk)
                    content_length += len(chunk.encode("utf-8", errors="ignore"))
                    if content_length > max_bytes:
                        response_body = "".join(chunks)[:max_bytes] + " ... [TRUNCATED DUE TO SIZE LIMIT]"
                        error_msg = "Content exceeded maximum allowed size"
                        break
                else:
                    response_body = "".join(chunks)
                    
            if status_code == 200:
                break
        except Exception as e:
            error_msg = str(e)
            if attempt == max_retries:
                break
            # Exponential backoff
            time.sleep(2.0 ** attempt)
        finally:
            await client.aclose()
            
    latency_ms = (time.time() - start_time) * 1000
    
    if status_code != 200:
        return {
            "url": url,
            "final_url": final_url,
            "status_code": status_code,
            "content_type": content_type,
            "title": "Error Fetching Page",
            "text": f"Failed to retrieve url: {url}. Status Code: {status_code}. Error: {error_msg}",
            "retrieved_at": retrieved_at,
            "content_hash": hashlib.sha256((error_msg or "").encode("utf-8")).hexdigest(),
            "latency_ms": latency_ms,
            "cache_hit": False
        }
        
    # Extract metadata using fallback (can be upgraded with BeautifulSoup if desired)
    meta = extract_metadata_fallback(response_body)
    
    content_hash = hashlib.sha256(response_body.encode("utf-8", errors="ignore")).hexdigest()
    
    return {
        "url": url,
        "final_url": final_url,
        "status_code": status_code,
        "content_type": content_type,
        "title": meta["title"],
        "text": meta["text"],
        "retrieved_at": retrieved_at,
        "content_hash": content_hash,
        "latency_ms": latency_ms,
        "cache_hit": False
    }
