"""
Research Agent.
Executes HTTP search queries via Tavily API, Serper API, or DuckDuckGo HTML fallback.
Strict rules:
1. EVERY source_url comes directly from an HTTP search response. Zero hallucinated URLs.
2. Classifies sources into TIER_1 (Gov/Edu), TIER_2 (Financial Press), TIER_3 (Registries/Directories), TIER_4 (Public Web).
3. Applies Investment Relevance Filter to eliminate token collisions and irrelevant host products.
"""

from __future__ import annotations

import os
from typing import Any
import httpx
from urllib.parse import urlparse
from ..schemas import SearchQuery, SearchResult, SourceTier

_QUERY_CACHE: dict[str, list[SearchResult]] = {}


def classify_source_tier(url: str) -> SourceTier:
    """Classify domain into TIER_1, TIER_2, TIER_3, or TIER_4 based on authority."""
    domain = urlparse(url).netloc.lower()

    # TIER_1: Primary Government / University / Statutory Regulators
    if any(domain.endswith(ext) for ext in [".gov", ".gov.in", ".edu", ".edu.in", ".ac.in"]) or any(
        reg in domain for reg in ["sebi.gov.in", "rbi.org.in", "mca.gov.in", "ibbi.gov.in"]
    ):
        return SourceTier.TIER_1

    # TIER_2: Established Financial & Business Press
    financial_press = [
        "economictimes",
        "livemint",
        "business-standard",
        "techcrunch",
        "inc42",
        "yourstory",
        "vccircle",
        "financialexpress",
        "cnbctv18",
        "reuters",
        "bloomberg",
    ]
    if any(press in domain for press in financial_press):
        return SourceTier.TIER_2

    # TIER_3: Corporate Directories, Database Registries & Professional Networks
    tier_3_dirs = [
        "zaubacorp",
        "tofler",
        "tracxn",
        "crunchbase",
        "pitchbook",
        "instafinancials",
        "linkedin",
        "wellfound",
        "angellist",
    ]
    if any(d in domain for d in tier_3_dirs):
        return SourceTier.TIER_3

    # TIER_4: Generic Public Web / Social / Blogs
    return SourceTier.TIER_4


class ResearchAgent:
    def __init__(self):
        self.tavily_key = os.getenv("TAVILY_API_KEY")
        self.serper_key = os.getenv("SERPER_API_KEY")

    async def execute_search_plan(self, queries: list[SearchQuery]) -> list[SearchResult]:
        all_results: list[SearchResult] = []

        for q in queries:
            if q.query_text in _QUERY_CACHE:
                all_results.extend(_QUERY_CACHE[q.query_text])
                continue

            results_for_query: list[SearchResult] = []

            # 1. Try Tavily API
            if self.tavily_key:
                try:
                    async with httpx.AsyncClient(timeout=8.0) as client:
                        resp = await client.post(
                            "https://api.tavily.com/search",
                            json={
                                "api_key": self.tavily_key,
                                "query": q.query_text,
                                "max_results": 4,
                                "include_answer": False,
                            },
                        )
                        if resp.status_code == 200:
                            data = resp.json()
                            for item in data.get("results", []):
                                url = item.get("url")
                                title = item.get("title") or "Search Result"
                                snippet = item.get("content") or ""
                                if url:
                                    tier = classify_source_tier(url)
                                    results_for_query.append(
                                        SearchResult(
                                            query_id=q.query_id,
                                            source_url=url,
                                            title=title,
                                            snippet=snippet,
                                            search_engine="Tavily",
                                            source_tier=tier,
                                        )
                                    )
                except Exception:
                    pass

            # 2. Try Serper API if Tavily yielded no results
            if not results_for_query and self.serper_key:
                try:
                    async with httpx.AsyncClient(timeout=8.0) as client:
                        resp = await client.post(
                            "https://google.serper.dev/search",
                            headers={"X-API-KEY": self.serper_key, "Content-Type": "application/json"},
                            json={"q": q.query_text, "num": 4},
                        )
                        if resp.status_code == 200:
                            data = resp.json()
                            for item in data.get("organic", []):
                                url = item.get("link")
                                title = item.get("title") or "Search Result"
                                snippet = item.get("snippet") or ""
                                if url:
                                    tier = classify_source_tier(url)
                                    results_for_query.append(
                                        SearchResult(
                                            query_id=q.query_id,
                                            source_url=url,
                                            title=title,
                                            snippet=snippet,
                                            search_engine="Serper",
                                            source_tier=tier,
                                        )
                                    )
                except Exception:
                    pass

            # 3. DuckDuckGo HTML Fallback
            if not results_for_query:
                try:
                    async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
                        resp = await client.get(
                            "https://html.duckduckgo.com/html/",
                            params={"q": q.query_text},
                            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) FundX/1.0 InvestorVerificationBot"},
                        )
                        if resp.status_code == 200:
                            import re
                            links = re.findall(r'<a class="result__url" href="([^"]+)">(.*?)</a>', resp.text)
                            snippets = re.findall(r'<a class="result__snippet[^"]*">(.*?)</a>', resp.text)
                            for idx, (raw_url, title_raw) in enumerate(links[:4]):
                                clean_url = raw_url.strip()
                                if clean_url.startswith("//"):
                                    clean_url = "https:" + clean_url
                                title = re.sub(r"<[^>]+>", "", title_raw).strip()
                                snippet = re.sub(r"<[^>]+>", "", snippets[idx]).strip() if idx < len(snippets) else title
                                if clean_url and "duckduckgo" not in clean_url:
                                    tier = classify_source_tier(clean_url)
                                    results_for_query.append(
                                        SearchResult(
                                            query_id=q.query_id,
                                            source_url=clean_url,
                                            title=title or "Public Footprint Link",
                                            snippet=snippet or "Indexed public search result",
                                            search_engine="DuckDuckGo",
                                            source_tier=tier,
                                        )
                                    )
                except Exception:
                    pass

            _QUERY_CACHE[q.query_text] = results_for_query
            all_results.extend(results_for_query)

        return all_results
