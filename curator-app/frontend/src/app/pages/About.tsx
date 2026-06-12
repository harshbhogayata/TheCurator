import { Sparkles, Users, Globe, Shield } from 'lucide-react';
import { useNavigate } from 'react-router';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';

export function About() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <AppShell title="About">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Hero Section */}
        <section className="mb-16 text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary-container flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-on-primary-container" fill="currentColor" />
          </div>
          <h2 className="font-[family-name:var(--font-headline)] italic text-5xl md:text-6xl text-on-surface mb-6">
            The World, Distilled.
          </h2>
          <p className="text-on-surface-variant text-xl leading-relaxed max-w-2xl mx-auto">
            We synthesize ten global perspectives into one essential narrative, delivering journalism beyond the noise.
          </p>
        </section>

        {/* Mission */}
        <section className="mb-12">
          <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[60px] p-10">
            <h3 className="font-[family-name:var(--font-headline)] text-3xl text-on-surface mb-6">
              Our Mission
            </h3>
            <p className="text-on-surface-variant text-lg leading-relaxed mb-4">
              In an age of information overload, The Curator offers clarity. We don't just report the news—we distill it. 
              Our proprietary synthesis process weaves together diverse global sources to give you a complete, unbiased picture.
            </p>
            <p className="text-on-surface-variant text-lg leading-relaxed">
              Every narrative you read has been carefully curated from at least ten different perspectives, ensuring you 
              understand not just what happened, but why it matters and how the world is responding.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-12">
          <h3 className="font-[family-name:var(--font-headline)] text-3xl italic text-on-surface mb-8 text-center">
            Our Values
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[40px] p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-container flex items-center justify-center">
                <Globe className="w-8 h-8 text-on-primary-container" />
              </div>
              <h4 className="font-[family-name:var(--font-headline)] text-xl text-on-surface mb-3">
                Global Perspective
              </h4>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                We source from diverse international outlets to give you the full picture, not just one angle.
              </p>
            </div>

            <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[40px] p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary-container flex items-center justify-center">
                <Shield className="w-8 h-8 text-on-secondary-container" />
              </div>
              <h4 className="font-[family-name:var(--font-headline)] text-xl text-on-surface mb-3">
                Independent
              </h4>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Reader-funded and corporate-free. Our only allegiance is to the truth.
              </p>
            </div>

            <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[40px] p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-tertiary-container flex items-center justify-center">
                <Users className="w-8 h-8 text-on-tertiary-container" />
              </div>
              <h4 className="font-[family-name:var(--font-headline)] text-xl text-on-surface mb-3">
                Community Driven
              </h4>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Built for curious minds who value depth, nuance, and thoughtful analysis.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <div className="bg-surface-container-lowest/70 backdrop-blur-xl border border-outline-variant/15 rounded-[60px] p-10">
            <h3 className="font-[family-name:var(--font-headline)] text-3xl text-on-surface mb-6">
              How It Works
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-on-surface mb-2">Source Collection</h4>
                  <p className="text-on-surface-variant">
                    Our AI scans 100+ trusted global news sources daily across multiple languages and perspectives.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-on-surface mb-2">Synthesis</h4>
                  <p className="text-on-surface-variant">
                    Our proprietary algorithm identifies key narratives and synthesizes diverse viewpoints into cohesive stories.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-on-surface mb-2">Editorial Review</h4>
                  <p className="text-on-surface-variant">
                    Our team of experienced journalists reviews and refines each narrative for accuracy and clarity.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-on-surface mb-2">Distillation</h4>
                  <p className="text-on-surface-variant">
                    Final narratives are distilled into digestible formats: articles, audio briefs, and daily digests.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="mb-12 text-center">
          <h3 className="font-[family-name:var(--font-headline)] text-3xl italic text-on-surface mb-4">
            Founded in 2023
          </h3>
          <p className="text-on-surface-variant text-lg leading-relaxed max-w-2xl mx-auto mb-8">
            The Curator was founded by a team of journalists, technologists, and design thinkers who believed 
            the world needed better journalism—not more journalism.
          </p>
          <button
            onClick={() => navigate('/donate')}
            className="bg-inverse-surface text-white py-4 px-10 rounded-full font-semibold tracking-wide hover:bg-primary transition-all shadow-xl active:scale-95"
          >
            Support Our Mission
          </button>
        </section>
      </div>
    </AppShell>
  );
}