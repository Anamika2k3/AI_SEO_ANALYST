from __future__ import annotations

from dataclasses import asdict
from typing import Dict

from .models import ScoreBreakdown, TrendStage


def normalize_score(value: float, min_value: float = 0.0, max_value: float = 100.0) -> float:
    if max_value == min_value:
        return 0.0
    clamped = max(min_value, min(max_value, value))
    return round(((clamped - min_value) / (max_value - min_value)) * 100, 2)


def calculate_seo_score(
    search_momentum: float,
    search_demand: float,
    competition: float,
    content_gap: float,
    freshness: float,
) -> tuple[float, Dict[str, float]]:
    competition_component = 100 - normalize_score(competition)
    breakdown = ScoreBreakdown(
        search_momentum=normalize_score(search_momentum),
        search_demand=normalize_score(search_demand),
        competition=round(competition_component, 2),
        content_gap=normalize_score(content_gap),
        freshness=normalize_score(freshness),
    )
    score = (
        breakdown.search_momentum * 0.25
        + breakdown.search_demand * 0.20
        + breakdown.competition * 0.15
        + breakdown.content_gap * 0.20
        + breakdown.freshness * 0.20
    )
    return round(score, 2), asdict(breakdown)


def calculate_pr_score(
    news_momentum: float,
    newsworthiness: float,
    publication_relevance: float,
    backlink_potential: float,
    audience_relevance: float,
) -> tuple[float, Dict[str, float]]:
    breakdown = ScoreBreakdown(
        news_momentum=normalize_score(news_momentum),
        newsworthiness=normalize_score(newsworthiness),
        publication_relevance=normalize_score(publication_relevance),
        backlink_potential=normalize_score(backlink_potential),
        audience_relevance=normalize_score(audience_relevance),
    )
    score = (
        breakdown.news_momentum * 0.25
        + breakdown.newsworthiness * 0.25
        + breakdown.publication_relevance * 0.20
        + breakdown.backlink_potential * 0.15
        + breakdown.audience_relevance * 0.15
    )
    return round(score, 2), asdict(breakdown)


def calculate_overall_score(seo_score: float, pr_score: float) -> float:
    return round(normalize_score((seo_score * 0.5) + (pr_score * 0.5)), 2)


def determine_trend_stage(
    current_search_momentum: float,
    previous_search_momentum: float | None = None,
    historical_average: float | None = None,
) -> TrendStage:
    if previous_search_momentum is None and historical_average is None:
        if current_search_momentum >= 85:
            return "PEAK"
        if current_search_momentum >= 65:
            return "ACCELERATING"
        if current_search_momentum >= 40:
            return "EMERGING"
        return "NORMAL"

    baseline = historical_average if historical_average is not None else previous_search_momentum or 0.0
    delta = current_search_momentum - baseline
    if current_search_momentum >= 85:
        return "PEAK"
    if delta >= 15:
        return "ACCELERATING"
    if delta >= 5:
        return "EMERGING"
    if delta <= -12:
        return "DECLINING"
    return "NORMAL"
