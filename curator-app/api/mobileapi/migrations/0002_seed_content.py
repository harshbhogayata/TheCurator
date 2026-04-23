from datetime import date

from django.db import migrations


ARTICLES = [
    {
        "title": "The Quiet Resurgence of Volatility in Emerging Markets",
        "excerpt": "A synthesized analysis of global equity shifts, tracking the interplay between currency devaluation and institutional capital flight across the Pacific Rim...",
        "category": "Economy",
        "read_time_minutes": 6,
        "published_at": date(2026, 3, 23),
        "author": "The Curator Editorial Team",
        "sources": ["NY", "FT", "WS", "EC", "AP", "RT", "GD", "AF", "TX", "+1"],
        "image_query": "modern architecture shadows geometric",
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "audio_duration_sec": 372,
        "content": "As global markets recalibrate following years of unprecedented monetary expansion, emerging markets face a particularly complex challenge. Recent data from major institutions suggests traditional safe-haven patterns are evolving, especially across Pacific Rim economies where sector-level volatility has diverged.",
    },
    {
        "title": "Beyond Silicon: The Biological Compute Revolution",
        "excerpt": "Major labs are reporting breakthrough success in organic data storage, suggesting a future where infrastructure grows rather than manufactured...",
        "category": "Technology",
        "read_time_minutes": 12,
        "published_at": date(2026, 3, 22),
        "author": "The Curator Science Desk",
        "sources": ["TC", "VG", "WI", "BB", "CN", "IT", "NX", "DT", "RD", "AR"],
        "image_query": "futuristic circuit board technology dark",
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        "audio_duration_sec": 720,
        "content": "Biocomputing has moved from speculative labs to practical prototypes. DNA-based storage and biologically-inspired processors are demonstrating major density and efficiency gains, while opening new reliability and standardization challenges.",
    },
    {
        "title": "The New Climate Diplomacy: Carbon Borders and Trade Wars",
        "excerpt": "As carbon border adjustments take effect, developing nations are challenging the framework that determines climate responsibility and economic opportunity...",
        "category": "Climate",
        "read_time_minutes": 8,
        "published_at": date(2026, 3, 21),
        "author": "The Curator International Desk",
        "sources": ["UN", "FT", "EC", "GD", "RE", "PT", "AL", "BB", "WP", "+2"],
        "image_query": "climate environment nature earth",
        "audio_url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        "audio_duration_sec": 480,
        "content": "Carbon border policy is now a first-order trade variable. As major blocs enforce climate-linked tariffs, legal, economic, and equity tensions are reshaping diplomatic strategy and industrial planning.",
    },
    {
        "title": "Renaissance of Regional Cuisine: How Food Is Defining Cultural Identity",
        "excerpt": "In an era of globalization, chefs and communities are reclaiming traditional foodways as expressions of cultural sovereignty and environmental stewardship...",
        "category": "Culture",
        "read_time_minutes": 7,
        "published_at": date(2026, 3, 20),
        "author": "The Curator Culture Desk",
        "sources": ["GR", "SA", "FT", "NY", "LA", "BO", "CH", "SE", "MI", "TO"],
        "image_query": "culture art museum gallery",
        "audio_url": "",
        "audio_duration_sec": None,
        "content": "Regional cuisine is re-emerging as both cultural language and policy lever, linking food systems, tourism strategy, and local identity in measurable ways.",
    },
    {
        "title": "The Longevity Equation: New Research Challenges Aging Assumptions",
        "excerpt": "Longitudinal studies across five continents suggest that our understanding of healthy aging may need fundamental revision...",
        "category": "Health",
        "read_time_minutes": 9,
        "published_at": date(2026, 3, 19),
        "author": "The Curator Health Desk",
        "sources": ["LN", "NM", "SC", "JA", "BM", "CE", "ST", "HV", "JH", "+1"],
        "image_query": "health wellness medicine medical",
        "audio_url": "",
        "audio_duration_sec": None,
        "content": "Cross-continental aging studies are shifting clinical assumptions around lifespan quality, metabolic risk windows, and personalized intervention timelines.",
    },
    {
        "title": "Decentralized Governance: Digital Democracy Experiments Yield Surprising Results",
        "excerpt": "Early adopters of blockchain-based voting systems report higher engagement, but questions about equity and access remain...",
        "category": "Politics",
        "read_time_minutes": 10,
        "published_at": date(2026, 3, 18),
        "author": "The Curator Politics Desk",
        "sources": ["PT", "EC", "WI", "FP", "AT", "GD", "RE", "BB", "PR", "VX"],
        "image_query": "politics government capitol building",
        "audio_url": "",
        "audio_duration_sec": None,
        "content": "New democratic technology pilots show promising participation improvements while exposing governance and inclusion tradeoffs that remain unresolved.",
    },
    {
        "title": "Space Mining: The New Resource Frontier",
        "excerpt": "Private companies are positioning for asteroid mining operations, raising questions about space law, environmental ethics, and economic disruption...",
        "category": "Science",
        "read_time_minutes": 11,
        "published_at": date(2026, 3, 17),
        "author": "The Curator Science Desk",
        "sources": ["NS", "ST", "SP", "WI", "FT", "EC", "RE", "BB", "AR", "+3"],
        "image_query": "science research laboratory discovery",
        "audio_url": "",
        "audio_duration_sec": None,
        "content": "Space resource extraction is transitioning from speculative finance to operational planning, accelerating legal debate around orbital property regimes.",
    },
    {
        "title": "The Return of Community Banking",
        "excerpt": "As fintech consolidation continues, a counter-movement emphasizes local lending, relationship banking, and community investment...",
        "category": "Economy",
        "read_time_minutes": 6,
        "published_at": date(2026, 3, 16),
        "author": "The Curator Economics Desk",
        "sources": ["FT", "WS", "EC", "BB", "RE", "AM", "FB", "CR", "LO", "TR"],
        "image_query": "modern architecture shadows geometric",
        "audio_url": "",
        "audio_duration_sec": None,
        "content": "Community banking models are gaining relevance as local credit ecosystems become strategic alternatives to consolidated digital finance channels.",
    },
]

