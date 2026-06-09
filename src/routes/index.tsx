import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Play, Sparkles, Zap, Type, Layers, Brush, AudioLines } from "lucide-react";
import { HeroCanvas } from "@/components/landing/HeroCanvas";
import { animateDropHeadlines, ensureGsap } from "@/lib/animations";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SOTA Flovo — Turn your startup into a motion brand" },
      { name: "description", content: "The first motion studio engine for founders. Automate high-performance brand assets that scale with your growth." },
      { property: "og:title", content: "SOTA Flovo — Turn your startup into a motion brand" },
      { property: "og:description", content: "Automate kinetic brand assets for your startup." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const heroCardRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    ensureGsap();
    // Word drop on hero
    gsap.fromTo(
      ".hero-drop .drop-word",
      { y: -50, opacity: 0, rotationX: 45 },
      { y: 0, opacity: 1, rotationX: 0, duration: 1.1, stagger: 0.08, ease: "expo.out", delay: 0.2 }
    );
    animateDropHeadlines();

    // Feature card stagger
    gsap.utils.toArray<HTMLElement>(".feature-card").forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: { trigger: card, start: "top 90%" },
        opacity: 0, y: 40, scale: 0.96, duration: 0.7, delay: i * 0.08, ease: "power3.out",
      });
    });
    gsap.from(".step-card", {
      scrollTrigger: { trigger: "#how-it-works", start: "top 70%" },
      y: 50, opacity: 0, stagger: 0.15, duration: 0.9, ease: "expo.out",
    });
    gsap.from(".pricing-card", {
      scrollTrigger: { trigger: "#pricing", start: "top 75%" },
      y: 60, opacity: 0, scale: 0.9, duration: 0.8, stagger: 0.15, ease: "expo.out",
    });

    // Hero card 3D tilt
    const heroCard = heroCardRef.current;
    if (heroCard) {
      const onMove = (e: MouseEvent) => {
        const r = heroCard.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        gsap.to(heroCard, { rotateX: (y - r.height / 2) / 25, rotateY: (r.width / 2 - x) / 25, duration: 0.4, ease: "power2.out" });
      };
      const onLeave = () => gsap.to(heroCard, { rotateX: 0, rotateY: 0, duration: 0.8, ease: "elastic.out(1,0.3)" });
      heroCard.addEventListener("mousemove", onMove);
      heroCard.addEventListener("mouseleave", onLeave);

      // Magnetic CTA
      const cta = ctaRef.current;
      if (cta) {
        const onCtaMove = (e: MouseEvent) => {
          const r = cta.getBoundingClientRect();
          gsap.to(cta, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.3, ease: "power2.out" });
        };
        const onCtaLeave = () => gsap.to(cta, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1,0.3)" });
        cta.addEventListener("mousemove", onCtaMove);
        cta.addEventListener("mouseleave", onCtaLeave);
      }
    }

    return () => ScrollTrigger.getAll().forEach((s) => s.kill());
  }, []);

  return (
    <div className="bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="glass-nav fixed inset-x-0 top-0 z-50 h-20 border-b border-border/40 bg-background/80">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-6">
          <Link to="/" className="font-display text-2xl font-bold tracking-tighter">
            SOTA <span className="text-primary">Flovo</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">How it works</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-hover active:scale-95">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-28">
        <HeroCanvas />
        <div className="relative z-10 mx-auto max-w-[1280px] px-6 text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-soft/40 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary-hover" />
            <span className="text-label-mono text-primary-hover">AI-powered precision</span>
          </div>
          <h1 className="hero-drop font-display mb-6 text-5xl font-extrabold tracking-tighter md:text-7xl">
            <span className="drop-word">Turn</span>{" "}
            <span className="drop-word">your</span>{" "}
            <span className="drop-word">startup</span>{" "}
            <span className="drop-word">into</span>{" "}
            <span className="drop-word">a</span>{" "}
            <span className="drop-word text-primary">motion brand</span>
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground md:text-xl">
            The world's first motion studio engine for founders. Automate high-performance brand assets that scale with your growth.
          </p>
          <div className="mb-16 flex justify-center">
            <Link
              ref={ctaRef}
              to="/dashboard"
              className="lime-glow inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Start creating <Zap className="h-4 w-4" />
            </Link>
          </div>

          {/* 3D Card */}
          <div className="perspective-1000 group relative mx-auto max-w-4xl">
            <div
              ref={heroCardRef}
              className="tilt-card relative aspect-video w-full overflow-hidden rounded-3xl border border-border bg-canvas shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-canvas to-canvas" />
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="lime-glow flex h-20 w-20 items-center justify-center rounded-full bg-primary transition-transform hover:scale-110">
                  <Play className="ml-1 h-8 w-8 fill-primary-foreground text-primary-foreground" />
                </button>
              </div>
              <div className="absolute bottom-6 left-6 text-canvas-foreground">
                <div className="text-label-mono opacity-70">Watch demo</div>
                <div className="font-display text-xl font-semibold">60-second brand reel</div>
              </div>
            </div>
            <div className="absolute -left-6 -top-8 hidden rounded-xl border border-border bg-surface px-4 py-2 shadow-lg md:flex">
              <span className="text-label-mono">FINTECH</span>
            </div>
            <div className="absolute -bottom-6 -right-6 hidden rounded-xl border border-border bg-surface px-4 py-2 shadow-lg md:flex">
              <span className="text-label-mono">SAAS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-[1280px] px-6">
          <p className="text-label-mono mb-12 text-center text-muted-foreground">Trusted by founders &amp; creative teams</p>
          <div className="mb-16 flex flex-wrap items-center justify-center gap-x-16 gap-y-6 opacity-60">
            {["Airbnb", "Linear", "Figma", "Notion", "Revolut", "Vercel"].map((n) => (
              <div key={n} className="font-display text-2xl font-bold tracking-tight text-foreground/70">{n}</div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-8 border-t border-border pt-12 md:grid-cols-3">
            {[
              { v: "1,240+", l: "Videos generated" },
              { v: "4.9 ★", l: "Founder rating" },
              { v: "100ms", l: "Render latency" },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <div className="font-display text-4xl font-bold text-primary-hover">{s.v}</div>
                <div className="text-label-mono mt-2 text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="mb-16">
            <div className="text-label-mono mb-4 text-primary-hover">Core capabilities</div>
            <h2 className="drop-headline max-w-2xl font-display text-4xl font-bold tracking-tighter md:text-5xl">
              Precision tools built for the next generation of brands.
            </h2>
          </div>
          <div className="grid auto-rows-[340px] grid-cols-1 gap-6 md:grid-cols-3">
            <FeatureCard className="md:col-span-2" icon={<Brush />} title="Brand extraction" body="Auto-sync your guidelines, logos, and color palettes in seconds from any URL." />
            <FeatureCard icon={<AudioLines />} title="Voice sync" body="Neural voices matched to your brand's tone and rhythm." />
            <FeatureCard icon={<Type />} title="Kinetic type" body="Auto-generated typography that moves with your message." />
            <FeatureCard className="md:col-span-2" icon={<Layers />} title="Batch engine" body="Render hundreds of variants in one click — optimized for Meta, LinkedIn, YouTube." />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-surface py-32">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="mb-16 text-center">
            <div className="text-label-mono mb-4 text-primary-hover">Workflow</div>
            <h2 className="drop-headline mx-auto max-w-2xl font-display text-4xl font-bold tracking-tighter md:text-5xl">
              Six steps. One cinematic brand reel.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-6">
            {["Brand", "Logo", "Palette", "Voice", "Timeline", "Render"].map((s, i) => (
              <div key={s} className="step-card rounded-2xl border border-border bg-background p-6">
                <div className="text-label-mono mb-3 text-primary-hover">Step {i + 1}</div>
                <div className="font-display text-xl font-semibold">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="mb-16 text-center">
            <div className="text-label-mono mb-4 text-primary-hover">Pricing</div>
            <h2 className="drop-headline mx-auto max-w-2xl font-display text-4xl font-bold tracking-tighter md:text-5xl">
              Start free. Scale at the speed of your brand.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <PricingCard tier="Free" price="$0" perks={["3 videos / month", "720p export", "SOTA watermark"]} cta="Get started" />
            <PricingCard tier="Pro" price="$29" highlight perks={["Unlimited videos", "4K export", "Custom voices", "No watermark"]} cta="Start Pro trial" />
            <PricingCard tier="API" price="$99" perks={["Programmatic render", "Webhook callbacks", "10k frames / month"]} cta="Get API access" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-16">
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-12 px-6 md:grid-cols-4">
          <div className="col-span-2">
            <div className="font-display text-2xl font-bold tracking-tighter">
              SOTA <span className="text-primary">Flovo</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Defining the kinetic language of the world's most ambitious startups.
            </p>
          </div>
          <FooterCol title="Platform" links={["Templates", "Engine", "Showcase"]} />
          <FooterCol title="Company" links={["About", "Careers", "Contact"]} />
        </div>
        <div className="mx-auto mt-16 flex max-w-[1280px] flex-col gap-4 border-t border-border px-6 pt-8 text-label-mono text-muted-foreground md:flex-row md:justify-between">
          <span>© 2026 SOTA Flovo Studio. All rights reserved.</span>
          <div className="flex gap-8">
            <a href="#" className="hover:text-primary">Privacy</a>
            <a href="#" className="hover:text-primary">Terms</a>
            <a href="#" className="hover:text-primary">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, body, className = "" }: { icon: React.ReactNode; title: string; body: string; className?: string }) {
  return (
    <div className={`feature-card group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-surface p-10 transition-all hover:shadow-xl ${className}`}>
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary-hover transition-transform group-hover:scale-110">
        {icon}
      </div>
      <h3 className="font-display mb-3 text-2xl font-bold">{title}</h3>
      <p className="max-w-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function PricingCard({ tier, price, perks, cta, highlight = false }: { tier: string; price: string; perks: string[]; cta: string; highlight?: boolean }) {
  return (
    <div className={`pricing-card rounded-3xl border p-8 ${highlight ? "pulse-lime border-primary bg-surface" : "border-border bg-surface"}`}>
      <div className="text-label-mono mb-2 text-muted-foreground">{tier}</div>
      <div className="mb-6 font-display text-5xl font-bold">{price}<span className="text-base font-normal text-muted-foreground">/mo</span></div>
      <ul className="mb-8 space-y-3">
        {perks.map((p) => (
          <li key={p} className="flex items-center gap-2 text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {p}
          </li>
        ))}
      </ul>
      <Link
        to="/dashboard"
        className={`block rounded-full px-6 py-3 text-center text-sm font-semibold transition-colors ${
          highlight ? "bg-primary text-primary-foreground hover:bg-primary-hover" : "border border-border text-foreground hover:bg-primary-soft"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="text-label-mono mb-4 text-primary-hover">{title}</h4>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l}><a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">{l}</a></li>
        ))}
      </ul>
    </div>
  );
}
