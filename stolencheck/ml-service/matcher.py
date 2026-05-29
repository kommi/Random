import numpy as np
from typing import List, Dict


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    a = np.asarray(a, dtype=np.float64)
    b = np.asarray(b, dtype=np.float64)

    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    return float(np.dot(a, b) / (norm_a * norm_b))


def find_top_matches(
    query_embedding: List[float],
    candidates: List[List[float]],
    top_k: int = 5,
) -> List[Dict]:
    """Return the top-k most similar candidates sorted by score descending.

    Each result is a dict with keys ``index`` and ``score``.
    """
    query = np.asarray(query_embedding, dtype=np.float64)

    scored: List[Dict] = []
    for idx, candidate in enumerate(candidates):
        score = cosine_similarity(query, np.asarray(candidate, dtype=np.float64))
        scored.append({"index": idx, "score": score})

    scored.sort(key=lambda x: x["score"], reverse=True)

    return scored[:top_k]
