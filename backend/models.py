from dataclasses import dataclass, field
from typing import Literal

TrendStage = Literal["NORMAL", "EMERGING", "ACCELERATING", "PEAK", "DECLINING"]
Priority = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]


@dataclass
class TrendSnapshot:
    id: str
    trend_id: str
    timestamp: str
    search_score: float
    news_score: float
    social_score: float
    competitor_coverage: float


@dataclass
class Trend:
    id: str
    title: str
    description: str
    industry: str
    category: str
    country: str
    search_momentum: float
    news_momentum: float
    social_momentum: float
    competitor_coverage: float
    trend_stage: TrendStage
    detected_at: str
    updated_at: str


@dataclass
class ScoreBreakdown:
    search_momentum: float = 0.0
    search_demand: float = 0.0
    competition: float = 0.0
    content_gap: float = 0.0
    freshness: float = 0.0
    news_momentum: float = 0.0
    newsworthiness: float = 0.0
    publication_relevance: float = 0.0
    backlink_potential: float = 0.0
    audience_relevance: float = 0.0


@dataclass
class Opportunity:
    id: str
    trend_id: str
    seo_score: float
    pr_score: float
    overall_score: float
    priority: Priority
    recommended_action: str
    created_at: str
    updated_at: str
    score_breakdown: ScoreBreakdown = field(default_factory=ScoreBreakdown)
