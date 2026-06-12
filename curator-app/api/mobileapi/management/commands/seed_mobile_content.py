from datetime import date
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from mobileapi.category_catalog import CONTENT_CATEGORY_CATALOG
from mobileapi.models import Article, Brief, Category

# Article copy uses editorial labels that are not 1:1 with the curated catalog
# slugs. Map those labels onto an existing catalog category.
CATEGORY_ALIASES = {
    "geopolitics": "politics",
    "world": "politics",
    "business": "economy",
    "markets": "economy",
    "finance": "economy",
    "tech": "technology",
    "environment": "climate",
    "arts": "culture",
}

ARTICLES = [
    {
        "title": "Middle Eastern Geopolitics: The Fragile United States-Iran Ceasefire and the Strait of Hormuz",
        "excerpt": "Diplomatic efforts to end the escalating 2026 conflict between the United States and the Islamic Republic of Iran have reached a highly critical juncture, with international negotiators moving closer to securing a 60-day ceasefire extension.",
        "category": "Geopolitics",
        "read_time_minutes": 3,
        "published_at": date(2026, 5, 24),
        "author": "The Curator Geopolitics Desk",
        "sources": ["AP", "WH", "FARS", "RE"],
        "image_query": "Strait of Hormuz negotiations",
        "image_url": "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "Diplomatic efforts to end the escalating 2026 conflict between the United States and the Islamic Republic of "
            "Iran have reached a highly critical juncture, with international negotiators moving closer to securing a "
            "60-day ceasefire extension. Following complex, behind-the-scenes mediation led predominantly by Pakistan, the "
            "proposed diplomatic framework centers heavily on the phased reopening of the Strait of Hormuz—a vital, "
            "strategically crucial maritime chokepoint responsible for a significant share of global oil transit. Statements "
            "emanating from the White House indicate a high degree of optimism; United States President Donald Trump "
            "announced on social media that an agreement has been \"largely negotiated,\" following extensive consultations "
            "with regional allies across the Gulf, including Saudi Arabia, the United Arab Emirates, Qatar, and Bahrain, "
            "as well as separate discussions with Israeli Prime Minister Benjamin Netanyahu.\n\n"
            "Despite these optimistic projections from Washington, deep structural disagreements remain unresolved, "
            "threatening to unravel the fragile Memorandum of Understanding before it can be formally ratified. The "
            "dissonance between domestic messaging in the United States and Iran highlights the immense fragility of the "
            "truce. Specifically, Iranian state media apparatuses, including the Fars news agency—which maintains close "
            "ties to the Islamic Revolutionary Guard Corps (IRGC)—have publicly contradicted the American narrative. "
            "Iranian outlets assert that the management of the Strait, including the determination of transit routes and the "
            "issuance of maritime permits, will remain under the exclusive and monopolistic jurisdiction of the Islamic "
            "Republic. This assertion represents a strict red line for American negotiators, who have demanded the "
            "reopening of the waterway without tolls or Iranian blockades. The strategic calculus is further complicated "
            "by recent kinetic flare-ups, including instances where United States forces fired upon and disabled "
            "Iranian-flagged tankers attempting to violate the blockade of Iranian ports.\n\n"
            "If the fragile 60-day truce manages to hold, the mediation window is expected to pivot toward highly "
            "contentious negotiations regarding Iran’s broader nuclear program and its stockpiles of highly enriched "
            "uranium. Pakistan's emergence as the primary mediator—with Deputy Prime Minister Ishaq Dar emphasizing a focus "
            "on making the ceasefire permanent and Prime Minister Shehbaz Sharif offering to host subsequent rounds of "
            "talks—underscores a shifting geopolitical landscape where traditional Western diplomatic channels are increasingly "
            "bypassed in favor of regional arbiters. Ultimately, both administrations are attempting to manage complex "
            "domestic political optics while striving to stabilize highly volatile global energy markets that have been "
            "deeply rattled by the closure of the Strait."
        ),
        "audio_url": "",
        "audio_duration_sec": 372,
    },
    {
        "title": "Global Health Security: The Central African Ebola Crisis and the Collapse of Foreign Aid",
        "excerpt": "A highly lethal and rapidly expanding outbreak of the Ebola virus has escalated across Central Africa, prompting the World Health Organization (WHO) to declare a public health emergency of international concern.",
        "category": "Health",
        "read_time_minutes": 3,
        "published_at": date(2026, 5, 24),
        "author": "The Curator Science Desk",
        "sources": ["WHO", "CDC", "USAID", "RE"],
        "image_query": "Ebola Outbreak Central Africa",
        "image_url": "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "A highly lethal and rapidly expanding outbreak of the Ebola virus has escalated across Central Africa, "
            "prompting the World Health Organization (WHO) to officially declare a public health emergency of "
            "international concern (PHEIC) on May 17, 2026. Centered predominantly in the conflict-ridden Ituri province "
            "of the Democratic Republic of the Congo (DRC), the outbreak has already recorded 82 confirmed cases and 7 "
            "confirmed deaths, alongside a deeply alarming figure of nearly 750 suspected cases and 177 suspected deaths as "
            "of late May. The pathogen responsible for this crisis is the rare Bundibugyo strain of the virus. Unlike the "
            "more common Zaire strain, there are currently no approved vaccines or specific therapeutic treatments available "
            "for the Bundibugyo variant, rendering standard pharmaceutical interventions like the Ervebo vaccine entirely "
            "ineffective.\n\n"
            "The epidemiological situation is rapidly deteriorating as the virus crosses international borders. Health "
            "authorities have confirmed two cases in Uganda's densely populated capital, Kampala, involving individuals "
            "who had recently traveled from the DRC. Furthermore, the virus has impacted international personnel, with "
            "an American national working in the DRC testing positive and subsequently being transferred to Germany for "
            "highly specialized care, while a second high-risk contact was evacuated to the Czech Republic. In response to "
            "the escalating threat, the United States Centers for Disease Control and Prevention (CDC) and the Department of "
            "Homeland Security implemented targeted public health measures, including enhanced travel screening and entry "
            "restrictions for individuals arriving from affected regions in East and Central Africa.\n\n"
            "The global response to this outbreak has been severely hampered by a catastrophic convergence of regional military "
            "conflict and the structural collapse of international aid networks. Eastern Congo remains highly unstable, "
            "with large swathes of territory controlled by the Rwandan-backed Congolese insurgent group M23, making the "
            "establishment of healthcare facilities and the distribution of personal protective equipment virtually impossible. "
            "This crisis was exacerbated by the 2025 withdrawal of the United States Agency for International Development "
            "(USAID), which decimated local networks of community health workers and depleted regional supply stockpiles. "
            "Consequently, the virus circulated undetected for several weeks before being formally identified. Furthermore, "
            "deep public mistrust fueled by controversial \"security-for-minerals\" deals has resulted in a hostile "
            "environment for medical responders attempting contact tracing and safe burial education. This outbreak "
            "exemplifies how geopolitical isolationism and local military conflicts directly catalyze and accelerate "
            "global biological threats."
        ),
        "audio_url": "",
        "audio_duration_sec": 420,
    },
    {
        "title": "Aerospace Engineering and Commercial Monopolies: SpaceX Starship V3 Megarocket Launch",
        "excerpt": "The commercial aerospace sector witnessed a monumental technological leap in late May 2026 as SpaceX successfully executed the inaugural test flight of its Starship Version 3 (V3) megarocket.",
        "category": "Science",
        "read_time_minutes": 3,
        "published_at": date(2026, 5, 24),
        "author": "The Curator Aerospace Desk",
        "sources": ["NASA", "SPX", "SC"],
        "image_query": "SpaceX Starship rocket launch",
        "image_url": "https://cdn.mos.cms.futurecdn.net/ho2v8oSxixqxARQebsz7HP.jpg",
        "content": (
            "The commercial aerospace sector witnessed a monumental technological leap in late May 2026 as SpaceX "
            "successfully executed the inaugural test flight of its Starship Version 3 (V3) megarocket from a newly completed "
            "second launch pad at its Starbase facility in South Texas. Standing an unprecedented 408 feet (124 meters) tall, "
            "the completely redesigned launch vehicle completed its 12th suborbital test flight, marking a critical evolutionary "
            "step toward operational interplanetary missions and the eventual colonization of the lunar surface under NASA's "
            "Artemis program.\n\n"
            "The V3 architecture features a radical engineering overhaul, most notably the implementation of a novel \"hot "
            "staging\" mechanism. Unlike the previous V2 iteration, which utilized a breakaway interstage ring that fell "
            "away upon stage separation, the Starship V3 is designed with integrated hardware secured directly to the top "
            "of the 33-engine Super Heavy booster. This structural modification, which resembles a heavily reinforced fence "
            "around the fuel tank's dome, provides the six main engines of the upper stage (Ship 39) with vital breathing "
            "room for ignition and initial thrust during the violent separation process.\n\n"
            "While the launch successfully achieved spaceflight and demonstrated complex in-orbit payload deployment—releasing "
            "20 dummy Starlink satellites alongside two specialized imaging satellites via a \"PEZ dispenser\" "
            "mechanism—the mission was not without significant anomalies. During the initial liftoff sequence, one of "
            "the booster's 33 Raptor engines shut down prematurely, and the upper stage subsequently lost one of its six "
            "engines during ascent, though it still managed to reach its targeted suborbital trajectory. Following stage "
            "separation, the Super Heavy booster's planned one-minute boostback descent burn malfunctioned, resulting in "
            "an early flight termination and a crash in the Gulf of Mexico rather than a precise, controlled splashdown. "
            "The upper stage, however, successfully executed a complex flipping maneuver and reignited its engines for a "
            "controlled, albeit fiery, splashdown in the Indian Ocean.\n\n"
            "SpaceX’s tolerance for high-profile, catastrophic anomalies remains its primary evolutionary advantage over "
            "legacy aerospace competitors. By intentionally pushing the V3 hardware to its physical failure points in active "
            "test flights rather than relying solely on simulated terrestrial environments, the company dramatically "
            "accelerates its iterative design cycle. The successful deployment of dummy payloads proves that Starship's "
            "commercial utility is rapidly maturing, threatening to entirely monopolize the global heavy-lift orbital market "
            "in the coming decade."
        ),
        "audio_url": "",
        "audio_duration_sec": 380,
    },
    {
        "title": "Artificial Intelligence and Foundational Mathematics: The Autonomous Disproof of the Erdős Conjecture",
        "excerpt": "In a watershed moment for machine intelligence, an OpenAI reasoning model has autonomously resolved a central, 80-year-old mathematical mystery: the planar unit distance problem.",
        "category": "Technology",
        "read_time_minutes": 3,
        "published_at": date(2026, 5, 24),
        "author": "The Curator AI Desk",
        "sources": ["OAI", "PR", "GD"],
        "image_query": "AI solves Erdos math problem",
        "image_url": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "In a watershed moment for machine intelligence, an internal, general-purpose reasoning AI developed by OpenAI "
            "has autonomously resolved a central, 80-year-old mathematical mystery: the planar unit distance problem. "
            "Formulated by the legendary Hungarian mathematician Paul Erdős in 1946, the problem presents a deceptively simple "
            "premise: if one places a set of dots on a flat, two-dimensional plane, what is the maximum number of pairs of those "
            "dots that can be exactly one unit of distance apart? For nearly eight decades, the prevailing mathematical "
            "consensus, supporting Erdős's original conjecture, held that the maximum number of pairs would rise only "
            "slightly faster than the total number of points, bounded roughly by variations of a square grid formation.\n\n"
            "The OpenAI model entirely disproved this long-held belief by utilizing highly advanced concepts from algebraic "
            "number theory to construct an infinite new family of geometric arrangements. Moving beyond the Gaussian integers "
            "utilized in Erdős's original lower bound proofs, the AI employed complex generalizations from algebraic number fields, "
            "utilizing profound mathematical tools including infinite class field towers and Golod-Shafarevich theory to generate "
            "configurations that yielded a polynomial improvement. Following the AI's autonomous deduction, human refinement "
            "by Princeton mathematics professor Will Sawin established the precise mathematical exponent.\n\n"
            "This achievement, heavily validated by independent experts including Fields Medalist Tim Gowers and mathematician "
            "Thomas Bloom, represents the very first instance of an artificial intelligence autonomously solving a prominent, "
            "foundational open problem in discrete geometry without being exclusively trained or narrowly scaffolded for "
            "mathematical operations. This breakthrough signals a monumental paradigm shift in machine intelligence, moving away "
            "from simple statistical mimicry toward genuine deductive reasoning. The AI did not merely interpolate existing "
            "literature; it formulated novel logical pathways that human mathematicians had previously dismissed as computationally "
            "unviable or unintuitive. This capacity to synthesize disparate academic fields—seamlessly applying algebraic "
            "number theory to solve a geometric puzzle—indicates that artificial intelligence will soon become a primary "
            "driver of foundational scientific discovery across physics, biology, and materials science."
        ),
        "audio_url": "",
        "audio_duration_sec": 410,
    },
    {
        "title": "International Relations and Industrial Policy: The United States-Sweden Technology Prosperity Deal",
        "excerpt": "In a strategic geopolitical alignment, the United States and Sweden have ratified a Technology Prosperity Deal to secure high-tech supply chains and deep research collaboration.",
        "category": "Politics",
        "read_time_minutes": 3,
        "published_at": date(2026, 5, 24),
        "author": "The Curator Politics Desk",
        "sources": ["WH", "GOV", "RE"],
        "image_query": "US Sweden Technology Prosperity Deal signing",
        "image_url": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "In a strategic geopolitical alignment reflecting the modern emphasis on technological sovereignty and secure "
            "supply chains, the United States and Sweden have officially ratified the comprehensive \"Technology Prosperity "
            "Deal.\" Signed in the southern Swedish port of Helsingborg by United States Secretary of State Marco Rubio and "
            "Swedish Foreign Minister Maria Malmer Stenergard, the bilateral memorandum establishes profound, long-term cooperation "
            "across a multitude of next-generation industries. This political declaration of intent marks only the fourth agreement "
            "of its kind negotiated by the United States globally, following similar frameworks established with the United "
            "Kingdom, Japan, and South Korea.\n\n"
            "The comprehensive agreement outlines joint initiatives heavily focused on accelerating the development of 6G "
            "telecommunications architecture, artificial intelligence process optimization, and advanced manufacturing "
            "capabilities, with a specific focus on rare-earth-free materials and high-performance alloys critical for "
            "semiconductor supply chains. In the realm of renewable infrastructure, the pact deeply strengthens civil nuclear "
            "energy cooperation, facilitating commercial partnerships designed to accelerate the deployment of small modular "
            "reactors (SMRs) and advanced fusion technologies. Furthermore, the deal extends into the aerospace sector, "
            "formalizing Swedish commercial integration into the United States-led Artemis lunar exploration program and "
            "facilitating broader commercial space cooperation by addressing regulatory burdens.\n\n"
            "This bilateral agreement is highly indicative of a broader macroeconomic trend known as \"friendshoring.\" As "
            "global supply chains become increasingly weaponized by non-market economies, Western democracies are actively "
            "securing their critical infrastructure by establishing exclusive technological corridors. By partnering deeply with "
            "Sweden—a historical powerhouse in telecommunications infrastructure via conglomerates like Ericsson—the United "
            "States aims to fortify its future 5G and 6G networks against adversarial infiltration, effectively merging national "
            "defense alliances with aggressive industrial policy."
        ),
        "audio_url": "",
        "audio_duration_sec": None,
    },
    {
        "title": "Global Public Health Policy: The 2026-2036 GAP-AMR Resolution",
        "excerpt": "During the Seventy-ninth World Health Assembly (WHA79) in Geneva, member states approved the updated Global Action Plan on Antimicrobial Resistance (GAP-AMR) for the 2026–2036 decade.",
        "category": "Health",
        "read_time_minutes": 3,
        "published_at": date(2026, 5, 24),
        "author": "The Curator Health Desk",
        "sources": ["WHO", "GLASS", "RE"],
        "image_query": "microscope antimicrobial resistance lab",
        "image_url": "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "During the Seventy-ninth World Health Assembly (WHA79) held in Geneva, member states unanimously approved the "
            "updated Global Action Plan on Antimicrobial Resistance (GAP-AMR) for the 2026–2036 decade, addressing one of the "
            "most severe, slow-moving catastrophes of the modern medical era: the rapidly decreasing efficacy of foundational "
            "antibiotics. Current epidemiological surveillance data provided by the WHO's Global Antimicrobial Resistance and "
            "Use Surveillance System (GLASS) indicates an alarming reality: one in six common bacterial infections in 2023 "
            "were completely resistant to standard antibiotic treatments. This escalating crisis contributed directly to an "
            "estimated 4.71 million deaths globally in 2021.\n\n"
            "The updated GAP-AMR framework is incredibly ambitious, focusing on preserving the ability to treat human, animal, "
            "and plant infections by expanding equitable access to vital antimicrobials while simultaneously curtailing "
            "inappropriate and excessive usage through a holistic \"One Health\" approach. The macroeconomic stakes associated "
            "with this resolution are monumental. Without immediate, robust, and highly coordinated international intervention, "
            "antimicrobial resistance is projected to cause up to 39 million deaths annually by 2050, disproportionately "
            "ravaging low- and middle-income countries. Furthermore, the economic damage is forecasted to be devastating, with "
            "global treatment costs reaching $412 billion and productivity losses exceeding $443 billion by 2035.\n\n"
            "The successful execution of the GAP-AMR will require a highly delicate regulatory balancing act. While the plan "
            "aims to severely restrict the unregulated, over-the-counter dispensing of critical antimicrobials, pharmaceutical "
            "industry groups, including the Global Self-Care Federation, have publicly warned against inadvertently "
            "criminalizing the lawful, evidence-based use of non-prescription medicines. The ultimate success of this global "
            "initiative will hinge less on high-level diplomatic resolutions and significantly more on local infrastructural "
            "capabilities—specifically, the ability of nations to empower community pharmacists, integrate context-sensitive "
            "AMR education into university curricula, and enforce strict pharmaceutical regulatory capacities in developing "
            "regions plagued by substandard and falsified medicines."
        ),
        "audio_url": "",
        "audio_duration_sec": None,
    },
    {
        "title": "Cinema and Technology: 'The Brutalist' and the Cannes Artificial Intelligence Controversy",
        "excerpt": "The integration of generative AI into the traditional cinematic arts has sparked intense debate following the revelation that Brady Corbet’s film heavily utilized AI voice modification software.",
        "category": "Culture",
        "read_time_minutes": 3,
        "published_at": date(2026, 5, 24),
        "author": "The Curator Culture Desk",
        "sources": ["AMP", "GD", "RE"],
        "image_query": "Cannes film festival theater",
        "image_url": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "The rapid integration of generative artificial intelligence into the traditional cinematic arts has sparked "
            "intense, industry-wide debate following the revelation that Brady Corbet’s highly acclaimed film, The Brutalist, "
            "heavily utilized AI voice modification software. The film’s editorial team, led by Dávid Jancsó, employed "
            "Respeecher—a highly advanced Ukrainian AI technology—to meticulously refine the Hungarian pronunciation and dialect "
            "of the film's lead actors, Adrien Brody and Felicity Jones. The controversy erupted violently across industry "
            "circles shortly after Brody secured a prestigious Oscar for his performance, triggering an immediate and polarizing "
            "backlash regarding the fundamental authenticity of modern acting.\n\n"
            "In response to the growing public relations crisis, director Brady Corbet vigorously defended the technological "
            "process, framing it as a highly manual, post-production tool utilized strictly for phonetic and historical "
            "accuracy. Corbet insisted that the AI was deployed solely to refine certain vowels and consonants in the "
            "Hungarian dialogue, ensuring that absolutely no English-language dialogue or fundamental emotional performances "
            "were altered by the algorithms. Consequently, the American Academy of Motion Picture Arts and Sciences is "
            "currently grappling with profound existential and regulatory questions regarding how to accurately define and "
            "enforce its newly drafted rule that acting must be \"demonstrably performed by humans.\"\n\n"
            "This controversy exposes deep institutional fault lines within the global creative industries. As artificial "
            "intelligence tools transition rapidly from highly visible visual special effects to entirely invisible biological "
            "augmentations—such as micro-accent correction or vocal range extension, as seen in the 2024 film Emilia Pérez—"
            "regulatory bodies are struggling to delineate the boundary between raw human performance and sophisticated "
            "post-production engineering. The immense friction surrounding The Brutalist heavily suggests that future artistic "
            "merit and award eligibility will increasingly be judged not merely on the emotional resonance of the final output, "
            "but on the perceived biological purity and technological abstemiousness of its creation."
        ),
        "audio_url": "",
        "audio_duration_sec": None,
    },
    {
        "title": "Agricultural Biotechnology: CRISPR Innovations and Global Food Security",
        "excerpt": " CRISPR gene-editing technologies are advancing rapidly in response to climate volatility, successfully domesticating superfoods and proof-of-concept staples.",
        "category": "Science",
        "read_time_minutes": 2,
        "published_at": date(2026, 5, 24),
        "author": "The Curator Science Desk",
        "sources": ["BT", "SC", "AP"],
        "image_query": "CRISPR agriculture biology laboratory",
        "image_url": "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "In direct response to the escalating volatility of the global climate, the field of agricultural "
            "biotechnology is advancing at an unprecedented pace, aggressively leveraging CRISPR gene-editing technologies "
            "to engineer highly resilient food crops. A landmark 2026 biological study has successfully utilized CRISPR "
            "to rapidly domesticate the goldenberry (Physalis peruviana)—a highly nutritious, superfood relative of the "
            "tomato native to South America. By intentionally mutating specific ERECTA genes responsible for unruly stem "
            "elongation, genetic scientists completely transformed the wild plant into a compact, manageable architecture "
            "perfectly suited for large-scale commercial farming, bypassing decades of traditional, long-winded selective "
            "breeding processes.\n\n"
            "Concurrently, major global staple crops, including critical yields of soybeans, potatoes, and cotton, have "
            "achieved vital proof-of-concept milestones within the laboratory. Researchers have successfully programmed "
            "highly desirable traits such as severe drought tolerance, enhanced seed oil composition, and robust herbicide "
            "resistance through precise, targeted genomic alterations that operate entirely without requiring controversial "
            "transgene integration. By fundamentally decoupling crop improvement from the slow, unpredictable cycles of natural "
            "selective breeding, these genetic advancements represent a critically necessary mechanism for ensuring global food "
            "security amidst severe environmental stress, shifting pest dynamics, and declining yield gains from older Green "
            "Revolution technologies.\n\n"
            "The strategic macroeconomic importance of CRISPR in agriculture lies entirely in its unparalleled speed and precision. "
            "As global temperatures rise steadily and arable land diminishes due to desertification, the ability to rapidly "
            "program drought-resistance into existing staple crops provides an essential buffer against widespread famine. "
            "However, the ultimate commercial viability and deployment of these breakthroughs will not be determined within "
            "the confines of the laboratory, but rather in the complex regulatory sphere, as nations struggle to navigate "
            "the intricate geopolitical and ethical frameworks surrounding genetically engineered foods and consumer acceptance."
        ),
        "audio_url": "",
        "audio_duration_sec": None,
    },
    {
        "title": "Renewable Energy Infrastructure: The Commercialization of Alternative Battery Technologies",
        "excerpt": "The urgent transition to green energy has catalyzed major advancements in alternative battery storage (sodium-ion, polymer solid-state) to satisfy massive data center demands.",
        "category": "Economy",
        "read_time_minutes": 3,
        "published_at": date(2026, 5, 24),
        "author": "The Curator Economics Desk",
        "sources": ["CATL", "BYD", "RE"],
        "image_query": "industrial battery warehouse clean",
        "image_url": "https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "The urgent global transition toward green energy infrastructure has catalyzed unprecedented economic growth "
            "in alternative battery technologies, with the commercial and industrial energy storage market projected to surge "
            "massively from $13.58 billion in 2025 to over $55 billion by the year 2035. Driven by the voracious, highly "
            "volatile power demands of newly constructed artificial intelligence data centers, the rapid rollout of 6G "
            "telecommunications infrastructure, and the massive expansion of electric vehicle charging networks, industries "
            "are aggressively moving beyond the well-documented constraints and supply-chain vulnerabilities of traditional "
            "lithium-ion systems.\n\n"
            "Next-generation energy storage solutions—specifically including advanced sodium-ion cells, massive vanadium "
            "redox flow batteries, and early commercial deployments of polymer electrolyte solid-state systems—are now "
            "officially entering mainstream, grid-scale deployment. While highly refined lithium-ion architectures remain the "
            "dominant market force, industry analysts project that alternative chemical compositions, particularly solid-state "
            "batteries championed by global leaders like CATL and BYD, will secure up to 10% of the massive global electric "
            "vehicle and battery storage demand within the next decade. These alternative systems offer vastly superior safety "
            "profiles, significantly higher energy densities, and unique capabilities for long-duration industrial load "
            "buffering and emergency grid stabilization.\n\n"
            "The rapid pivot toward alternative battery technologies represents both a remarkable engineering triumph and a "
            "highly calculated geopolitical strategy. By aggressively commercializing sodium-ion and iron-air systems, nations "
            "and multi-national corporations are intentionally diversifying their critical supply chains away from the highly "
            "concentrated, politically sensitive geopolitical bottlenecks associated with lithium and cobalt mining. "
            "Furthermore, the highly specific electrical demands of modern AI data centers—which require massive, instantaneous "
            "power load buffering and deep interconnection enablement—are forcing the accelerated maturation and deployment "
            "of these advanced energy storage systems across the globe."
        ),
        "audio_url": "",
        "audio_duration_sec": None,
    },
    {
        "title": "Digital Publishing and Information Dilution: The Era of Algorithmic 'Slop'",
        "excerpt": "The proliferation of automated AI-generated e-books is saturating retail platforms, drastically raising the value of high-quality human editorial curation.",
        "category": "Technology",
        "read_time_minutes": 3,
        "published_at": date(2026, 5, 24),
        "author": "The Curator Media Desk",
        "sources": ["NBER", "WP", "GD"],
        "image_query": "library archive records books clean",
        "image_url": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80",
        "content": (
            "The unchecked integration of generative artificial intelligence into commercial writing has fundamentally "
            "and perhaps irrevocably disrupted the traditional publishing industry. A highly comprehensive study released by the "
            "National Bureau of Economic Research (NBER) reveals a staggering statistical reality: the number of English-language "
            "e-books published weekly on major retail platforms like Amazon has nearly tripled since the widespread consumer "
            "debut of sophisticated AI text generators in late 2022. As of the end of 2025, more than half of all new digital "
            "book releases feature entirely or partially AI-generated text, leading to a massive, uncontrollable proliferation "
            "of low-effort, low-quality content that critics have dubbed algorithmic \"slop.\"\n\n"
            "Economists studying this phenomenon note that unlike the advent of the internet—which genuinely democratized the "
            "publishing industry by providing talented human authors with a platform to reach global audiences—this current "
            "wave of automated output acts primarily as a mechanism of severe cultural dilution. It radically shifts the immense "
            "burden of filtering through millions of pages of text directly onto the consumer, drastically eroding the historical "
            "assumption that the effort required to produce a manuscript inherently signals its literary or informational value. "
            "Consequently, market data indicates that AI-generated titles are suffering from significantly lower reader "
            "engagement, poorer sales metrics, and lower user ratings compared to their human-authored counterparts.\n\n"
            "This profound dilution of the digital written word perfectly validates the essential premise of premium, "
            "human-directed curated journalism. In an economic environment where the marginal cost of generating vast quantities "
            "of text drops to zero, the sheer volume of available text essentially becomes infinite, and the value of "
            "unverified, machine-produced information collapses entirely. In a digital ecosystem heavily polluted by algorithmic "
            "output, the true premium commodity is no longer the raw content itself, but rather the highly selective editorial "
            "curation, rigorous fact-verification, and intelligent human synthesis of that content."
        ),
        "audio_url": "",
        "audio_duration_sec": None,
    },
]

