import React, { useState } from 'react';
import { compareTopic, publishCommunityNote } from './services/api';
import { TopicAnalysis, Article, ArticleSource } from './types';
import { TrustScore } from './components/TrustScore';
import { SegmentComparison } from './components/SegmentComparison';
import { ArticleView } from './components/ArticleView';

function App() {
  const [topicId, setTopicId] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<TopicAnalysis | null>(null);
  const [grokArticle, setGrokArticle] = useState<Article | null>(null);
  const [wikiArticle, setWikiArticle] = useState<Article | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const handleCompare = async () => {
    if (!topicId.trim()) return;

    setLoading(true);
    setAnalysis(null);
    setPublished(false);
    setGrokArticle(null);
    setWikiArticle(null);

    try {
      // First, fetch both articles separately to display them
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const [grokResponse, wikiResponse] = await Promise.all([
        fetch(`${apiUrl}/api/topics/${encodeURIComponent(topicId.trim())}/grok`).catch(() => null),
        fetch(`${apiUrl}/api/topics/${encodeURIComponent(topicId.trim())}/wikipedia`).catch(() => null)
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
      const result = await compareTopic(topicId.trim());
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
      await publishCommunityNote(analysis.topic_id);
      setPublished(true);
    } catch (error) {
      console.error('Error publishing:', error);
      alert('Error publishing Community Note. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-gray-900">Parallelpedia</h1>
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
            <input
              type="text"
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCompare()}
              placeholder="Enter topic (e.g., 'Climate_change', 'Artificial_intelligence')"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleCompare}
              disabled={loading || !topicId.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? 'Comparing...' : 'Compare'}
            </button>
          </div>
        </div>

        {/* Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Trust Score and Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Analysis Results</h2>
                <TrustScore score={analysis.trust_score} size="lg" />
              </div>
              <p className="text-gray-700 mb-4">{analysis.summary}</p>
              
              {/* Label Counts */}
              <div className="grid grid-cols-4 gap-4 mt-4">
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

              {/* Publish Button */}
              <div className="mt-6">
                <button
                  onClick={handlePublish}
                  disabled={publishing || published}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                >
                  {published
                    ? '✓ Published to DKG'
                    : publishing
                    ? 'Publishing...'
                    : 'Publish Community Note to DKG'}
                </button>
              </div>
            </div>

            {/* Side-by-Side Comparison */}
            {grokArticle && wikiArticle && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Article Comparison</h3>
                <div className="grid grid-cols-2 gap-6">
                  <ArticleView article={grokArticle} title="Grokipedia" />
                  <ArticleView article={wikiArticle} title="Wikipedia" />
                </div>
              </div>
            )}

            {/* Segment Comparisons */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Detailed Segment Analysis
              </h3>
              <div className="space-y-4">
                {analysis.segment_comparisons.map((comparison) => (
                  <SegmentComparison key={comparison.segment_id} comparison={comparison} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!analysis && !loading && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Enter a topic above to start comparing</p>
            <p className="text-sm mt-2">
              Try topics like: "Climate_change", "Artificial_intelligence", "Quantum_mechanics"
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

