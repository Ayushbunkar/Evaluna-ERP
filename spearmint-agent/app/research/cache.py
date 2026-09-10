import hashlib
import json
import os
import time
from typing import Any

# Optional Redis import with memory fallback
try:
    import redis
    _HAS_REDIS = True
except ImportError:
    _HAS_REDIS = False

class ResearchCache:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.client = None
        self.memory_store: dict[str, Any] = {} # Fallback memory store
        
        if _HAS_REDIS:
            try:
                self.client = redis.from_url(self.redis_url, decode_responses=True)
                # Quick connection test
                self.client.ping()
                print(f"[ResearchCache] Successfully connected to Redis at: {self.redis_url}")
            except Exception as e:
                print(f"[ResearchCache] Warning: Redis failed connection ({e}). Falling back to in-memory dict.")
                self.client = None

    def _generate_key(self, namespace: str, payload: dict[str, Any]) -> str:
        """Generates a deterministic hash cache key."""
        serialized = json.dumps(payload, sort_keys=True)
        hashed = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
        return f"spearmint:{namespace}:{hashed}"

    def get(self, namespace: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        """Retrieves cached item by key."""
        key = self._generate_key(namespace, payload)
        if self.client:
            try:
                cached = self.client.get(key)
                if cached:
                    return json.loads(cached)
            except Exception as e:
                print(f"[ResearchCache] Redis read error: {e}")
        
        # Memory Fallback
        entry = self.memory_store.get(key)
        if entry:
            # Check TTL
            if entry["expires_at"] > time.time():
                return entry["data"]
            else:
                del self.memory_store[key]
        return None

    def set(self, namespace: str, payload: dict[str, Any], data: dict[str, Any], ttl_sec: int = 3600) -> None:
        """Saves item in cache with a strict TTL."""
        key = self._generate_key(namespace, payload)
        if self.client:
            try:
                self.client.setex(key, ttl_sec, json.dumps(data))
                return
            except Exception as e:
                print(f"[ResearchCache] Redis write error: {e}")
                
        # Memory Fallback
        self.memory_store[key] = {
            "data": data,
            "expires_at": time.time() + ttl_sec
        }

# Global cache instance
_cache_instance = None

def get_cache() -> ResearchCache:
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = ResearchCache()
    return _cache_instance
