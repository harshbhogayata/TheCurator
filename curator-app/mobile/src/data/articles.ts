export interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishedDate: string;
  author: string;
  sources: string[];
  imageQuery: string;
  content?: string;
  audioUrl?: string;
  audioDurationSec?: number;
}

export const articles: Article[] = [
  {
    id: '1',
    title: 'The Quiet Resurgence of Volatility in Emerging Markets',
    excerpt: 'A synthesized analysis of global equity shifts, tracking the interplay between currency devaluation and institutional capital flight across the Pacific Rim...',
    category: 'Economy',
    readTime: '6 min read',
    imageQuery: 'modern architecture shadows geometric',
    sources: ['NY', 'FT', 'WS', 'EC', 'AP', 'RT', 'GD', 'AF', 'TX', '+1'],
    author: 'The Curator Editorial Team',
    publishedDate: 'March 23, 2026',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    audioDurationSec: 372,
    content: `As global markets recalibrate following years of unprecedented monetary expansion, emerging markets face a particularly complex challenge. The interplay between currency devaluation and institutional capital flight has created a feedback loop that demands careful analysis.

Recent data from ten major financial institutions suggests that the traditional safe-haven narrative may be evolving. While developed markets have historically absorbed capital during periods of uncertainty, we're witnessing a more nuanced pattern emerge.

The Pacific Rim economies, particularly those in Southeast Asia, are experiencing what analysts describe as "selective volatility" - where certain sectors demonstrate remarkable resilience while others face significant headwinds.

This phenomenon isn't merely statistical noise. It represents a fundamental shift in how institutional investors assess risk in emerging markets. The traditional metrics of GDP growth and inflation are being supplemented by new considerations: climate resilience, technological infrastructure, and demographic trends.

What makes this moment particularly significant is the convergence of multiple factors: aging populations in developed nations seeking yield, the maturation of emerging market financial systems, and the growing importance of sustainable investment criteria.

The implications extend beyond portfolio allocation. Central banks in emerging economies are navigating unprecedented territory, balancing the need to maintain currency stability with the imperative to foster economic growth. Their success or failure in this endeavor will shape global capital flows for the coming decade.`
  },
  {
    id: '2',
    title: 'Beyond Silicon: The Biological Compute Revolution',
    excerpt: 'Major labs are reporting breakthrough success in organic data storage, suggesting a future where infrastructure grows rather than manufactured...',
    category: 'Technology',
    readTime: '12 min read',
    imageQuery: 'futuristic circuit board technology dark',
    sources: ['TC', 'VG', 'WI', 'BB', 'CN', 'IT', 'NX', 'DT', 'RD', 'AR'],
    author: 'The Curator Science Desk',
    publishedDate: 'March 22, 2026',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    audioDurationSec: 720,
    content: `The computing industry stands at the threshold of its most fundamental transformation since the invention of the transistor. Biological computing—once relegated to the realm of science fiction—is emerging as a viable alternative to silicon-based systems.

Leading research institutions across three continents have independently verified the feasibility of DNA-based data storage at commercial scale. Unlike traditional hard drives, these systems promise density improvements measured not in percentages but in orders of magnitude.

The implications ripple across multiple industries. Data centers, which currently consume approximately 2% of global electricity, could see their energy requirements drop by 90% or more. The environmental calculus of cloud computing would fundamentally change.

But the revolution extends beyond storage. Researchers are developing biological processors that leverage the parallel processing capabilities inherent in cellular systems. Early prototypes suggest computation speeds that could surpass quantum computers for specific applications.

The challenges are substantial. Biological systems require different environmental controls than silicon. They're vulnerable to different failure modes. Standardization across laboratories remains elusive.

Yet the momentum is undeniable. Venture capital flowing into biocomputing startups has increased 400% year-over-year. Major technology firms are establishing dedicated research divisions. University programs are being created to train the next generation of biocomputing engineers.

We may be witnessing the beginning of an era where our computational infrastructure is grown in vats rather than fabricated in clean rooms. The implications for everything from artificial intelligence to climate modeling are profound.`
  },
  {
    id: '3',
    title: 'The New Climate Diplomacy: Carbon Borders and Trade Wars',
    excerpt: 'As carbon border adjustments take effect, developing nations are challenging the framework that determines climate responsibility and economic opportunity...',
    category: 'Climate',
    readTime: '8 min read',
    imageQuery: 'climate environment nature earth',
    sources: ['UN', 'FT', 'EC', 'GD', 'RE', 'PT', 'AL', 'BB', 'WP', '+2'],
    author: 'The Curator International Desk',
    publishedDate: 'March 21, 2026',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    audioDurationSec: 480,
  },
  {
    id: '4',
    title: 'Renaissance of Regional Cuisine: How Food Is Defining Cultural Identity',
    excerpt: 'In an era of globalization, chefs and communities are reclaiming traditional foodways as expressions of cultural sovereignty and environmental stewardship...',
    category: 'Culture',
    readTime: '7 min read',
    imageQuery: 'culture art museum gallery',
    sources: ['GR', 'SA', 'FT', 'NY', 'LA', 'BO', 'CH', 'SE', 'MI', 'TO'],
    author: 'The Curator Culture Desk',
    publishedDate: 'March 20, 2026',
  },
  {
    id: '5',
    title: 'The Longevity Equation: New Research Challenges Aging Assumptions',
    excerpt: 'Longitudinal studies across five continents suggest that our understanding of healthy aging may need fundamental revision...',
    category: 'Health',
    readTime: '9 min read',
    imageQuery: 'health wellness medicine medical',
    sources: ['LN', 'NM', 'SC', 'JA', 'BM', 'CE', 'ST', 'HV', 'JH', '+1'],
    author: 'The Curator Health Desk',
    publishedDate: 'March 19, 2026',
  },
  {
    id: '6',
    title: 'Decentralized Governance: Digital Democracy Experiments Yield Surprising Results',
    excerpt: 'Early adopters of blockchain-based voting systems report higher engagement, but questions about equity and access remain...',
    category: 'Politics',
    readTime: '10 min read',
    imageQuery: 'politics government capitol building',
    sources: ['PT', 'EC', 'WI', 'FP', 'AT', 'GD', 'RE', 'BB', 'PR', 'VX'],
    author: 'The Curator Politics Desk',
    publishedDate: 'March 18, 2026',
  },
  {
    id: '7',
    title: 'Space Mining: The New Resource Frontier',
    excerpt: 'Private companies are positioning for asteroid mining operations, raising questions about space law, environmental ethics, and economic disruption...',
    category: 'Science',
    readTime: '11 min read',
    imageQuery: 'science research laboratory discovery',
    sources: ['NS', 'ST', 'SP', 'WI', 'FT', 'EC', 'RE', 'BB', 'AR', '+3'],
    author: 'The Curator Science Desk',
    publishedDate: 'March 17, 2026',
  },
  {
    id: '8',
    title: 'The Return of Community Banking',
    excerpt: 'As fintech consolidation continues, a counter-movement emphasizes local lending, relationship banking, and community investment...',
    category: 'Economy',
    readTime: '6 min read',
    imageQuery: 'modern architecture shadows geometric',
    sources: ['FT', 'WS', 'EC', 'BB', 'RE', 'AM', 'FB', 'CR', 'LO', 'TR'],
    author: 'The Curator Economics Desk',
    publishedDate: 'March 16, 2026',
  },
];

export const categories = [
  'All',
  'Economy',
  'Technology',
  'Climate',
  'Culture',
  'Health',
  'Politics',
  'Science',
];
