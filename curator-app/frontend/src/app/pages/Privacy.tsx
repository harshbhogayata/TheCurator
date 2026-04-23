import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';

export function Privacy() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface-container-low pb-32">
      {/* Header with Separate Pill Containers */}
      <header className="fixed top-0 w-full z-50 pt-6 px-6">
        <div className="flex items-center gap-3">
          {/* Left: Back Button (Circle Pill) */}
          <div className="rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] p-0.5">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full hover:bg-surface-container/40 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-on-surface" />
            </button>
          </div>
          
          {/* Center: Title (Long Pill) */}
          <div className="flex-1 rounded-full border-2 border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_4px_16px_rgba(0,0,0,0.12)] px-6 py-2.5">
            <h1 className="text-2xl font-[family-name:var(--font-headline)] italic tracking-tight text-on-surface text-center">
              Privacy Policy
            </h1>
          </div>
        </div>
      </header>

      <main className="pt-32 px-6 max-w-3xl mx-auto">
        <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[60px] p-10 md:p-12">
          <p className="text-outline text-sm mb-8">Last Updated: March 2026</p>

          <section className="mb-10">
            <h2 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface mb-4">
              Introduction
            </h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              At The Curator, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
              and protect your personal information when you use our service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface mb-4">
              Information We Collect
            </h2>
            <div className="space-y-4 text-on-surface-variant leading-relaxed">
              <div>
                <h3 className="font-semibold text-on-surface mb-2">Account Information</h3>
                <p>When you create an account, we collect your name, email address, and password (encrypted).</p>
              </div>
              <div>
                <h3 className="font-semibold text-on-surface mb-2">Usage Data</h3>
                <p>We collect information about how you interact with The Curator, including articles read, time spent, and features used.</p>
              </div>
              <div>
                <h3 className="font-semibold text-on-surface mb-2">Payment Information</h3>
                <p>If you subscribe, we collect payment information through our secure payment processor. We never store your full credit card details.</p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface mb-4">
              How We Use Your Information
            </h2>
            <ul className="list-disc list-inside space-y-2 text-on-surface-variant leading-relaxed">
              <li>To provide and improve our services</li>
              <li>To personalize your reading experience</li>
              <li>To process payments and manage subscriptions</li>
              <li>To send you updates about The Curator (you can opt out anytime)</li>
              <li>To analyze usage patterns and improve our platform</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface mb-4">
              Data Sharing
            </h2>
            <p className="text-on-surface-variant leading-relaxed">
              We do not sell your personal information. We may share data with:
            </p>
            <ul className="list-disc list-inside space-y-2 text-on-surface-variant leading-relaxed mt-4">
              <li>Service providers who help us operate The Curator (e.g., payment processors, email services)</li>
              <li>Legal authorities when required by law</li>
              <li>Aggregated, anonymized data for research and analytics</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface mb-4">
              Your Rights
            </h2>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-on-surface-variant leading-relaxed">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of marketing communications</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface mb-4">
              Security
            </h2>
            <p className="text-on-surface-variant leading-relaxed">
              We use industry-standard security measures to protect your data, including encryption, secure servers, 
              and regular security audits. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface mb-4">
              Cookies
            </h2>
            <p className="text-on-surface-variant leading-relaxed">
              We use cookies and similar technologies to improve your experience, analyze usage, and remember your preferences. 
              You can control cookie settings in your browser.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-headline)] text-2xl text-on-surface mb-4">
              Contact Us
            </h2>
            <p className="text-on-surface-variant leading-relaxed">
              If you have questions about this Privacy Policy or your data, please contact us at{' '}
              <a href="mailto:privacy@thecurator.com" className="text-primary hover:underline">
                privacy@thecurator.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {isAuthenticated && <BottomNav />}
    </div>
  );
}