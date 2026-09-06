export type IndustryId =
  | "igaming"
  | "technology"
  | "finance"
  | "automotive"
  | "ecommerce"
  | "travel"
  | "healthcare"
  | "other";

export interface IndustryCategory {
  id: string;
  label: string;
}

export interface IndustryConfig {
  id: IndustryId;
  label: string;
  description: string;
  categories: IndustryCategory[];
}

export const INDUSTRIES: IndustryConfig[] = [
  {
    id: "igaming",
    label: "iGaming",
    description: "Primary demo vertical for gambling, sportsbook, and gaming intelligence.",
    categories: [
      { id: "online-casino", label: "Online Casino" },
      { id: "sports-betting", label: "Sports Betting" },
      { id: "gambling-regulation", label: "Gambling Regulation" },
      { id: "responsible-gambling", label: "Responsible Gambling" },
      { id: "payments", label: "Payments" },
      { id: "crypto", label: "Crypto" },
      { id: "esports", label: "Esports" },
      { id: "gambling-technology", label: "Gambling Technology" },
    ],
  },
  {
    id: "technology",
    label: "Technology",
    description: "AI, SaaS, cloud, cybersecurity, and developer tooling signals.",
    categories: [
      { id: "ai", label: "AI" },
      { id: "saas", label: "SaaS" },
      { id: "cybersecurity", label: "Cybersecurity" },
      { id: "cloud", label: "Cloud" },
      { id: "developer-tools", label: "Developer Tools" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    description: "Payments, banking, trading, fintech, and regulation.",
    categories: [
      { id: "fintech", label: "Fintech" },
      { id: "payments", label: "Payments" },
      { id: "banking", label: "Banking" },
      { id: "investing", label: "Investing" },
      { id: "regulation", label: "Regulation" },
    ],
  },
  {
    id: "automotive",
    label: "Automotive",
    description: "EVs, autonomous driving, and automotive technology.",
    categories: [
      { id: "ev", label: "EV" },
      { id: "autonomous-vehicles", label: "Autonomous Vehicles" },
      { id: "automotive-tech", label: "Automotive Technology" },
      { id: "regulation", label: "Regulation" },
    ],
  },
  {
    id: "ecommerce",
    label: "E-commerce",
    description: "Marketplace, retail, conversion, and shopping trends.",
    categories: [
      { id: "marketplaces", label: "Marketplaces" },
      { id: "retail-tech", label: "Retail Tech" },
      { id: "conversion", label: "Conversion" },
    ],
  },
  {
    id: "travel",
    label: "Travel",
    description: "Destination demand, hospitality, airlines, and booking trends.",
    categories: [
      { id: "destinations", label: "Destinations" },
      { id: "hospitality", label: "Hospitality" },
      { id: "airlines", label: "Airlines" },
    ],
  },
  {
    id: "healthcare",
    label: "Healthcare",
    description: "Patient intent, public health, and healthcare innovation.",
    categories: [
      { id: "telehealth", label: "Telehealth" },
      { id: "medtech", label: "MedTech" },
      { id: "public-health", label: "Public Health" },
    ],
  },
  {
    id: "other",
    label: "Other",
    description: "Generic industry profile for custom deployments.",
    categories: [{ id: "general", label: "General" }],
  },
];

export const DEFAULT_INDUSTRY: IndustryId = "igaming";

export const getIndustryConfig = (industryId: string) =>
  INDUSTRIES.find((industry) => industry.id === industryId) ?? INDUSTRIES[0];
