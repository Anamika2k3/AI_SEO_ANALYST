export interface OpportunityScoreBreakdown {
  search_momentum?: number;
  search_demand?: number;
  competition?: number;
  content_gap?: number;
  freshness?: number;
  news_momentum?: number;
  newsworthiness?: number;
  publication_relevance?: number;
  backlink_potential?: number;
  audience_relevance?: number;
}

export interface OpportunityScore {
  seo_score: number;
  pr_score: number;
  overall_score: number;
  seo_breakdown: OpportunityScoreBreakdown;
  pr_breakdown: OpportunityScoreBreakdown;
}

export interface Opportunity {
  id: string;
  trend_id: string;
  seo_score: number;
  pr_score: number;
  overall_score: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommended_action: string;
  created_at: string;
  updated_at: string;
  score_breakdown?: OpportunityScore;
}