BRIEFS = [
    {
        "title": "Middle Eastern Geopolitics & Central African Ebola Briefing",
        "summary": "Diplomatic efforts escalate to secure a U.S.-Iran ceasefire in the Strait of Hormuz, while the WHO declares a public health emergency over a new Ebola outbreak in the DRC.",
        "duration_minutes": 6,
        "published_at": date(2026, 5, 24),
        "category": "Daily Brief",
        "image_url": "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80",
        "audio_url": "",
        "insights": 4,
    },
    {
        "title": "SpaceX Starship Launch & OpenAI Breakthrough Analysis",
        "summary": "Analyzing the key structural upgrades of SpaceX's Starship V3 megarocket launch and the profound geometric deductions of OpenAI's reasoning mathematical AI.",
        "duration_minutes": 6,
        "published_at": date(2026, 5, 24),
        "category": "Science & Tech",
        "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
        "audio_url": "",
        "insights": 6,
    },
]


class Command(BaseCommand):
    help = "Seed mobile editorial articles and briefs for local/staging QA."

    @transaction.atomic
    def handle(self, *args, **options):
        for category in CONTENT_CATEGORY_CATALOG:
            Category.objects.update_or_create(
                slug=category["slug"],
                defaults={
                    "name": category["name"],
                    "color": category["color"],
                    "icon": category["icon"],
                    "rank": category["rank"],
                    "is_active": True,
                },
            )

        categories_by_slug = {category.slug: category for category in Category.objects.all()}
        default_category = categories_by_slug[CONTENT_CATEGORY_CATALOG[0]["slug"]]

        def resolve_category(raw_value):
            slug = slugify(raw_value or "")
            slug = CATEGORY_ALIASES.get(slug, slug)
            return categories_by_slug.get(slug, default_category)

        article_count = 0
        brief_count = 0

        for rank, payload in enumerate(ARTICLES):
            defaults = dict(payload)
            defaults["category"] = resolve_category(payload["category"])
            defaults["rank"] = rank
            defaults["is_active"] = True
            _, created = Article.objects.update_or_create(
                title=payload["title"],
                defaults=defaults,
            )
            article_count += 1
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created article: {payload['title']}"))

        for rank, payload in enumerate(BRIEFS):
            defaults = dict(payload)
            defaults["rank"] = rank
            defaults["is_active"] = True
            _, created = Brief.objects.update_or_create(
                title=payload["title"],
                defaults=defaults,
            )
            brief_count += 1
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created brief: {payload['title']}"))

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed complete. Upserted {article_count} articles and {brief_count} briefs."
            )
        )
