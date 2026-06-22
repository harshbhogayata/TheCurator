"""Additional editorial articles to reach a full Explore feed (25+ stories)."""

from mobileapi.source_links import resolve_source_links

# Each entry uses legacy ``sources`` codes; ``source_links`` is filled at import time.
EXTRA_ARTICLES = [
    {
        "title": "India's Monsoon Onset Shifts Crop Planning Across the Gangetic Plain",
        "excerpt": "A delayed but intense southwest monsoon is forcing state agriculture departments to revise sowing calendars for rice, pulses, and oilseeds.",
        "category": "Economy",
        "read_time_minutes": 4,
        "author": "The Curator Economy Desk",
        "sources": ["Reuters", "BBC"],
        "image_query": "India monsoon agriculture fields",
        "image_url": "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "Meteorologists tracking the 2026 southwest monsoon report that rainfall arrived roughly ten days later than the "
            "long-term average across Uttar Pradesh and Bihar, compressing the window farmers rely on for kharif planting. "
            "State cooperative banks have extended short-term credit lines, while extension officers are pushing drought-tolerant "
            "seed varieties in districts that received less than 40 percent of normal June precipitation.\n\n"
            "The delay is not uniform. Western Maharashtra and coastal Karnataka already recorded surplus rainfall, "
            "creating a split-screen economy in which some mandis are flush with early produce while others face seed shortages. "
            "Traders on the NCDEX have priced a modest premium into key futures contracts, reflecting concern that uneven "
            "distribution could trim national output even if aggregate rainfall normalizes by August.\n\n"
            "For consumers, the near-term impact is limited, but nutrition programs and export planners are watching closely. "
            "Any sustained shortfall in rice acreage would ripple through public distribution stocks and India's basmati export "
            "quotas heading into the festival season."
        ),
    },
    {
        "title": "EU Digital Markets Act Enforcement Enters Second Phase With Cloud Gateways",
        "excerpt": "European regulators are expanding DMA compliance reviews to hyperscaler marketplaces and default cloud bundles sold to public-sector buyers.",
        "category": "Technology",
        "read_time_minutes": 4,
        "author": "The Curator Policy Desk",
        "sources": ["FT", "Guardian"],
        "image_query": "European Union technology regulation",
        "image_url": "https://images.unsplash.com/photo-1454165804603-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "Brussels is moving from headline fines to operational remedies, asking several large cloud providers to "
            "unbundle identity, storage, and analytics suites that public institutions purchase as single SKUs. "
            "Compliance officers say the new questionnaires go deeper than last year's gatekeeper designations, "
            "focusing on whether default configurations steer procurement toward proprietary APIs.\n\n"
            "Vendors argue that integrated stacks reduce cybersecurity risk for municipalities with thin IT staff. "
            "Civil society groups counter that bundled discounts function as soft lock-in, raising long-run costs for "
            "schools and hospitals. A working group of national data-protection authorities is expected to publish "
            "reference architectures for interoperable identity federation by September.\n\n"
            "For global SaaS firms, the practical effect is another layer of EU-specific packaging and pricing. "
            "Analysts do not expect breakup orders, but they do anticipate mandatory data portability tests and "
            "clearer separation of marketplace rankings from first-party services."
        ),
    },
    {
        "title": "Japan Reopens Nuclear Restarts Debate After Summer Grid Strain",
        "excerpt": "Record cooling demand and a weaker yen are reviving political pressure to accelerate reactor restarts ahead of the Olympic-year tourism surge.",
        "category": "Climate",
        "read_time_minutes": 4,
        "author": "The Curator Energy Desk",
        "sources": ["Bloomberg", "Reuters"],
        "image_query": "nuclear power plant cooling towers sunset",
        "image_url": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "Utilities across Honshu reported tight reserve margins during a June heat dome that pushed Tokyo peak demand "
            "to multi-year highs. The Ministry of Economy, Trade and Industry convened an emergency session with regional "
            "grids, urging accelerated maintenance on reactors already cleared for restart while cautioning that seismic "
            "reviews cannot be shortcut.\n\n"
            "Public opinion remains split. Coastal communities that host plants welcome tax transfers and jobs, while "
            "metropolitan voters remember Fukushima's long aftermath. Environmental groups are pushing a parallel agenda: "
            "faster deployment of grid-scale batteries and demand-response incentives for commercial buildings.\n\n"
            "Investors read the moment as a modest bullish signal for uranium and for Japanese industrial exporters that "
            "fear rolling blackouts could dent factory utilization. The government insists any restart schedule will remain "
            "technocrat-led, not election-led."
        ),
    },
    {
        "title": "U.S. Labor Market Cooling Shows Up in Hiring Intentions, Not Layoffs",
        "excerpt": "Payroll growth is slowing through fewer openings rather than mass job cuts, a pattern that complicates recession forecasting.",
        "category": "Economy",
        "read_time_minutes": 4,
        "author": "The Curator Markets Desk",
        "sources": ["Bloomberg", "NYT"],
        "image_query": "office hiring job interview",
        "image_url": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "The latest establishment survey shows employers still reluctant to shrink headcount aggressively, but hiring "
            "plans in services and logistics have softened compared with early spring. Economists describe the pattern as "
            "a 'no-hire' slowdown: teams stretch existing staff while postponing backfills unless revenue reaccelerates.\n\n"
            "Wage growth has decelerated in sectors that normalized after pandemic disruptions, yet skilled trades and "
            "healthcare remain tight. That asymmetry keeps consumer spending resilient in aggregate even as delinquencies "
            "tick higher among younger renters carrying student and auto debt.\n\n"
            "Markets are pricing fewer Federal Reserve cuts than traders expected in May, betting that a gradual cooling "
            "is compatible with inflation drifting toward target without a sharp unemployment spike."
        ),
    },
    {
        "title": "WHO Reviews Avian Influenza Surveillance After Farm Worker Seropositivity Rises",
        "excerpt": "Expanded blood screening in poultry regions found more asymptomatic infections than prior seasons, prompting updated PPE guidance.",
        "category": "Health",
        "read_time_minutes": 4,
        "author": "The Curator Health Desk",
        "sources": ["WHO", "CDC"],
        "image_query": "poultry farm biosecurity",
        "image_url": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "Global health agencies are harmonizing surveillance protocols after pilot studies detected higher-than-expected "
            "seropositivity among workers in industrial poultry corridors. No sustained human-to-human chains have been "
            "confirmed, but the findings suggest exposure events are undercounted when monitoring relies on symptomatic cases alone.\n\n"
            "National veterinary services are pairing genomic sequencing of isolates from wild birds with wastewater "
            "sampling near processing plants. Retailers face renewed questions about labeling and cold-chain integrity, "
            "though food-safety authorities maintain that properly cooked poultry remains safe.\n\n"
            "The policy debate is shifting from panic prevention to occupational health: who pays for upgraded PPE, "
            "seasonal testing, and paid isolation for contract workers without sick leave."
        ),
    },
    {
        "title": "Apple Vision Pro Enterprise Pilots Report Productivity Gains in Field Service",
        "excerpt": "Utilities and aviation MRO shops are keeping spatial headsets on trial lists after remote-assist trials cut average repair times.",
        "category": "Technology",
        "read_time_minutes": 3,
        "author": "The Curator Tech Desk",
        "sources": ["Wired", "MIT"],
        "image_query": "augmented reality headset technician",
        "image_url": "https://images.unsplash.com/photo-1617802690992-15d93263d3a9?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "Enterprise buyers who dismissed spatial computing as a consumer novelty are publishing internal ROI memos "
            "that cite faster diagnostics when junior technicians stream expert overlays during turbine and avionics work. "
            "Battery weight and dust ingress remain objections on outdoor sites, but indoor maintenance bays are expanding pilots.\n\n"
            "Software vendors are prioritizing cross-platform remote assist so fleets are not locked to a single headset OEM. "
            "IT departments emphasize MDM policies, session logging, and kill switches before headsets leave the lab.\n\n"
            "Analysts expect 2026 enterprise shipments to remain niche in unit terms but influential in setting UX patterns "
            "for Android-based competitors arriving later this year."
        ),
    },
    {
        "title": "Cannes Documentary Jury Highlights Climate Litigation as a Storytelling Theme",
        "excerpt": "Several official-selection docs trace court battles over emissions disclosures, signaling appetite for investigative environmental narratives.",
        "category": "Culture",
        "read_time_minutes": 3,
        "author": "The Curator Culture Desk",
        "sources": ["Guardian", "BBC"],
        "image_query": "film festival cinema screen",
        "image_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "This year's documentary lineup treats court filings and FOIA archives with the same visual language once "
            "reserved for war reporting. Directors follow municipal plaintiffs, island nations, and pension funds as they "
            "argue that delayed climate disclosures impose measurable harms.\n\n"
            "Distributors say buyer interest is strongest for films that pair legal drama with local consequences—saltwater "
            "intrusion, insurance withdrawal, and school budget tradeoffs—rather than abstract carbon charts alone.\n\n"
            "The trend mirrors reader appetite in text journalism: audiences want accountability stories with named defendants "
            "and document trails, not only disaster imagery."
        ),
    },
    {
        "title": "Copper Supply Crunch Meets AI Data Center Buildout",
        "excerpt": "Hyperscalers are signing multi-year offtake talks as smelter outages and mine grade decline tighten refined copper availability.",
        "category": "Economy",
        "read_time_minutes": 4,
        "author": "The Curator Markets Desk",
        "sources": ["Bloomberg", "Economist"],
        "image_query": "copper wire industrial",
        "image_url": "https://images.unsplash.com/photo-1581094271901-ef2ffb732c1d?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "Data center developers competing for 2027 energization dates are discovering that electrical balance-of-plant "
            "lead times now dominate schedules as much as GPU deliveries. Refined copper inventories at major exchanges sit "
            "near seasonal lows, and traders report premia for prompt physical delivery.\n\n"
            "Recycling firms are pitching closed-loop contracts to strip and reprocess cabling from decommissioned facilities, "
            "but volumes remain insufficient for hyperscale campuses. Some operators are revisiting aluminum busbar designs "
            "despite efficiency tradeoffs.\n\n"
            "The macro takeaway: AI infrastructure is colliding with old-economy bottlenecks, giving commodity producers "
            "unusual leverage in negotiations typically dominated by cloud buyers."
        ),
    },
    {
        "title": "Brazil's Amazon Enforcement Wave Targets Illegal Airstrips Used by Loggers",
        "excerpt": "Federal police coordinated satellite detections with on-the-ground raids, destroying dozens of clandestine landing strips in Pará.",
        "category": "Climate",
        "read_time_minutes": 4,
        "author": "The Curator Climate Desk",
        "sources": ["Reuters", "Guardian"],
        "image_query": "amazon rainforest aerial",
        "image_url": "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "Enforcement agencies are treating illegal airstrips as infrastructure nodes in deforestation networks, not isolated "
            "clearings. Recent raids seized fuel caches and logging contracts linking remote strips to export intermediaries.\n\n"
            "Indigenous patrols supplied geotagged photos that matched synthetic-aperture radar detections, shortening response "
            "times in areas with sparse road access. Advocacy groups welcome the operations but demand sustained budgets after "
            "headline deployments end.\n\n"
            "Carbon-market skeptics argue that enforcement credibility is a prerequisite for any jurisdictional REDD+ claims; "
            "investors want third-party verification that reduced deforestation rates persist beyond election cycles."
        ),
    },
    {
        "title": "UK Universities Pilot AI-Assisted Seminars With Mandatory Disclosure Rules",
        "excerpt": "Participating faculties require students to label machine-generated drafts and limit automated peer review in humanities courses.",
        "category": "Technology",
        "read_time_minutes": 3,
        "author": "The Curator Education Desk",
        "sources": ["BBC", "Guardian"],
        "image_query": "university lecture hall students",
        "image_url": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "A consortium of Russell Group humanities departments published a shared syllabus addendum that treats AI assistants "
            "like calculators with guardrails: permitted for brainstorming and citation formatting, prohibited for final argument "
            "generation without attribution. Faculty report fewer wholesale essay fraud cases but more subtle style homogenization.\n\n"
            "Libraries are expanding workshops on primary-source verification, betting that close reading skills remain a moat "
            "against generic model prose. Student unions want clarity on appeal processes when detectors falsely flag non-English "
            "first-language writing.\n\n"
            "The pilots will be watched in North America and India, where similar policy debates are moving from faculty senates "
            "to accreditation requirements."
        ),
    },
    {
        "title": "Saudi Arabia Expands Renewable Auctions While Maintaining Oil Capacity Investments",
        "excerpt": "The kingdom's latest solar-plus-storage round drew record bids as officials reaffirm OPEC+ supply discipline.",
        "category": "Climate",
        "read_time_minutes": 4,
        "author": "The Curator Energy Desk",
        "sources": ["Reuters", "Bloomberg"],
        "image_query": "solar farm desert middle east",
        "image_url": "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "Energy planners frame the strategy as dual-track: capture long-run electricity demand with cheap renewables while "
            "preserving spare crude capacity that underpins geopolitical influence. Winning bidders paired photovoltaic arrays "
            "with four-hour storage commitments to smooth evening peaks.\n\n"
            "Western climate diplomats welcome the renewable scale-up but question whether it offsets emissions from planned "
            "petrochemical expansions. Domestic industrial users cheer falling midday power prices that improve desalination "
            "and aluminum economics.\n\n"
            "For global markets, the message is continuity: Saudi Arabia still treats oil revenue as strategic even as it "
            "becomes a major solar installer."
        ),
    },
    {
        "title": "Mexico's Judicial Reform Protests Echo in Peso and Sovereign Spreads",
        "excerpt": "Constitutional changes to judicial appointments triggered the largest street demonstrations in Mexico City since 2014.",
        "category": "Politics",
        "read_time_minutes": 4,
        "author": "The Curator World Desk",
        "sources": ["NYT", "Reuters"],
        "image_query": "city protest crowd flags",
        "image_url": "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "Investors are repricing rule-of-law risk as legislators advance reforms that would make judges stand for popular "
            "vote. Business chambers warn that contract enforcement could politicize, while government allies argue the judiciary "
            "shielded elite impunity for decades.\n\n"
            "The peso weakened modestly against the dollar, and five-year CDS spreads widened, though not to crisis levels. "
            "Nearshoring consultants say factory inquiries continue, but legal teams are adding scenario planning for arbitration "
            "seat changes.\n\n"
            "Washington is monitoring the debate quietly, mindful that trade corridors depend on predictable commercial courts."
        ),
    },
    {
        "title": "CRISPR Sickle-Cell Rollouts Face Infusion Center Bottlenecks in the U.S.",
        "excerpt": "Approved therapies exist, but hospital capacity and payer prior-authorization loops keep eligible patients on waiting lists.",
        "category": "Health",
        "read_time_minutes": 4,
        "author": "The Curator Science Desk",
        "sources": ["Nature", "NYT"],
        "image_query": "hospital infusion therapy",
        "image_url": "https://images.unsplash.com/photo-1579684385127-1ef15d508a118?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "Clinical success stories are colliding with operational reality: gene-edited therapies require specialized infusion "
            "beds, transfusion support, and weeks of monitoring that community oncology centers cannot absorb. Academic hubs "
            "report monthslong queues even for patients with qualifying genotypes.\n\n"
            "Insurers are experimenting with outcomes-based contracts, but prior authorization packets remain burdensome for "
            "hematologists in safety-net systems. Patient advocates push mobile education units to reach counties with high "
            "sickle-cell prevalence but no nearby trial sites.\n\n"
            "The bottleneck is a preview of broader cell-therapy access debates: scientific victory does not equal delivery victory."
        ),
    },
    {
        "title": "Vietnam Emerges as Alternate Assembly Hub for Consumer Electronics",
        "excerpt": "Component imports and factory permits rose after multinationals diversified final assembly away from single-country exposure.",
        "category": "Economy",
        "read_time_minutes": 3,
        "author": "The Curator Economy Desk",
        "sources": ["FT", "Bloomberg"],
        "image_query": "electronics factory assembly line",
        "image_url": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "Industrial parks outside Hanoi and Ho Chi Minh City report full occupancy for light-assembly tenants making earbuds, "
            "routers, and wearable accessories. Logistics firms added refrigerated and high-value cargo lanes to support denser "
            "component flows.\n\n"
            "Workforce training colleges partnered with OEMs to shorten onboarding for surface-mount and quality-assurance roles. "
            "Environmental groups urge faster grid decarbonization so export growth does not lock in coal-heavy power.\n\n"
            "Analysts caution that Vietnam cannot replicate every upstream node—some advanced semiconductor steps remain concentrated "
            "in Taiwan and South Korea—but the country is capturing margin in final assembly and test."
        ),
    },
    {
        "title": "NATO Cyber Range Exercises Simulate Satellite Jamming During Baltic Drills",
        "excerpt": "Allied militaries practiced degraded-GPS logistics scenarios amid rising electronic warfare incidents in northern Europe.",
        "category": "Politics",
        "read_time_minutes": 4,
        "author": "The Curator Security Desk",
        "sources": ["Reuters", "BBC"],
        "image_query": "military satellite communications",
        "image_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "Exercise planners injected GPS denial into convoy routing software, forcing units to revert to paper maps and "
            "pre-shared timing windows. Commercial shippers nearby reported brief navigation anomalies, prompting civil aviation "
            "and maritime agencies to monitor NOTAM volumes closely.\n\n"
            "Cyber teams defended simulated spoofing against ground-station terminals while space commands rehearsed "
            "frequency hopping with commercial constellation operators. NATO communiqués emphasized resilience over retaliation "
            "in ambiguous gray-zone incidents.\n\n"
            "Civilian takeaway: electronic warfare is no longer a future war scenario—it is a recurring peacetime maintenance risk "
            "for logistics firms operating near militarized corridors."
        ),
    },
    {
        "title": "Global South Debt Roundtable Pushes Clawback Clauses on Hidden Guarantees",
        "excerpt": "Finance ministers proposed standardized disclosures for off-balance-sheet liabilities tied to infrastructure PPPs.",
        "category": "Economy",
        "read_time_minutes": 4,
        "author": "The Curator Economy Desk",
        "sources": ["IMF", "UN"],
        "image_query": "finance ministers meeting conference",
        "image_url": "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "A working group of treasury officials and multilateral lenders released a template to flag sovereign guarantees "
            "buried in power-purchase agreements and toll-road concessions. The goal is to prevent surprise liabilities from "
            "triggering sudden downgrades when projects underperform.\n\n"
            "Creditors want independent engineering audits before disbursement milestones, while borrowers seek caps on penalty "
            "interest during currency shocks. Private funds experimenting with sustainability-linked bonds showed interest if "
            "disclosure rules harmonize across jurisdictions.\n\n"
            "Nothing in the proposal is binding yet, but rating agencies signaled they may treat standardized clawbacks as a "
            "positive factor in frontier-market reviews."
        ),
    },
]


def hydrate_article_payload(payload: dict) -> dict:
    """Attach ``source_links`` and keep legacy ``sources`` for admin readability."""
    data = dict(payload)
    sources = data.get("sources") or []
    data["source_links"] = resolve_source_links(data.get("source_links"), sources)
    return data


EXTRA_ARTICLES = [hydrate_article_payload(item) for item in EXTRA_ARTICLES]
