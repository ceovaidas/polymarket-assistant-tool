"""Mine demand expressions out of free text.

The literal version of "products nobody resells yet" is not a marketplace
query - it is people saying out loud that they cannot find something. Those
sentences follow a small number of shapes, and the shape says how unmet the
demand is:

    "does anyone make X"      -> supply genuinely missing      (strongest)
    "where can I buy X"       -> supply exists but is hard to find
    "recommendations for X"   -> ordinary shopping             (weakest)
"""
from __future__ import annotations

import re
from dataclasses import dataclass

# Trigger phrase -> how unmet the demand it expresses is (0..1).
TRIGGERS: tuple[tuple[str, float, str], ...] = (
    (r"why (?:doesn'?t|does no ?one|hasn'?t) (?:anyone |anybody |someone )?(?:make|made|sell|sold)", 1.00, "unmet"),
    (r"i wish (?:someone|somebody|they|there)(?: was)? (?:made|make|sold|sell)", 1.00, "unmet"),
    (r"does (?:anyone|anybody) (?:make|sell|produce)", 0.95, "unmet"),
    (r"(?:i )?can'?t find (?:a|an|any|the)?", 0.85, "unmet"),
    (r"is there (?:a|an|any)", 0.75, "unmet"),
    (r"(?:i'?m )?looking for (?:a|an|some)?", 0.60, "search"),
    (r"where (?:can|do) i (?:buy|find|get|order)(?: a| an| some)?", 0.60, "search"),
    (r"anyone know where to (?:buy|find|get)(?: a| an| some)?", 0.60, "search"),
    (r"(?:best|good) (?:.{0,12}?)?(?:for|to)", 0.30, "shopping"),
    (r"recommendations? (?:for|on)", 0.30, "shopping"),
)

# Words that end a product phrase: the noun phrase stops before them.
_STOP_WORDS = {
    "that", "which", "who", "but", "because", "since", "so", "and", "or",
    "with", "without", "under", "over", "for", "from", "in", "on", "at",
    "like", "than", "when", "while", "if", "though", "unless", "after",
    "before", "about", "around", "near", "any", "anymore", "anyone",
}
_LEADING_ARTICLES = {"a", "an", "the", "some", "any", "my", "your", "this", "these", "those"}
# Trailing filler splits one hypothesis into several, which silently weakens the
# repetition signal the ranking depends on. Trim it before bucketing.
_TRAILING_NOISE = {
    "anywhere", "anymore", "online", "please", "thanks", "anyone", "somewhere",
    "here", "now", "today", "yet", "really", "actually", "even", "still",
    "cheap", "cheaply", "locally", "again", "ever", "else",
}
_TOKEN = re.compile(r"[a-z0-9][a-z0-9'\-]*")
# Phrases built only from these are questions about advice, not about products.
_GENERIC = {
    "advice", "help", "idea", "ideas", "recommendation", "recommendations",
    "suggestion", "suggestions", "something", "anything", "everything", "one",
    "way", "ways", "thing", "things", "stuff", "option", "options", "info",
    "information", "someone", "anybody", "people", "guy", "person", "here",
    "there", "place", "site", "website", "store", "shop", "brand", "company",
}

# Phrases this short or this long are noise, not products.
MIN_WORDS, MAX_WORDS = 2, 5


@dataclass(frozen=True)
class Extraction:
    term: str
    strength: float
    kind: str
    trigger: str


def _normalise(tokens: list[str]) -> str:
    while tokens and tokens[0] in _LEADING_ARTICLES:
        tokens = tokens[1:]
    while tokens and tokens[-1] in _TRAILING_NOISE:
        tokens = tokens[:-1]
    return " ".join(tokens).strip()


def _take_phrase(tail: str) -> str | None:
    """Pull the product noun phrase out of the text following a trigger."""
    tokens: list[str] = []
    for match in _TOKEN.finditer(tail.lower()):
        word = match.group(0)
        if word in _STOP_WORDS and tokens:
            break
        if word in _STOP_WORDS and not tokens and word not in _LEADING_ARTICLES:
            break
        tokens.append(word)
        if len(tokens) >= MAX_WORDS + 2:
            break
    phrase = _normalise(tokens)
    words = phrase.split()
    if not (MIN_WORDS <= len(words) <= MAX_WORDS):
        return None
    if all(len(w) <= 2 for w in words):
        return None
    if all(w in _GENERIC for w in words):
        return None
    return phrase


def extract(text: str) -> list[Extraction]:
    """Find every demand expression in a block of text."""
    found: list[Extraction] = []
    lowered = text.lower()
    for pattern, strength, kind in TRIGGERS:
        for match in re.finditer(pattern, lowered):
            phrase = _take_phrase(text[match.end():])
            if phrase:
                found.append(Extraction(term=phrase, strength=strength, kind=kind,
                                        trigger=match.group(0).strip()))
    # Keep the strongest reading of each phrase.
    best: dict[str, Extraction] = {}
    for item in found:
        if item.term not in best or item.strength > best[item.term].strength:
            best[item.term] = item
    return sorted(best.values(), key=lambda e: -e.strength)
