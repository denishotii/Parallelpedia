import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoFull from '../logo/logo-with-name.svg';
import logoIcon from '../logo/icon-only-logo.svg';

const useTilt = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const onMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const rotateY = ((x - midX) / midX) * 6;
    const rotateX = -((y - midY) / midY) * 6;
    ref.current.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
    ref.current.style.boxShadow = `0 20px 40px rgba(0,0,0,0.12)`;
  };
  const onMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = `perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)`;
    ref.current.style.boxShadow = `0 10px 20px rgba(0,0,0,0.08)`;
  };
  return { ref, onMouseMove, onMouseLeave };
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { ref: tiltRef, onMouseMove, onMouseLeave } = useTilt();
  const [score, setScore] = useState(0);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const duration = 900;
    const target = 84;
    const tick = (t: number) => {
      const progress = Math.min(1, (t - start) / duration);
      setScore(Math.floor(progress * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('reveal-visible');
          }
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoFull} alt="Parallelpedia" className="h-8 md:h-9 lg:h-10 w-auto" />
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">beta</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#how" className="text-gray-600 hover:text-gray-900">How it works</a>
            <a href="#trust-xray" className="text-gray-600 hover:text-gray-900">DKG</a>
            <a href="#screenshots" className="text-gray-600 hover:text-gray-900">Preview</a>
            <button
              onClick={() => navigate('/app')}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
            >
              Open Live App
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-[40vh] bg-gradient-to-b from-blue-50 to-transparent" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-3xl opacity-70" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-br from-rose-100 to-amber-100 rounded-full blur-3xl opacity-70" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                  Parallelpedia
                </h1>
                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  beta
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-semibold text-gray-900">
                Audit AI encyclopedias, one article at a time.
              </p>
              <p className="text-gray-600">
                Compare Grokipedia with Wikipedia, compute a trust score, and publish concise
                Community Notes to the OriginTrail DKG for verifiable context.
              </p>
              <div className="flex flex-wrap gap-3 pt-3">
                <button
                  onClick={() => navigate('/app')}
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Open Live App
                </button>
                <a
                  href="#demo"
                  className="px-6 py-3 rounded-lg border border-gray-300 text-gray-800 font-semibold bg-white hover:bg-gray-50 transition"
                >
                  Watch 1-min demo
                </a>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-2 pt-1">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">★</span>
                Built for the OriginTrail Scaling Trust & AI Hackathon
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <div
                ref={tiltRef}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
                className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5 transition-transform duration-150"
                aria-hidden
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">Trust Score</h3>
                  <span className="text-xs text-gray-500">sample</span>
                </div>
                <div className="mt-3 inline-flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full ring-4 ring-blue-100" />
                    <div className="relative text-5xl font-extrabold text-gray-900 px-1">{score}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-3">
                  <div className="rounded-lg bg-green-50 p-3 text-center">
                    <div className="text-lg font-bold text-green-600">42</div>
                    <div className="text-[11px] text-green-700">Aligned</div>
                  </div>
                  <div className="rounded-lg bg-yellow-50 p-3 text-center">
                    <div className="text-lg font-bold text-yellow-600">12</div>
                    <div className="text-[11px] text-yellow-700">Missing</div>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3 text-center">
                    <div className="text-lg font-bold text-red-600">7</div>
                    <div className="text-[11px] text-red-700">Conflicts</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3 text-center">
                    <div className="text-lg font-bold text-gray-700">5</div>
                    <div className="text-[11px] text-gray-700">Unsupported</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-purple-50/40" id="how" data-reveal>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">How Parallelpedia works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow transition">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</div>
                <span className="text-xl">🔎</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Search a topic</h3>
              <p className="text-gray-600 text-sm">Type an AI encyclopedia topic (e.g., “Elon Musk”).</p>
            </div>
            <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow transition">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</div>
                <span className="text-xl">⚖️</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Compare articles</h3>
              <p className="text-gray-600 text-sm">We line up Grokipedia vs Wikipedia and compute a trust score.</p>
            </div>
            <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow transition">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</div>
                <span className="text-xl">🕸️</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Publish to DKG</h3>
              <p className="text-gray-600 text-sm">Generate a community note and anchor it on OriginTrail DKG.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust X-Ray */}
      <section className="py-16" id="trust-xray" data-reveal>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Your trust X-ray for AI articles</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xl">🧭</span>
                <div><div className="font-semibold text-gray-900">Detect missing context</div><div className="text-gray-700 text-sm">See what one source omits.</div></div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🚩</span>
                <div><div className="font-semibold text-gray-900">Flag conflicts</div><div className="text-gray-700 text-sm">Catch contradictions instantly.</div></div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🔍</span>
                <div><div className="font-semibold text-gray-900">Highlight unsupported</div><div className="text-gray-700 text-sm">Spot claims lacking evidence.</div></div>
              </div>
              <button onClick={() => navigate('/app')} className="text-sm font-semibold text-blue-600 hover:underline mt-2">Open in app →</button>
            </div>
          </div>
          <div className="text-center">
            <div
              className="mx-auto w-56 h-56 rounded-full"
              style={{
                background: 'conic-gradient(#16a34a 0 40%, #f59e0b 40% 65%, #ef4444 65% 80%, #9ca3af 80% 100%)',
              }}
            />
            <div className="mt-2 flex items-center justify-center gap-3 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" />Aligned</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />Missing</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Conflicts</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" />Unsupported</span>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Parallelpedia turns long AI articles into a concise trust profile you can skim in seconds.
            </div>
            <div className="text-[11px] text-gray-400">Example profile, not live data</div>
            <a href="#screenshots" className="inline-block mt-2 text-sm font-semibold text-blue-600 hover:underline">
              See it in action →
            </a>
          </div>
        </div>
      </section>

      {/* Powered by OriginTrail DKG */}
      <section className="py-16 bg-white" data-reveal>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Powered by OriginTrail DKG</h2>
          <p className="text-gray-700 max-w-2xl">
            Publish community notes as verifiable claims on the OriginTrail DKG. Create an open, tamper‑resistant record of what was missing or misaligned.
          </p>
          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white flex items-center gap-2">
                <span>📄</span> <span>AI articles (Grokipedia + Wikipedia)</span>
              </div>
              <div className="text-gray-400">→</div>
              <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white flex items-center gap-2">
                <span>⚙️</span> <span>Parallelpedia analysis engine</span>
              </div>
              <div className="text-gray-400">→</div>
              <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white flex items-center gap-2">
                <span>🧾</span> <span>Verifiable note on OriginTrail DKG</span>
              </div>
            </div>
          </div>
          <ul className="mt-6 grid md:grid-cols-3 gap-4 text-sm text-gray-700">
            <li className="bg-gray-50 border border-gray-200 rounded-2xl p-3">Transparency and provenance</li>
            <li className="bg-gray-50 border border-gray-200 rounded-2xl p-3">Composability across apps</li>
            <li className="bg-gray-50 border border-gray-200 rounded-2xl p-3">Reusable knowledge assets</li>
          </ul>
          <div className="mt-4 inline-block text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 border border-purple-200">
            Built for the OriginTrail Scaling Trust & AI Hackathon
          </div>
        </div>
      </section>

      {/* Screenshots / Preview */}
      <section className="py-16" id="screenshots" data-reveal>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">See the app before you try it</h2>
          <div className="grid md:grid-cols-3 gap-6 overflow-x-auto md:overflow-visible snap-x">
            {[
              { label: 'Feature 1', title: 'Trust score overview', desc: 'Summary of alignment and issues at a glance.' },
              { label: 'Feature 2', title: 'Evidence breakdown', desc: 'Missing context and conflicts are easy to spot.' },
              { label: 'Feature 3', title: 'Article comparison', desc: 'Read Grokipedia and Wikipedia side by side.' },
            ].map((card, idx) => (
              <div
                key={idx}
                className="min-w-[280px] md:min-w-0 snap-start rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition p-4"
              >
                <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200 mb-2">{card.label}</span>
                <div className="h-40 rounded-xl bg-gray-100 mb-3 flex items-center justify-center text-gray-400 text-sm">
                  Screenshot placeholder
                </div>
                <h3 className="font-semibold text-gray-900">{card.title}</h3>
                <p className="text-sm text-gray-600">{card.desc}</p>
                <button
                  onClick={() => navigate('/app')}
                  className="mt-2 text-sm font-semibold text-blue-600 hover:underline"
                >
                  Open in app →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience & FAQ */}
      <section className="py-16 bg-white" data-reveal>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Who is Parallelpedia for?</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="p-6 rounded-2xl border border-gray-200 bg-white">
              <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">🧑‍💻 Researchers & journalists</h3>
              <p className="text-sm text-gray-600">Quickly check AI-generated bios and claims.</p>
            </div>
            <div className="p-6 rounded-2xl border border-gray-200 bg-white">
              <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">👩‍💻 Developers</h3>
              <p className="text-sm text-gray-600">Integrate AI encyclopedias with a trust layer.</p>
            </div>
            <div className="p-6 rounded-2xl border border-gray-200 bg-white">
              <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">📚 Curious readers</h3>
              <p className="text-sm text-gray-600">Get transparency on AI content.</p>
            </div>
          </div>

          <div className="space-y-3 max-w-3xl">
            {[
              { q: 'Does Parallelpedia change Wikipedia or Grokipedia?', a: 'No. It analyzes content and produces structured notes; it does not modify source articles.' },
              { q: 'Where are notes stored?', a: 'On the OriginTrail Decentralized Knowledge Graph (DKG) as verifiable Knowledge Assets.' },
              { q: 'Is this open source / a hackathon project?', a: 'Yes, built for the OriginTrail Scaling Trust & AI Hackathon.' },
            ].map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-gray-200 bg-white">
                <button
                  className="w-full text-left p-4 font-semibold text-gray-900"
                  onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
                >
                  {item.q}
                </button>
                {openFaqIdx === idx && (
                  <div className="px-4 pb-4 -mt-2">
                    <p className="text-sm text-gray-700">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16" data-reveal>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Ready to audit your first AI article?
          </h2>
          <p className="text-gray-600 mb-6">Type any topic and we’ll show you how AI encyclopedias agree — or don’t.</p>
          <button
            onClick={() => navigate('/app')}
            className="px-7 py-3.5 rounded-xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition cta-pulse"
          >
            Open Live App
          </button>
          <div className="mt-6 text-xs text-gray-500">
            Built by Team Parallelpedia for the OriginTrail Scaling Trust & AI Hackathon
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-600 flex flex-col md:flex-row items-center justify-between gap-2">
          <div>Parallelpedia — Auditing AI encyclopedias.</div>
          <div className="flex items-center gap-4">
            <a className="hover:underline font-semibold text-gray-800" href="/app">Open app →</a>
            {/* Optional links to GitHub/X can be added here */}
          </div>
        </div>
      </footer>
    </div>
  );
}


