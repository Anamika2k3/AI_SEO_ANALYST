from __future__ import annotations

from typing import Any, Dict, List

from ..mock_data import build_demo_dataset
from .contracts import (
    CompetitorProvider,
    NewsProvider,
    PublicationProvider,
    SEOProvider,
    SearchProvider,
    TrendProvider,
)


class _DemoProviderBase:
    def __init__(self) -> None:
        self.dataset = build_demo_dataset()

    def _filter_by_industry(self, items: List[Dict[str, Any]], industry: str) -> List[Dict[str, Any]]:
        if industry == "other":
            return items
        return [item for item in items if item.get("industry") == industry]


class MockTrendProvider(_DemoProviderBase, TrendProvider):
    def list_trends(self, industry: str) -> List[Dict[str, Any]]:
        return self._filter_by_industry(self.dataset["trends"], industry)


class MockNewsProvider(_DemoProviderBase, NewsProvider):
    def list_articles(self, industry: str) -> List[Dict[str, Any]]:
        return self._filter_by_industry(self.dataset["newsArticles"], industry)


class MockSearchProvider(_DemoProviderBase, SearchProvider):
    def list_keywords(self, industry: str) -> List[Dict[str, Any]]:
        return self._filter_by_industry(self.dataset["keywords"], industry)


class MockSEOProvider(_DemoProviderBase, SEOProvider):
    def analyze(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        industry = payload.get("industry", "igaming")
        keywords = self.list_keywords(industry)[:5]
        return {
            "industry": industry,
            "keywords": keywords,
            "summary": "Mock SEO analysis for demo and local development.",
        }

    def list_keywords(self, industry: str) -> List[Dict[str, Any]]:
        return self._filter_by_industry(self.dataset["keywords"], industry)


class MockCompetitorProvider(_DemoProviderBase, CompetitorProvider):
    def list_competitors(self, industry: str) -> List[Dict[str, Any]]:
        return self._filter_by_industry(self.dataset["competitors"], industry)


class MockPublicationProvider(_DemoProviderBase, PublicationProvider):
    def list_publications(self, industry: str) -> List[Dict[str, Any]]:
        return self._filter_by_industry(self.dataset["publications"], industry)