BRIEFS = [
    {
        "title": "Your morning distillation: 8 vital insights for Wednesday",
        "summary": "A curated overview of the most important developments across markets, technology, and global policy to start your day informed.",
        "duration_minutes": 12,
        "published_at": date(2026, 3, 23),
        "category": "Daily Brief",
        "image_url": "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80",
        "audio_url": "https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav",
        "insights": 8,
    },
    {
        "title": "Technology Week in Review: AI governance and quantum breakthroughs",
        "summary": "This week saw major shifts in AI regulation frameworks alongside advances in quantum error correction from multiple labs.",
        "duration_minutes": 15,
        "published_at": date(2026, 3, 22),
        "category": "Weekly Tech",
        "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
        "audio_url": "https://www2.cs.uic.edu/~i101/SoundFiles/PinkPanther30.wav",
        "insights": 12,
    },
    {
        "title": "Climate Action Digest: Policy shifts across three continents",
        "summary": "New carbon border adjustments in the EU, revised emissions targets in Southeast Asia, and a landmark ruling in South America reshape the climate landscape.",
        "duration_minutes": 10,
        "published_at": date(2026, 3, 21),
        "category": "Climate Focus",
        "image_url": "https://images.unsplash.com/photo-1476611338391-6f395a0ebc7b?auto=format&fit=crop&w=1200&q=80",
        "audio_url": "https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav",
        "insights": 6,
    },
    {
        "title": "Economic Indicators: Markets respond to central bank signals",
        "summary": "Central banks across major economies sent mixed signals this week, with bond markets reacting sharply to policy language changes.",
        "duration_minutes": 8,
        "published_at": date(2026, 3, 20),
        "category": "Markets",
        "image_url": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
        "audio_url": "https://www2.cs.uic.edu/~i101/SoundFiles/CantinaBand3.wav",
        "insights": 5,
    },
]


def seed_content(apps, schema_editor):
    Article = apps.get_model("mobileapi", "Article")
    Brief = apps.get_model("mobileapi", "Brief")

    for rank, article_payload in enumerate(ARTICLES):
        defaults = dict(article_payload)
        defaults["rank"] = rank
        defaults["is_active"] = True
        Article.objects.update_or_create(
            title=article_payload["title"],
            defaults=defaults,
        )

    for rank, brief_payload in enumerate(BRIEFS):
        defaults = dict(brief_payload)
        defaults["rank"] = rank
        defaults["is_active"] = True
        Brief.objects.update_or_create(
            title=brief_payload["title"],
            defaults=defaults,
        )


def noop_reverse(apps, schema_editor):
    return


class Migration(migrations.Migration):

    dependencies = [
        ("mobileapi", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_content, noop_reverse),
    ]
