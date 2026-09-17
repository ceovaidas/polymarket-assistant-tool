"""Data sources. Every fetcher degrades gracefully: on failure it returns None
and records why, so a partial scan still produces a ranked list with honest
confidence numbers instead of crashing.
"""
from .base import FetchResult, SourceError, weekly_from_daily

__all__ = ["FetchResult", "SourceError", "weekly_from_daily"]
