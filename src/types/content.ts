export interface Keyword {
  id: string;
  keyword: string;
  industry: string;
  category: string;
  intent: "INFORMATIONAL" | "COMMERCIAL" | "TRANSACTIONAL" | "NAVIGATIONAL";
  search_volume: number;
  difficulty: number;
  freshness: number;
  cluster: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  published_at: string;
  industry?: string;
  country: string;
  category: string;
  topic: string;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  relevance: number;
}
