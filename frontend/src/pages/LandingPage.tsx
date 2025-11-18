import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Brain, AlertTriangle, Search, Shield, Zap, Database, 
  Code, Layers, CheckCircle2, XCircle, 
  AlertCircle, HelpCircle, ArrowRight, TrendingUp,
  FileText, Cpu, Network, Link2, BarChart3, Activity,
  Globe, Github, ExternalLink, Scale, ChevronUp, ChevronDown
} from 'lucide-react';
import logoFull from '../logo/logo-with-name.svg';

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

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: "-100px" },
  transition: { staggerChildren: 0.1 }
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 }
};

// Color mapping helper
const getColorClasses = (color: string, type: 'text' | 'bg' | 'border' | 'from' | 'to' | 'icon') => {
  const colorMap: Record<string, Record<string, string>> = {
    green: { text: 'text-green-700', bg: 'bg-green-500', border: 'border-green-200', from: 'from-green-50', to: 'to-green-50', icon: 'text-green-600' },
    yellow: { text: 'text-yellow-700', bg: 'bg-yellow-500', border: 'border-yellow-200', from: 'from-yellow-50', to: 'to-yellow-50', icon: 'text-yellow-600' },
    red: { text: 'text-red-700', bg: 'bg-red-500', border: 'border-red-200', from: 'from-red-50', to: 'to-red-50', icon: 'text-red-600' },
    gray: { text: 'text-gray-700', bg: 'bg-gray-400', border: 'border-gray-200', from: 'from-gray-50', to: 'to-gray-50', icon: 'text-gray-600' },
    blue: { text: 'text-blue-700', bg: 'bg-blue-500', border: 'border-blue-200', from: 'from-blue-50', to: 'to-blue-50', icon: 'text-blue-600' },
    purple: { text: 'text-purple-700', bg: 'bg-purple-500', border: 'border-purple-200', from: 'from-purple-50', to: 'to-purple-50', icon: 'text-purple-600' },
    indigo: { text: 'text-indigo-700', bg: 'bg-indigo-500', border: 'border-indigo-200', from: 'from-indigo-50', to: 'to-indigo-50', icon: 'text-indigo-600' },
    pink: { text: 'text-pink-700', bg: 'bg-pink-500', border: 'border-pink-200', from: 'from-pink-50', to: 'to-pink-50', icon: 'text-pink-600' },
  };
  return colorMap[color]?.[type] || '';
};

