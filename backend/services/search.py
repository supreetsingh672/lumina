import re
from rank_bm25 import BM25Okapi


def _tokenize(text: str) -> list:
    return re.sub(r'[^\w\s]', '', text.lower()).split()


def search_transcript(chunks: list, query: str, top_k: int = 6) -> list:
    if not chunks:
        return []

    tokenized = [_tokenize(c["text"]) for c in chunks]
    bm25 = BM25Okapi(tokenized)
    scores = bm25.get_scores(_tokenize(query))

    indexed = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
    results = []

    for idx, score in indexed[:top_k]:
        if score <= 0:
            continue
        chunk = chunks[idx]
        results.append({
            "timestamp": chunk["timestamp"],
            "seconds": int(chunk["start"]),
            "excerpt": chunk["text"],
            "relevance": "high" if score > 4 else "medium" if score > 1.5 else "low",
            "score": round(score, 2),
        })

    return results
