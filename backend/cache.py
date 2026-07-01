"""
Simple in-memory TTL cache. No Redis needed — avoids extra cost on Render free tier.
Cache is process-local and resets on restart (acceptable for leaderboards, quizzes).
"""
import time
from typing import Any

_cache: dict[str, tuple[Any, float]] = {}


def cache_get(key: str) -> Any | None:
    """Return cached value if it exists and has not expired."""
    entry = _cache.get(key)
    if entry is not None and time.time() < entry[1]:
        return entry[0]
    return None


def cache_set(key: str, value: Any, ttl_seconds: int = 300) -> None:
    """Store value in cache with a TTL (seconds)."""
    _cache[key] = (value, time.time() + ttl_seconds)


def cache_delete(key: str) -> None:
    """Remove a key from cache."""
    _cache.pop(key, None)


def cache_delete_prefix(prefix: str) -> None:
    """Remove all keys starting with prefix."""
    to_delete = [k for k in _cache if k.startswith(prefix)]
    for k in to_delete:
        del _cache[k]
