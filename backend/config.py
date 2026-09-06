from dataclasses import dataclass, field

PRODUCT_NAME = "SEOplus"
PRODUCT_TAGLINE = "Understand every page. Find the next opportunity."
DEFAULT_API_PROVIDER = "openai"
DEFAULT_INDUSTRY = "igaming"


@dataclass(frozen=True)
class IndustryCategory:
    id: str
    label: str


@dataclass(frozen=True)
class IndustryConfig:
    id: str
    label: str
    description: str
    categories: list[IndustryCategory] = field(default_factory=list)


INDUSTRIES = [
    IndustryConfig(
        id="igaming",
        label="iGaming",
        description="Primary demo vertical for gambling, sportsbook, and gaming intelligence.",
        categories=[
            IndustryCategory("online-casino", "Online Casino"),
            IndustryCategory("sports-betting", "Sports Betting"),
            IndustryCategory("gambling-regulation", "Gambling Regulation"),
            IndustryCategory("responsible-gambling", "Responsible Gambling"),
            IndustryCategory("payments", "Payments"),
            IndustryCategory("crypto", "Crypto"),
            IndustryCategory("esports", "Esports"),
            IndustryCategory("gambling-technology", "Gambling Technology"),
        ],
    ),
    IndustryConfig(
        id="technology",
        label="Technology",
        description="AI, SaaS, cloud, cybersecurity, and developer tooling signals.",
        categories=[
            IndustryCategory("ai", "AI"),
            IndustryCategory("saas", "SaaS"),
            IndustryCategory("cybersecurity", "Cybersecurity"),
            IndustryCategory("cloud", "Cloud"),
            IndustryCategory("developer-tools", "Developer Tools"),
        ],
    ),
    IndustryConfig(
        id="automotive",
        label="Automotive",
        description="EVs, autonomous driving, and automotive technology.",
        categories=[
            IndustryCategory("ev", "EV"),
            IndustryCategory("autonomous-vehicles", "Autonomous Vehicles"),
            IndustryCategory("automotive-tech", "Automotive Technology"),
            IndustryCategory("regulation", "Regulation"),
        ],
    ),
]
