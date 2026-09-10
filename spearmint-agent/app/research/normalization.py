import re
from datetime import datetime
from urllib.parse import urlparse, urlunparse


def normalize_url(url: str) -> str:
    """
    Normalizes a URL to a canonical format.
    Strips trailing slashes, downcases hostnames, and discards standard query parameters.
    """
    if not url:
        return ""
    try:
        parsed = urlparse(url.strip())
        # Canonical scheme and hostname
        scheme = parsed.scheme.lower() if parsed.scheme else "https"
        netloc = parsed.netloc.lower()
        
        # Remove www. prefix if present for canonical domain match
        netloc = netloc.removeprefix("www.")
            
        path = parsed.path
        path = path.removesuffix("/")
            
        # Ignore common tracking or transient query params like UTMs
        query_params = []
        if parsed.query:
            params = parsed.query.split("&")
            for param in params:
                if not any(param.startswith(utm) for utm in ["utm_", "fbclid", "gclid"]):
                    query_params.append(param)
        
        query = "&".join(query_params)
        
        return urlunparse((scheme, netloc, path, parsed.params, query, ""))
    except Exception:
        return url.strip()

def normalize_domain(domain: str) -> str:
    """
    Cleans up a domain or website string to a canonical raw domain (e.g. example.com).
    """
    if not domain:
        return ""
    domain = domain.strip().lower()
    # Remove URL prefixes
    domain = re.sub(r"^https?://", "", domain)
    domain = re.sub(r"^www\.", "", domain)
    # Extract hostname
    parsed = urlparse("https://" + domain)
    netloc = parsed.netloc
    return netloc if netloc else domain

def normalize_timestamp(dt: datetime | str | float | None) -> str:
    """
    Converts diverse date/time types into standard ISO-8601 UTC string format.
    """
    if dt is None:
        return datetime.utcnow().isoformat() + "Z"
    if isinstance(dt, datetime):
        return dt.isoformat() + "Z"
    if isinstance(dt, (int, float)):
        return datetime.utcfromtimestamp(dt).isoformat() + "Z"
    try:
        # Try parsing ISO
        parsed_dt = datetime.fromisoformat(str(dt).replace("Z", "+00:00"))
        return parsed_dt.isoformat() + "Z"
    except Exception:
        return str(dt)
