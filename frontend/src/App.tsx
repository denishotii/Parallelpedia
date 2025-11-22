import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, Scale, Network, ArrowRight, CheckCircle2, ExternalLink, Copy, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { compareTopic, publishCommunityNote } from './services/api';
import { TopicAnalysis, Article, SegmentLabel } from './types';
import { TrustScore } from './components/TrustScore';
import logoFull from './logo/logo-with-name.svg';
import { SegmentComparison } from './components/SegmentComparison';
import { HighlightedArticleView } from './components/HighlightedArticleView';

// Helper to format topic names
const formatTopicName = (topic: string) => {
  return topic.replace(/_/g, ' ');
};

function App() {
  const [searchParams] = useSearchParams();
  const [topicId, setTopicId] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<TopicAnalysis | null>(null);
  const [grokArticle, setGrokArticle] = useState<Article | null>(null);
  const [wikiArticle, setWikiArticle] = useState<Article | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishedUal, setPublishedUal] = useState<string | null>(null);
  type AnalysisTab = 'evidence' | 'conflicts' | 'alignments';
  const [activeTab, setActiveTab] = useState<AnalysisTab>('evidence');
  
  // Refs for synchronized scrolling
  const grokContainerRef = useRef<HTMLDivElement>(null);
  const wikiContainerRef = useRef<HTMLDivElement>(null);

  // Handle topic query parameter
  useEffect(() => {
    const topicParam = searchParams.get('topic');
    if (topicParam && !analysis) {
      setTopicId(topicParam);
      // Auto-trigger comparison after a short delay
      const timer = setTimeout(async () => {
        const topicToCompare = topicParam;
        if (!topicToCompare) return;

        setLoading(true);
        setAnalysis(null);
        setPublished(false);
        setPublishedUal(null);
        setGrokArticle(null);
        setWikiArticle(null);

        try {
          const apiUrl = (import.meta as any).env?.VITE_API_URL || '';
          
          const [grokResponse, wikiResponse] = await Promise.all([
            fetch(`${apiUrl}/api/topics/${encodeURIComponent(topicToCompare)}/grok`).catch(() => null),
            fetch(`${apiUrl}/api/topics/${encodeURIComponent(topicToCompare)}/wikipedia`).catch(() => null)
          ]);

          if (grokResponse && grokResponse.ok) {
            const grokData = await grokResponse.json();
            setGrokArticle(grokData);
          }
          
          if (wikiResponse && wikiResponse.ok) {
            const wikiData = await wikiResponse.json();
            setWikiArticle(wikiData);
          }

          const result = await compareTopic(topicToCompare);
          setAnalysis(result);
          
          setGrokArticle(prev => prev ? { ...prev, title: result.grok_title } : null);
          setWikiArticle(prev => prev ? { ...prev, title: result.wiki_title } : null);
        } catch (error: any) {
          console.error('Error comparing topic:', error);
          const errorMessage = error?.message || 'Unknown error occurred';
          alert(`Error comparing topic: ${errorMessage}\n\nPlease check:\n- Topic ID is correct (e.g., "Climate_change")\n- Backend is running\n- Articles exist on both platforms`);
        } finally {
          setLoading(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, analysis]);

  const handleCompare = async (topic?: string) => {
    const topicToCompare = topic || topicId.trim();
    if (!topicToCompare) return;

    setLoading(true);
    setAnalysis(null);
    setPublished(false);
    setPublishedUal(null);
    setGrokArticle(null);
    setWikiArticle(null);

    try {
      // First, fetch both articles separately to display them
      const apiUrl = (import.meta as any).env?.VITE_API_URL || '';
      
      const [grokResponse, wikiResponse] = await Promise.all([
        fetch(`${apiUrl}/api/topics/${encodeURIComponent(topicToCompare)}/grok`).catch(() => null),
        fetch(`${apiUrl}/api/topics/${encodeURIComponent(topicToCompare)}/wikipedia`).catch(() => null)
      ]);

      // Set articles if available
      if (grokResponse && grokResponse.ok) {
        const grokData = await grokResponse.json();
        setGrokArticle(grokData);
      }
      
      if (wikiResponse && wikiResponse.ok) {
        const wikiData = await wikiResponse.json();
        setWikiArticle(wikiData);
      }

      // Then run comparison
      const result = await compareTopic(topicToCompare);
      setAnalysis(result);
      
      // Update articles with titles from analysis if we have them
      setGrokArticle(prev => prev ? { ...prev, title: result.grok_title } : null);
      setWikiArticle(prev => prev ? { ...prev, title: result.wiki_title } : null);
    } catch (error: any) {
      console.error('Error comparing topic:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`Error comparing topic: ${errorMessage}\n\nPlease check:\n- Topic ID is correct (e.g., "Climate_change")\n- Backend is running\n- Articles exist on both platforms`);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!analysis) return;

    setPublishing(true);
    try {
      const response = await publishCommunityNote(analysis.topic_id);
      setPublished(true);
      setPublishedUal(response.ual || response.asset_id || null);
    } catch (error) {
      console.error('Error publishing:', error);
      alert('Error publishing Community Note. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here if desired
  };

  const getDkgExplorerUrl = (ual: string) => {
    return `https://dkg-testnet.origintrail.io/explore?ual=${encodeURIComponent(ual)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <img src={logoFull} alt="Parallelpedia" className="h-10 md:h-12 w-auto cursor-pointer hover:opacity-80 transition-opacity" />
              </Link>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">beta</span>
            </div>
            <Link
              to="/community-notes"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors flex items-center gap-2"
            >
              <Network className="w-4 h-4" />
              <span>Community Notes</span>
            </Link>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Auditing AI encyclopedias, one article at a time.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCompare()}
                placeholder="Enter topic (e.g., 'Climate change', 'Artificial intelligence')"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
              />
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                </motion.div>
              )}
            </div>
            <button
              onClick={() => handleCompare()}
              disabled={loading || !topicId.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-all flex items-center gap-2 min-w-[120px] justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Comparing...</span>
                </>
              ) : (
                'Compare'
              )}
            </button>
          </div>
          
          {/* Loading Animation Overlay */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <div className="flex flex-col items-center justify-center py-8">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Scale className="w-8 h-8 text-white" />
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-blue-200"
                    animate={{ 
                      scale: [1, 1.5, 1.5],
                      opacity: [0.5, 0, 0]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-purple-200"
                    animate={{ 
                      scale: [1, 1.3, 1.3],
                      opacity: [0.5, 0, 0]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      delay: 0.3,
                      ease: "easeOut"
                    }}
                  />
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 text-lg font-semibold text-gray-700"
                >
                  Analyzing articles...
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-2 text-sm text-gray-500"
                >
                  Comparing content from Grokipedia and Wikipedia
                </motion.p>
                <div className="mt-6 w-full max-w-md">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Trust Score and Summary + Overview */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Analysis Results</h2>
                <TrustScore score={analysis.trust_score} size="lg" />
              </div>
              <p className="text-gray-700 mb-4">{analysis.summary}</p>
              {/* Label Counts */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analysis.labels_count.aligned || 0}
                  </div>
                  <div className="text-xs text-green-700 mt-1">Aligned</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {analysis.labels_count.missing_context || 0}
                  </div>
                  <div className="text-xs text-yellow-700 mt-1">Missing Context</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {analysis.labels_count.conflict || 0}
                  </div>
                  <div className="text-xs text-red-700 mt-1">Conflicts</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {analysis.labels_count.unsupported || 0}
                  </div>
                  <div className="text-xs text-gray-700 mt-1">Unsupported</div>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <button
                  onClick={handlePublish}
                  disabled={publishing || published}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
                >
                  {published
                    ? '✓ Published to DKG'
                    : publishing
                    ? 'Publishing...'
                    : 'Publish Community Note to DKG'}
                </button>
                
                {/* Success Message with UAL */}
                {published && publishedUal && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border-2 border-green-200 rounded-lg p-5 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-green-900 mb-2">
                          Successfully Published to DKG!
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Unique Asset Locator (UAL):</p>
                            <div className="flex items-center gap-2 bg-white rounded-md p-2 border border-gray-200">
                              <code className="flex-1 text-sm text-gray-800 font-mono break-all">
                                {publishedUal}
                              </code>
                              <button
                                onClick={() => copyToClipboard(publishedUal)}
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                title="Copy UAL"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div>
                            <a
                              href={getDkgExplorerUrl(publishedUal)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                            >
                              <span>View on DKG Explorer</span>
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Articles always visible */}
            {grokArticle && wikiArticle && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Article Comparison</h3>
                <div className="grid grid-cols-2 gap-6">
                  <HighlightedArticleView
                    article={grokArticle}
                    title="Grokipedia"
                    comparisons={analysis?.segment_comparisons || []}
                    source="grok"
                    scrollContainerRef={wikiContainerRef}
                    containerRef={grokContainerRef}
                    syncScroll={true}
                  />
                  <HighlightedArticleView
                    article={wikiArticle}
                    title="Wikipedia"
                    comparisons={analysis?.segment_comparisons || []}
                    source="wiki"
                    scrollContainerRef={grokContainerRef}
                    containerRef={wikiContainerRef}
                    syncScroll={true}
                  />
                </div>
              </div>
            )}

            {/* Tabs: Evidence / Conflicts / Alignments */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="flex items-center gap-6 px-6 border-b">
                {(['evidence','conflicts','alignments'] as AnalysisTab[]).map((tab) => {
                  const counts = analysis.labels_count || {};
                  const total =
                    (counts.aligned || 0) +
                    (counts.missing_context || 0) +
                    (counts.conflict || 0) +
                    (counts.unsupported || 0);
                  const label =
                    tab === 'evidence'
                      ? `Evidence (${total})`
                      : tab === 'conflicts'
                      ? `Conflicts (${counts.conflict || 0})`
                      : `Alignments (${counts.aligned || 0})`;
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                        isActive
                          ? 'border-purple-600 text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="p-6">
                {activeTab === 'evidence' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Detailed Segment Analysis</h3>
                    <div className="space-y-4">
                      {analysis.segment_comparisons.map((comparison) => (
                        <SegmentComparison key={comparison.segment_id} comparison={comparison} />
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'conflicts' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Conflicting Segments</h3>
                    <div className="space-y-4">
                      {analysis.segment_comparisons
                        .filter((c) => c.label === SegmentLabel.CONFLICT)
                        .map((comparison) => (
                          <SegmentComparison key={comparison.segment_id} comparison={comparison} />
                        ))}
                    </div>
                  </div>
                )}
                {activeTab === 'alignments' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Aligned Segments</h3>
                    <div className="space-y-4">
                      {analysis.segment_comparisons
                        .filter((c) => c.label === SegmentLabel.ALIGNED)
                        .map((comparison) => (
                          <SegmentComparison key={comparison.segment_id} comparison={comparison} />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty State - Enhanced */}
        {!analysis && !loading && (
          <div className="space-y-12">
            {/* How It Works */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                {[
                  { num: 1, icon: Search, title: 'Search a topic', desc: 'Type an AI encyclopedia topic' },
                  { num: 2, icon: Scale, title: 'Compare articles', desc: 'We compute a trust score' },
                  { num: 3, icon: Network, title: 'Publish to DKG', desc: 'Generate verifiable Community Notes' },
                ].map((step, idx) => (
                  <React.Fragment key={idx}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.2 }}
                      className="flex flex-col items-center text-center p-6 bg-white rounded-xl border-2 border-blue-200 shadow-lg min-w-[200px]"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-md">
                          {step.num}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <step.icon className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                      <p className="text-sm text-gray-600">{step.desc}</p>
                    </motion.div>
                    {idx < 2 && (
                      <ArrowRight className="w-6 h-6 text-blue-400 hidden md:block flex-shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Try Examples */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Try It With One Click</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {['Elon_Musk', 'Artificial_intelligence', 'Climate_change'].map((topic, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setTopicId(topic);
                      handleCompare(topic);
                    }}
                    className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    {formatTopicName(topic)}
                  </motion.button>
                ))}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

export default App;

