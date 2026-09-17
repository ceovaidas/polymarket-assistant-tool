from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date


@dataclass
class Post:
    """One piece of user-written text that may voice an unmet need."""

    id: str
    title: str
    text: str = ""
    upvotes: int = 0
    comments: int = 0
    created: date | None = None
    community: str = ""
    url: str = ""

    @property
    def body(self) -> str:
        return f"{self.title}\n{self.text}"

    @property
    def engagement(self) -> int:
        return max(0, self.upvotes) + 2 * max(0, self.comments)


@dataclass
class Hypothesis:
    """A product idea assembled from repeated demand expressions."""

    term: str
    score: float
    mentions: int
    mean_strength: float
    kinds: dict[str, int]
    communities: list[str]
    engagement: int
    newest: date | None
    examples: list[str] = field(default_factory=list)

    @property
    def unmet_share(self) -> float:
        total = sum(self.kinds.values()) or 1
        return self.kinds.get("unmet", 0) / total
