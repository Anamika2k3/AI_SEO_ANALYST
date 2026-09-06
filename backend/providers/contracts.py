from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List


class TrendProvider(ABC):
    @abstractmethod
    def list_trends(self, industry: str) -> List[Dict[str, Any]]:
        raise NotImplementedError


class NewsProvider(ABC):
    @abstractmethod
    def list_articles(self, industry: str) -> List[Dict[str, Any]]:
        raise NotImplementedError


class SearchProvider(ABC):
    @abstractmethod
    def list_keywords(self, industry: str) -> List[Dict[str, Any]]:
        raise NotImplementedError


class SEOProvider(ABC):
    @abstractmethod
    def analyze(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError


class CompetitorProvider(ABC):
    @abstractmethod
    def list_competitors(self, industry: str) -> List[Dict[str, Any]]:
        raise NotImplementedError


class PublicationProvider(ABC):
    @abstractmethod
    def list_publications(self, industry: str) -> List[Dict[str, Any]]:
        raise NotImplementedError
