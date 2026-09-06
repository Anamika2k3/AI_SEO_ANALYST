from __future__ import annotations

from dataclasses import dataclass
import os
from typing import Any, Dict, Optional

from openai import OpenAI

from ..config import DEFAULT_API_PROVIDER


@dataclass
class AIServiceConfig:
    provider: str = DEFAULT_API_PROVIDER
    api_key: str = ""
    model: str = "gpt-4o"
    base_url: str = ""


class AIService:
    def __init__(self, config: AIServiceConfig):
        self.config = config
        self._client: Optional[OpenAI] = None
        if config.api_key:
            client_kwargs = {"api_key": config.api_key}
            if config.base_url:
                client_kwargs["base_url"] = config.base_url
            self._client = OpenAI(**client_kwargs)

    @classmethod
    def from_config(cls, settings: Dict[str, Any]) -> "AIService":
        provider = (
            os.getenv("AI_PROVIDER")
            or settings.get("aiProvider")
            or settings.get("provider")
            or DEFAULT_API_PROVIDER
        )
        api_key = (
            os.getenv("AI_API_KEY")
            or os.getenv("OPENAI_API_KEY")
            or os.getenv("GROQ_API_KEY")
            or settings.get("openaiApiKey", "")
            or settings.get("aiApiKey", "")
            or settings.get("OPENAI_API_KEY", "")
        )
        model = os.getenv("AI_MODEL") or settings.get("aiModel", "gpt-4o")
        base_url = os.getenv("AI_BASE_URL") or settings.get("aiBaseUrl", "")
        if provider == "groq" and not base_url:
            base_url = "https://api.groq.com/openai/v1"
        return cls(AIServiceConfig(provider=provider, api_key=api_key, model=model, base_url=base_url))

    def is_available(self) -> bool:
        return self._client is not None

    def _fallback(self, title: str, text: str) -> str:
        return f"**{title}**\n\n{text}"

    def chat(self, system_prompt: str, user_content: str) -> str:
        if not self._client:
            return self._fallback("AI Response", user_content)
        return self._chat(system_prompt, user_content)

    def analyze_trend(self, trend: Dict[str, Any]) -> str:
        if not self._client:
            return self._fallback("Trend Analysis", f"{trend.get('title', 'Trend')} is showing actionable momentum.")
        return self._chat("Analyze this trend and explain why it matters.", str(trend))

    def summarize_event(self, payload: Dict[str, Any]) -> str:
        if not self._client:
            return self._fallback("Event Summary", payload.get("summary", "No summary available."))
        return self._chat("Summarize the event for SEO and PR teams.", str(payload))

    def classify_search_intent(self, payload: Dict[str, Any]) -> str:
        if not self._client:
            return "INFORMATIONAL"
        return self._chat("Classify the search intent.", str(payload))

    def generate_keyword_clusters(self, payload: Dict[str, Any]) -> str:
        if not self._client:
            return self._fallback("Keyword Clusters", "Cluster keywords by topic, intent, and freshness.")
        return self._chat("Generate keyword clusters from the input.", str(payload))

    def analyze_content_gap(self, payload: Dict[str, Any]) -> str:
        if not self._client:
            return self._fallback("Content Gap", "Identify missing coverage, weak angles, and fresh angles.")
        return self._chat("Analyze content gaps.", str(payload))

    def generate_seo_recommendations(self, payload: Dict[str, Any]) -> str:
        if not self._client:
            return self._fallback("SEO Recommendations", "Prioritize fresh, high-demand content with clear intent alignment.")
        return self._chat("Generate SEO recommendations.", str(payload))

    def generate_pr_angles(self, payload: Dict[str, Any]) -> str:
        if not self._client:
            return self._fallback("PR Angles", "Lead with relevance, timing, and a journalist-ready hook.")
        return self._chat("Generate PR angles.", str(payload))

    def match_publications(self, payload: Dict[str, Any]) -> str:
        if not self._client:
            return self._fallback("Publication Matches", "Match publications by topic, geography, and authority.")
        return self._chat("Rank the best publication targets.", str(payload))

    def generate_campaign(self, payload: Dict[str, Any]) -> str:
        if not self._client:
            return self._fallback("Campaign", "Create a story-led SEO + PR campaign from the opportunity.")
        return self._chat("Generate a campaign brief.", str(payload))

    def _chat(self, system_prompt: str, user_content: str) -> str:
        completion = self._client.chat.completions.create(
            model=self.config.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
        )
        return completion.choices[0].message.content or ""
