import type { IndustryId } from "@/config/industries";

export type TrendStage = "NORMAL" | "EMERGING" | "ACCELERATING" | "PEAK" | "DECLINING";

export interface TrendSnapshot {
  id: string;
  trend_id: string;
  timestamp: string;
  search_score: number;
  news_score: number;
  social_score: number;
  competitor_coverage: number;
}

export interface Trend {
  id: string;
  title: string;
  description: string;
  industry: IndustryId | string;
  category: string;
  country: string;
  search_momentum: number;
  news_momentum: number;
  social_momentum: number;
  competitor_coverage: number;
  trend_stage: TrendStage;
  detected_at: string;
  updated_at: string;
}
