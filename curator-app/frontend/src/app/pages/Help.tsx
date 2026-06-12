import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Mail, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
  id?: string;
}

const faqs: FAQItem[] = [
  {
    category: 'Getting Started',
    question: 'What is The Curator?',
    answer: 'The Curator is a premium journalism platform that synthesizes news from 10+ global sources into concise, balanced narratives. We distill complex stories into essential insights you need to stay informed.'
  },
  {
    category: 'Getting Started',
    question: 'How do I create an account?',
    answer: 'Click "Get Started" on the welcome page, then fill in your name, email, and password. You\'ll have immediate access to free features, with the option to upgrade for premium content.'
  },
  {
    category: 'Subscription',
    question: 'What are the subscription tiers?',
    answer: 'We offer 3 tiers: Free (10 saves with ads), Basic ($5/month - ad-free, 50 saves), Premium ($15/month - audio, unlimited saves, exclusive content), and Lifetime ($299 one-time - all Premium features forever).'
  },
  {
    id: '4',
    category: 'Subscription',
    question: 'Can I cancel my subscription?',
    answer: 'Yes, you can cancel anytime from Settings. Your access continues until the end of your billing period. Lifetime subscriptions cannot be cancelled as they are one-time purchases.'
  },
  {
    id: '5',
    category: 'Features',
    question: 'What are Audio Briefs?',
    answer: 'Audio Briefs are professionally narrated versions of our daily digests and articles. Available for Premium tier and Lifetime members, perfect for listening during commutes or workouts.'
  },
  {
    id: '6',
    category: 'Features',
    question: 'How many articles can I save?',
    answer: 'Free users get 10 saves, Basic tier gets 50, and Premium/Lifetime tiers get unlimited saves organized in custom collections.'
  },
  {
    category: 'Features',
    question: 'What are source insights?',
    answer: 'Source insights show you which publications contributed to each narrative, helping you understand different perspectives and dig deeper into stories that interest you.'
  },
  {
    category: 'Account',
    question: 'How do I reset my password?',
    answer: 'On the sign-in page, click "Forgot password?" and enter your email. We\'ll send you instructions to reset your password.'
  },
  {
    category: 'Account',
    question: 'Can I change my email address?',
    answer: 'Yes, go to Account settings and update your email. You\'ll receive a confirmation email to verify the change.'
  },
  {
    category: 'Technical',
    question: 'Which devices are supported?',
    answer: 'The Curator works on any modern web browser (Chrome, Safari, Firefox, Edge) on desktop, tablet, and mobile devices. We\'re optimized for both iOS and Android.'
  },
  {
    category: 'Technical',
    question: 'Is my data secure?',
    answer: 'Yes. We use industry-standard encryption, secure servers, and never sell your personal data. Read our Privacy Policy for details.'
  }
];

export function Help() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(faqs.map(faq => faq.category)))];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppShell title="Help & Support">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Search */}
        <div className="mb-8">
          <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-full p-4 flex items-center gap-3">
            <Search className="w-5 h-5 text-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="flex-1 bg-transparent text-on-surface focus:outline-none placeholder:text-outline/50"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                selectedCategory === category
                  ? 'bg-inverse-surface text-white'
                  : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQs */}
        <section className="mb-12">
          <h2 className="font-[family-name:var(--font-headline)] text-3xl italic text-on-surface mb-6">
            Frequently Asked Questions
          </h2>
          
          {filteredFAQs.length === 0 ? (
            <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[40px] p-12 text-center">
              <p className="text-on-surface-variant">No results found. Try a different search term.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFAQs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[30px] overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                    className="w-full p-6 flex items-center justify-between hover:bg-surface-container-low transition-colors"
                  >
                    <div className="text-left">
                      <div className="text-xs uppercase tracking-wider text-outline mb-1">
                        {faq.category}
                      </div>
                      <h3 className="font-medium text-on-surface">
                        {faq.question}
                      </h3>
                    </div>
                    {expandedIndex === index ? (
                      <ChevronUp className="w-5 h-5 text-outline shrink-0 ml-4" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-outline shrink-0 ml-4" />
                    )}
                  </button>
                  
                  {expandedIndex === index && (
                    <div className="px-6 pb-6">
                      <p className="text-on-surface-variant leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Contact Support */}
        <section className="mb-12">
          <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[60px] p-10">
            <h2 className="font-[family-name:var(--font-headline)] text-3xl text-on-surface mb-6">
              Still Need Help?
            </h2>
            <p className="text-on-surface-variant mb-8 leading-relaxed">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="mailto:support@thecurator.com"
                className="bg-surface-container-low rounded-[30px] p-6 flex items-center gap-4 hover:bg-surface-container transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
                  <Mail className="w-6 h-6 text-on-primary-container" />
                </div>
                <div>
                  <div className="font-medium text-on-surface mb-1">Email Support</div>
                  <div className="text-sm text-outline">support@thecurator.com</div>
                </div>
              </a>

              <button
                onClick={() => {/* Open chat widget */}}
                className="bg-surface-container-low rounded-[30px] p-6 flex items-center gap-4 hover:bg-surface-container transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-on-secondary-container" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-on-surface mb-1">Live Chat</div>
                  <div className="text-sm text-outline">Available 9am-5pm EST</div>
                </div>
              </button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}