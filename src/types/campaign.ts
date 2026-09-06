export interface Competitor {
  id: string;
  name: string;
  domain: string;
  industry: string;
  categories: string[];
  authority_score: number;
  content_focus: string[];
}

export interface Publication {
  id: string;
  name: string;
  domain: string;
  industry?: string;
  country: string;
  category: string;
  authority_score: number;
  industry_relevance: number;
  audience: string;
  backlink_potential: number;
}

export interface Campaign {
  id: string;
  title: string;
  industry: string;
  trend_id?: string;
  campaign_concept: string;
  seo_targets: string[];
  pr_angle: string;
  publication_targets: string[];
  outreach_strategy: string;
  created_at: string;
  updated_at: string;
}