// Section Badge Component
const SectionBadge = ({ icon: Icon, label }: { icon: any, label: string }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-xs font-semibold text-gray-700 mb-4">
    <Icon className="w-3 h-3" />
    <span>{label}</span>
  </div>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const { ref: tiltRef, onMouseMove, onMouseLeave } = useTilt();
  const [score, setScore] = useState(0);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

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

  const handleTryExample = (topic: string) => {
    navigate(`/app?topic=${encodeURIComponent(topic)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Nav */}
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoFull} alt="Parallelpedia" className="h-8 md:h-9 lg:h-10 w-auto" />
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-semibold">beta</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#problem" className="text-gray-600 hover:text-gray-900 transition-colors">Problem</a>
            <a href="#solution" className="text-gray-600 hover:text-gray-900 transition-colors">Solution</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How it works</a>
            <a href="#technology" className="text-gray-600 hover:text-gray-900 transition-colors">Technology</a>
            <a href="#impact" className="text-gray-600 hover:text-gray-900 transition-colors">Impact</a>
            <button
              onClick={() => navigate('/app')}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all transform hover:scale-105"
            >
              Open Live App
            </button>
          </div>
        </div>
      </nav>

      {/* Hero with Animation */}
      <section ref={heroRef} className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated Background */}
        <div className="absolute inset-0 pointer-events-none animate-gradient">
          <div className="absolute inset-x-0 top-0 h-[50vh] bg-gradient-to-b from-blue-50 via-purple-50 to-transparent" />
          <motion.div 
            className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl opacity-60"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 0.8, 0.6],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-br from-rose-200 to-amber-200 rounded-full blur-3xl opacity-60"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.6, 0.8, 0.6],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          {/* Subtle floating particles */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-blue-400/20 rounded-full"
              style={{
                left: `${10 + (i * 6)}%`,
                top: `${10 + (i * 5)}%`,
              }}
              animate={{
                opacity: [0.05, 0.15, 0.05],
                scale: [0.5, 1, 0.5],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        <motion.div 
          style={{ opacity, scale }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-6 max-w-xl"
            >
              <div className="inline-flex items-center gap-2">
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900">
                  Parallelpedia
                </h1>
                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-semibold">
                  beta
                </span>
              </div>
              <p className="text-3xl md:text-4xl font-bold text-gray-900">
                Scaling Trust in the Age of AI
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                A modern comparison tool that brings intelligent AI decision systems to ensure information is trustworthy. Compare AI-generated encyclopedias with Wikipedia, detect conflicts and hallucinations, and publish verifiable Community Notes to the OriginTrail DKG.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/app')}
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition-all"
                >
                  Open Live App
                </motion.button>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="https://github.com/denishotii/dkg-plugin-parallelpedia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-800 font-semibold bg-white hover:bg-gray-50 transition-all shadow-md"
                >
                  View on GitHub
                </motion.a>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-2 pt-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">★</span>
                Built for the OriginTrail Scaling Trust & AI Hackathon
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 30, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="flex justify-center md:justify-end"
            >
              <div
                ref={tiltRef}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 transition-transform duration-150 border border-gray-100"
                aria-hidden
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700">Trust Score</h3>
                  <span className="text-xs text-gray-500">sample</span>
                </div>
                <div className="mt-3 inline-flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full ring-4 ring-blue-100" />
                    <div className="relative text-6xl font-extrabold text-gray-900 px-1">{score}</div>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  {[
                    { label: 'Aligned', value: 42, color: 'green', percentage: 40 },
                    { label: 'Missing', value: 12, color: 'yellow', percentage: 25 },
                    { label: 'Conflicts', value: 7, color: 'red', percentage: 20 },
                    { label: 'Unsupported', value: 5, color: 'gray', percentage: 15 },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className={`font-semibold ${getColorClasses(item.color, 'text')}`}>{item.label}</span>
                        <span className="text-gray-600">{item.value}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                          className={`h-full ${getColorClasses(item.color, 'bg')} rounded-full`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Problem Statement - Enhanced */}
      <section className="py-24 bg-white" id="problem" data-reveal>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <SectionBadge icon={AlertTriangle} label="Problem" />
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">The Problem</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              As AI-generated content becomes ubiquitous, how can we trust what we read?
            </p>
          </motion.div>
          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { 
                num: 1, 
                icon: Brain, 
                emoji: '',
                title: 'AI Encyclopedias Hallucinate', 
                desc: 'AI encyclopedias can generate plausible-sounding but false information, making it difficult to distinguish fact from fiction.',
                bg: 'from-red-50 to-rose-50',
                border: 'border-red-200',
                iconColor: 'text-red-600'
              },
              { 
                num: 2, 
                icon: Search, 
                emoji: '',
                title: 'Lack of Verification', 
                desc: 'No systematic way to verify AI-generated content against trusted sources or detect subtle biases and missing context.',
                bg: 'from-yellow-50 to-amber-50',
                border: 'border-yellow-200',
                iconColor: 'text-yellow-600'
              },
              { 
                num: 3, 
                icon: Shield, 
                emoji: '',
                title: 'No Trust Layer', 
                desc: 'AI agents and applications lack access to verifiable trust signals about the content they consume and generate.',
                bg: 'from-blue-50 to-indigo-50',
                border: 'border-blue-200',
                iconColor: 'text-blue-600'
              },
            ].map((problem, idx) => (
              <motion.div
                key={idx}
                variants={staggerItem}
                whileHover={{ scale: 1.02, y: -5 }}
                className={`p-8 rounded-2xl border-2 ${problem.border} bg-gradient-to-br ${problem.bg} shadow-md hover:shadow-xl transition-all`}
              >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-xl bg-white ${problem.border} border-2 flex items-center justify-center shadow-md`}>
                  <problem.icon className={`w-8 h-8 ${problem.iconColor}`} />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Problem #{problem.num}</div>
                  <div className="text-3xl">{problem.emoji}</div>
                </div>
              </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{problem.title}</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{problem.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Solution - Enhanced */}
      <section className="py-24 bg-gradient-to-b from-blue-50 via-purple-50 to-white" id="solution" data-reveal>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <SectionBadge icon={Zap} label="Solution" />
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Solution</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Parallelpedia is a complete trust verification system that compares AI-generated content with Wikipedia, detects issues, and publishes verifiable Community Notes to the OriginTrail DKG.
            </p>
          </motion.div>
          {/* Central Visual - Trust Card Mockup */}
          <motion.div
            {...fadeInUp}
            className="mb-16 flex justify-center"
          >
            <div className="bg-white rounded-3xl border-2 border-blue-200 shadow-2xl p-8 max-w-2xl w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Trust Analysis</h3>
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">84/100</div>
              </div>
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-sm font-medium text-gray-700">✅ Aligned</span>
                  <span className="text-sm font-bold text-green-700">42 segments</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <span className="text-sm font-medium text-gray-700">⚠️ Missing Context</span>
                  <span className="text-sm font-bold text-yellow-700">12 segments</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <span className="text-sm font-medium text-gray-700">✗ Conflicts</span>
                  <span className="text-sm font-bold text-red-700">7 segments</span>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2">Published to OriginTrail DKG</div>
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Link2 className="w-4 h-4" />
                  <span className="font-mono">did:dkg:otp:20430/0xcdb2...</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-2 gap-8 items-center"
          >
            <div className="space-y-6">
              {[
                {
                  icon: Search,
                  title: 'Intelligent Comparison Engine',
                  desc: 'Multi-layered AI analysis using semantic embeddings, NER, fact extraction, and LLM classification to detect conflicts, missing context, and hallucinations.',
                  gradient: 'from-blue-50 to-white',
                  border: 'border-blue-200'
                },
                {
                  icon: BarChart3,
                  title: 'Trust Score System',
                  desc: 'Computes 0-100 trust scores based on segment classifications, giving you an instant understanding of content reliability.',
                  gradient: 'from-purple-50 to-white',
                  border: 'border-purple-200'
                },
                {
                  icon: Link2,
                  title: 'DKG Integration',
                  desc: 'Publishes Community Notes as verifiable Knowledge Assets on OriginTrail DKG, creating a tamper-resistant trust layer for AI agents.',
                  gradient: 'from-green-50 to-white',
                  border: 'border-green-200'
                },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  variants={staggerItem}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className={`p-6 rounded-2xl bg-gradient-to-br ${item.gradient} border ${item.border} shadow-md hover:shadow-lg transition-all`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-white ${item.border} border-2 flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <item.icon className="w-7 h-7 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2 text-lg">{item.title}</h3>
                      <p className="text-sm text-gray-700 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.div
              variants={staggerItem}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-xl"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Complete Package</h3>
              <div className="space-y-3">
                {[
                  'Modern comparison tool',
                  'Smart AI decision system',
                  'Trust verification layer',
                  'DKG Knowledge Assets',
                  'MCP tools for AI agents',
                  'Open-source & composable'
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700 font-medium">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works - Enhanced */}
      <section className="py-24 bg-white" id="how-it-works" data-reveal>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <SectionBadge icon={Activity} label="How It Works" />
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How Parallelpedia Works</h2>
          </motion.div>
          
          {/* Unified Flow Graphic */}
          <motion.div
            {...fadeInUp}
            className="mb-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 md:p-12 border-2 border-blue-200"
          >
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              {[
                { num: 1, icon: Search, title: 'Search a topic', desc: 'Type an AI encyclopedia topic (e.g., "Elon Musk")' },
                { num: 2, icon: Scale, title: 'Compare articles', desc: 'We line up Grokipedia vs Wikipedia and compute a trust score' },
                { num: 3, icon: Network, title: 'Publish to DKG', desc: 'Generate a community note and anchor it on OriginTrail DKG' },
              ].map((step, idx) => (
                <React.Fragment key={idx}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.2 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="flex flex-col items-center text-center p-8 bg-white rounded-2xl border-2 border-blue-200 shadow-lg min-w-[240px]"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
                        {step.num}
                      </div>
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <step.icon className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 text-xl">{step.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
                  </motion.div>
                  {idx < 2 && (
                    <ArrowRight className="w-8 h-8 text-blue-400 hidden md:block flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.div>

          {/* Try It Examples */}
          <motion.div {...fadeInUp} className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Try It With One Click</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {['Elon_Musk', 'Artificial_intelligence', 'Climate_change'].map((topic, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTryExample(topic)}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {topic.replace('_', ' ')}
                </motion.button>
              ))}
            </div>
          </motion.div>
          
          {/* Trust X-Ray - Enhanced */}
          <motion.div
            {...fadeInUp}
            className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-3xl p-12 border-2 border-purple-200 shadow-xl"
          >
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Your Trust X-ray for AI Articles</h3>
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div className="space-y-6">
                <h4 className="font-bold text-gray-900 text-lg mb-4">Example Analysis</h4>
                {/* Aligned Example */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="p-4 rounded-xl bg-green-50 border border-green-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-700 text-sm">Aligned Example</span>
                  </div>
                  <p className="text-xs text-gray-700 italic">"Elon Musk was born in 1971 in Pretoria, South Africa."</p>
                  <p className="text-xs text-gray-600 mt-1">✓ Matches Wikipedia closely</p>
                </motion.div>
                {/* Conflict Example */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="p-4 rounded-xl bg-red-50 border border-red-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-700 text-sm">Conflict Example</span>
                  </div>
                  <p className="text-xs text-gray-700 italic">"Musk pledged $1B, contributed $45M" vs "Musk pledged $1B, gave $50M"</p>
                  <p className="text-xs text-gray-600 mt-1">✗ Contradictory facts detected</p>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => navigate('/app')}
                  className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-2 mt-4"
                >
                  Open in app <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg mb-4 text-center">Trust Profile Breakdown</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Aligned', value: 42, color: 'bg-green-500', width: 'w-[70%]' },
                    { label: 'Missing Context', value: 12, color: 'bg-yellow-500', width: 'w-[20%]' },
                    { label: 'Conflicts', value: 7, color: 'bg-red-500', width: 'w-[12%]' },
                    { label: 'Unsupported', value: 5, color: 'bg-gray-400', width: 'w-[8%]' },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ width: 0 }}
                      whileInView={{ width: '100%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                      className="space-y-1"
                    >
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-gray-700">{item.label}</span>
                        <span className="text-gray-600">{item.value}</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: item.width }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: idx * 0.1 + 0.2 }}
                          className={`h-full ${item.color} rounded-full`}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-gray-600 text-center">
                  Parallelpedia turns long AI articles into a concise trust profile you can skim in seconds.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Technology & AI Comparison - Enhanced with Pipeline Diagram */}
      <section className="py-24 bg-gray-50" id="technology" data-reveal>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <SectionBadge icon={Brain} label="AI Comparison Engine" />
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Advanced AI Comparison Engine</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our multi-layered analysis system combines state-of-the-art AI techniques to ensure accurate and trustworthy comparisons.
            </p>
          </motion.div>
          
          {/* Pipeline Diagram */}
          <motion.div
            {...fadeInUp}
            className="bg-white rounded-3xl border-2 border-gray-200 p-8 md:p-12 shadow-xl mb-12 overflow-x-auto"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Analysis Pipeline</h3>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              {[
                { name: 'Segmenter', icon: FileText, color: 'blue' },
                { name: 'Embeddings', icon: Cpu, color: 'purple' },
                { name: 'NER + Facts', icon: Search, color: 'green' },
                { name: 'Similarity', icon: TrendingUp, color: 'yellow' },
                { name: 'LLM Classifier', icon: Brain, color: 'indigo' },
                { name: 'Trust Score', icon: BarChart3, color: 'red' },
                { name: 'JSON-LD', icon: Code, color: 'pink' },
                { name: 'DKG Publisher', icon: Network, color: 'blue' },
              ].map((stage, idx) => (
                <React.Fragment key={idx}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.1 }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${getColorClasses(stage.color, 'from')} to-white border-2 ${getColorClasses(stage.color, 'border')} shadow-md min-w-[120px]`}
                  >
                    <stage.icon className={`w-8 h-8 ${getColorClasses(stage.color, 'icon')}`} />
                    <span className="text-xs font-semibold text-gray-700 text-center">{stage.name}</span>
                  </motion.div>
                  {idx < 7 && (
                    <ArrowRight className="w-6 h-6 text-gray-400 hidden md:block" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <motion.div
              {...fadeInUp}
              className="bg-white rounded-2xl border-2 border-blue-200 p-8 shadow-lg"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Cpu className="w-6 h-6 text-blue-600" />
                Tier 1: Core Enhancements
              </h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Semantic Embeddings:</strong> OpenAI or sentence-transformers for understanding meaning, not just word matching</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Better Sentence Segmentation:</strong> spaCy-based NLP for accurate sentence boundaries</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>LLM Classification:</strong> GPT-4o-mini for intelligent segment classification</span>
                </li>
              </ul>
            </motion.div>
            
            <motion.div
              {...fadeInUp}
              className="bg-white rounded-2xl border-2 border-green-200 p-8 shadow-lg"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Layers className="w-6 h-6 text-green-600" />
                Tier 2: Advanced Analysis
              </h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Named Entity Recognition (NER):</strong> Compares people, organizations, places, dates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Fact Extraction:</strong> Identifies and compares structured factual claims</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Citation Analysis:</strong> Detects missing citations and unsourced claims</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Temporal & Number Analysis:</strong> Flags conflicting dates, timelines, and statistics</span>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Four-Tier Classification */}
          <motion.div
            {...fadeInUp}
            className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl border-2 border-indigo-200 p-10 shadow-xl mb-12"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Four-Tier Classification System</h3>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: CheckCircle2, label: 'ALIGNED', desc: 'Similarity ≥ 0.7', detail: 'Content matches Wikipedia closely', color: 'green' },
                { icon: AlertCircle, label: 'MISSING CONTEXT', desc: 'Similarity 0.3-0.7', detail: 'Related but missing details', color: 'yellow' },
                { icon: XCircle, label: 'CONFLICT', desc: 'Similarity 0.1-0.3', detail: 'Contradictory facts detected', color: 'red' },
                { icon: HelpCircle, label: 'UNSUPPORTED', desc: 'Similarity < 0.1', detail: 'Potential hallucinations', color: 'gray' },
              ].map((tier, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={`text-center p-6 rounded-2xl bg-white border-2 ${getColorClasses(tier.color, 'border')} shadow-lg`}
                >
                  <tier.icon className={`w-10 h-10 ${getColorClasses(tier.color, 'icon')} mx-auto mb-3`} />
                  <div className={`font-bold ${getColorClasses(tier.color, 'text')} mb-1 text-lg`}>{tier.label}</div>
                  <div className="text-xs text-gray-600 mb-2">{tier.desc}</div>
                  <div className="text-xs text-gray-500">{tier.detail}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Multi-Layer Trust System - Merged */}
          <motion.div
            {...fadeInUp}
            className="bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 rounded-3xl border-2 border-blue-200 p-10 shadow-xl"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Multi-Layer Trust Architecture</h3>
            <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
              Our system operates across three interconnected layers: Agent Layer for AI integration, Reasoning Layer for intelligent analysis, and Trust Layer for verifiable provenance.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {[
                {
                  layer: 'Agent Layer',
                  icon: Brain,
                  desc: 'AI agents query Community Notes via MCP tools, making informed decisions about content reliability.',
                  color: 'blue',
                  features: ['MCP Protocol', 'AI Agent Integration', 'Query Interface']
                },
                {
                  layer: 'Reasoning Layer',
                  icon: Cpu,
                  desc: 'Multi-layered AI analysis engine with semantic embeddings, NER, fact extraction, and LLM classification.',
                  color: 'purple',
                  features: ['Semantic Analysis', 'LLM Classification', 'Trust Scoring']
                },
                {
                  layer: 'Trust Layer',
                  icon: Shield,
                  desc: 'OriginTrail DKG provides tamper-resistant, verifiable Knowledge Assets with full provenance.',
                  color: 'green',
                  features: ['DKG Blockchain', 'Knowledge Assets', 'Provenance']
                },
              ].map((layer, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className={`bg-white rounded-2xl border-2 ${layer.color === 'blue' ? 'border-blue-200' : layer.color === 'purple' ? 'border-purple-200' : 'border-green-200'} p-8 shadow-lg`}
                >
                  <div className={`w-16 h-16 rounded-xl ${layer.color === 'blue' ? 'bg-blue-100' : layer.color === 'purple' ? 'bg-purple-100' : 'bg-green-100'} flex items-center justify-center mb-4`}>
                    <layer.icon className={`w-8 h-8 ${layer.color === 'blue' ? 'text-blue-600' : layer.color === 'purple' ? 'text-purple-600' : 'text-green-600'}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{layer.layer}</h3>
                  <p className="text-sm text-gray-700 mb-4 leading-relaxed">{layer.desc}</p>
                  <ul className="space-y-2">
                    {layer.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className={`w-4 h-4 ${layer.color === 'blue' ? 'text-blue-600' : layer.color === 'purple' ? 'text-purple-600' : 'text-green-600'}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
            {/* Connecting Flow */}
            <motion.div
              {...fadeInUp}
              className="flex items-center justify-center gap-4 text-gray-400"
            >
              <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent via-blue-300 to-purple-300" />
              <ArrowRight className="w-6 h-6" />
              <div className="flex-1 h-0.5 bg-gradient-to-r from-purple-300 via-green-300 to-transparent" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* OriginTrail DKG Integration - Enhanced */}
      <section className="py-24 bg-white" id="dkg" data-reveal>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <SectionBadge icon={Link2} label="OriginTrail Integration" />
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Powered by OriginTrail DKG</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Creating a verifiable trust layer for AI content through decentralized knowledge assets
            </p>
          </motion.div>
          
          {/* Visual Flow */}
          <motion.div
            {...fadeInUp}
            className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-3xl p-10 border-2 border-purple-200 shadow-xl mb-12"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Integration Flow</h3>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              {[
                { name: 'AI Articles', icon: FileText, color: 'blue' },
                { name: 'Analysis Engine', icon: Cpu, color: 'purple' },
                { name: 'OriginTrail DKG', icon: Network, color: 'green' },
                { name: 'Knowledge Assets', icon: Database, color: 'indigo' },
              ].map((stage, idx) => (
                <React.Fragment key={idx}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.2 }}
                    whileHover={{ scale: 1.1 }}
                    className="flex flex-col items-center gap-3 p-6 rounded-xl bg-white border-2 border-gray-200 shadow-lg min-w-[150px]"
                  >
                    <stage.icon className={`w-10 h-10 ${getColorClasses(stage.color, 'icon')}`} />
                    <span className="text-sm font-semibold text-gray-700 text-center">{stage.name}</span>
                  </motion.div>
                  {idx < 3 && (
                    <ArrowRight className="w-8 h-8 text-gray-400 hidden md:block" />
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="mt-8 text-center text-sm text-gray-600">
              <p>Community Notes published as verifiable Knowledge Assets on OriginTrail blockchain</p>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              {...fadeInUp}
              className="bg-white rounded-2xl border-2 border-purple-200 p-8 shadow-lg"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Code className="w-6 h-6 text-purple-600" />
                Custom DKG Plugin
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                We created a custom OriginTrail DKG Node plugin that enables:
              </p>
              <ul className="space-y-2 text-sm text-gray-700 mb-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span><strong>MCP Tools:</strong> AI agents can query Community Notes via Model Context Protocol</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span><strong>REST API:</strong> Endpoints for publishing and querying Community Notes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Knowledge Assets:</strong> Community Notes published as discoverable, linked JSON-LD/RDF assets</span>
                </li>
              </ul>
              <a
                href="https://github.com/denishotii/dkg-plugin-parallelpedia"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:underline"
              >
                View Plugin on GitHub <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
            
            <motion.div
              {...fadeInUp}
              className="bg-white rounded-2xl border-2 border-green-200 p-8 shadow-lg"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-green-600" />
                Mission Alignment
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                Parallelpedia directly supports OriginTrail's mission:
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Transparency & Provenance:</strong> Verifiable data with clear authorship</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Open Standards:</strong> JSON-LD/RDF Knowledge Assets following W3C standards</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Composability:</strong> Reusable knowledge assets that other apps can build upon</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Trust Layer:</strong> Tamper-resistant records of content verification</span>
                </li>
              </ul>
            </motion.div>
          </div>

          <motion.div
            {...fadeInUp}
            className="mt-12 grid md:grid-cols-3 gap-6"
          >
            {[
              { icon: Search, label: 'Transparency and provenance' },
              { icon: Layers, label: 'Composability across apps' },
              { icon: Database, label: 'Reusable knowledge assets' },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-6 text-center shadow-md"
              >
                <item.icon className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                <div className="font-semibold text-gray-900">{item.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Impact & Ecosystem - Enhanced */}
      <section className="py-24 bg-gradient-to-b from-blue-50 via-purple-50 to-white" id="impact" data-reveal>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <SectionBadge icon={TrendingUp} label="Impact" />
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Impact on the AI Ecosystem</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Parallelpedia creates measurable value for researchers, developers, and the broader AI community
            </p>
          </motion.div>
          
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-3 gap-8 mb-12"
          >
            {[
              { 
                icon: Shield, 
                title: 'Misinformation Defense', 
                desc: 'Detect and flag AI-generated misinformation before it spreads, protecting users from false information.',
                metric: 'Trust scores and conflict detection provide quantifiable verification metrics',
                gradient: 'from-red-50 to-rose-50',
                border: 'border-red-200'
              },
              { 
                icon: Brain, 
                title: 'AI Agent Trust Layer', 
                desc: 'AI agents can query Community Notes via MCP tools to make more informed decisions about content reliability.',
                metric: 'Improved accuracy through verifiable provenance and trust signals',
                gradient: 'from-blue-50 to-indigo-50',
                border: 'border-blue-200'
              },
              { 
                icon: Network, 
                title: 'Decentralized Knowledge', 
                desc: 'Creates an open, tamper-resistant knowledge graph that anyone can query and build upon.',
                metric: 'Enhanced ecosystem usability through discoverable Knowledge Assets',
                gradient: 'from-green-50 to-emerald-50',
                border: 'border-green-200'
              },
            ].map((impact, idx) => (
              <motion.div
                key={idx}
                variants={staggerItem}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`p-8 rounded-2xl border-2 ${impact.border} bg-gradient-to-br ${impact.gradient} shadow-lg hover:shadow-xl transition-all`}
              >
                <impact.icon className="w-12 h-12 text-gray-700 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">{impact.title}</h3>
                <p className="text-sm text-gray-700 mb-4 leading-relaxed">{impact.desc}</p>
                <div className="text-xs text-gray-600 bg-white/60 p-3 rounded-lg">
                  <strong>Measurable:</strong> {impact.metric}
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>


      {/* Architecture & Technical Details - Enhanced */}
      <section className="py-24 bg-white" id="architecture" data-reveal>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <SectionBadge icon={Code} label="Architecture" />
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Technical Architecture</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A full-stack system built with modern technologies and best practices
            </p>
          </motion.div>
          
          {/* Architecture Diagram - Light Theme */}
          <motion.div
            {...fadeInUp}
            className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 rounded-3xl p-10 md:p-16 shadow-2xl mb-12 border-2 border-blue-200"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-10 text-center">System Architecture</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Frontend',
                  color: 'blue',
                  items: ['React 18', 'TypeScript', 'Vite', 'TailwindCSS', 'React Router'],
                  icon: Code,
                  gradient: 'from-blue-100 to-blue-50'
                },
                {
                  title: 'Backend',
                  color: 'green',
                  items: ['FastAPI', 'Embeddings Engine', 'LLM Classifier', 'DKG Client', 'Python'],
                  icon: Cpu,
                  gradient: 'from-green-100 to-green-50'
                },
                {
                  title: 'DKG Integration',
                  color: 'purple',
                  items: ['Custom Plugin', 'MCP Tools', 'REST API', 'JSON-LD Assets', 'OriginTrail'],
                  icon: Network,
                  gradient: 'from-purple-100 to-purple-50'
                },
              ].map((stack, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className={`bg-gradient-to-br ${stack.gradient} rounded-2xl p-6 border-2 ${stack.color === 'blue' ? 'border-blue-200' : stack.color === 'green' ? 'border-green-200' : 'border-purple-200'} shadow-lg`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl ${stack.color === 'blue' ? 'bg-blue-600' : stack.color === 'green' ? 'bg-green-600' : 'bg-purple-600'} flex items-center justify-center`}>
                      <stack.icon className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">{stack.title}</h4>
                  </div>
                  <ul className="space-y-2">
                    {stack.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-center gap-2 text-gray-700 text-sm">
                        <div className={`w-2 h-2 rounded-full ${stack.color === 'blue' ? 'bg-blue-600' : stack.color === 'green' ? 'bg-green-600' : 'bg-purple-600'}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-center gap-4 text-gray-600 text-sm">
              <ArrowRight className="w-5 h-5" />
              <span className="font-semibold">Data Flow</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </motion.div>

          <motion.div
            {...fadeInUp}
            className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 p-10 shadow-lg"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Key Technical Features</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Code Quality & Documentation
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Comprehensive README files
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    TypeScript for type safety
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Clean architecture & separation of concerns
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Error handling & fallback systems
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-blue-600" />
                  Interoperability
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    RESTful API design
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    MCP protocol support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    JSON-LD/RDF standards
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    Discoverable Knowledge Assets
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ - Simplified */}
      <section className="py-24 bg-gray-50" data-reveal>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <SectionBadge icon={HelpCircle} label="FAQ" />
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          </motion.div>
          <div className="space-y-3">
            {[
              { 
                icon: Database,
                q: 'Where are the Community Notes stored?', 
                a: 'Community Notes are published as Knowledge Assets on the OriginTrail Decentralized Knowledge Graph (DKG). They are stored on-chain with full provenance and can be queried via our DKG plugin\'s MCP tools or REST API.' 
              },
              { 
                icon: FileText,
                q: 'Does Parallelpedia modify Wikipedia?', 
                a: 'No. Parallelpedia analyzes content and produces structured Community Notes; it does not modify source articles. It\'s a read-only analysis tool that creates verifiable trust signals.' 
              },
              { 
                icon: Network,
                q: 'What is DKG?', 
                a: 'DKG (Decentralized Knowledge Graph) is OriginTrail\'s blockchain-based system for creating verifiable, tamper-resistant knowledge assets. It enables AI agents and applications to access trusted, provenance-verified information.' 
              },
              { 
                icon: Brain,
                q: 'How do AI agents use this data?', 
                a: 'AI agents can query Community Notes via MCP (Model Context Protocol) tools. They can search by topic, trust score, or keywords to make informed decisions about content reliability before using it in their responses.' 
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:shadow-md overflow-hidden transition-all"
              >
                <button
                  className="w-full text-left p-5 font-semibold text-gray-900 flex items-center justify-between hover:bg-gray-50 transition-colors gap-4"
                  onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <item.icon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-base">{item.q}</span>
                  </div>
                  {openFaqIdx === idx ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFaqIdx === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-5 pb-5 pl-12"
                  >
                    <p className="text-sm text-gray-700 leading-relaxed">{item.a}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Enhanced */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden" data-reveal>
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
        <motion.div
          {...fadeInUp}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Audit Your First AI Article?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Type any topic and we'll show you how AI encyclopedias agree — or don't. Get instant trust scores and verifiable Community Notes.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/app')}
            className="px-10 py-5 rounded-xl bg-white text-blue-600 font-bold shadow-2xl hover:shadow-3xl transition-all text-lg"
          >
            Open Live App
          </motion.button>
          <div className="mt-10 text-sm text-blue-100">
            Built by Team Parallelpedia for the OriginTrail Scaling Trust & AI Hackathon
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <div className="font-medium text-gray-700">Parallelpedia — Auditing AI encyclopedias, one article at a time.</div>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <a 
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors" 
                href="/app"
              >
                <ExternalLink className="w-4 h-4" />
                Open App
              </a>
              <a 
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors" 
                href="https://github.com/denishotii/dkg-plugin-parallelpedia"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
              <a 
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-purple-600 transition-colors" 
                href="https://explorer.origintrail.io"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe className="w-4 h-4" />
                DKG Explorer
              </a>
              <a 
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-orange-600 transition-colors" 
                href="https://dorahacks.io"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4" />
                OriginTrail Scaling Trust & AI Hackathon
              </a>
            </div>
          </div>
          <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
            Built for the OriginTrail Scaling Trust & AI Hackathon
          </div>
        </div>
      </footer>
    </div>
  );
}
