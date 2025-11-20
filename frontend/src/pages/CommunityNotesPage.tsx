import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Network, ExternalLink, Calendar, TrendingUp, 
  AlertCircle, CheckCircle2, Info, Loader2
} from 'lucide-react';
import { getAllCommunityNotes, CommunityNoteListItem } from '../services/api';
import logoFull from '../logo/logo-with-name.svg';
import { Link } from 'react-router-dom';

const formatTopicName = (topic: string) => {
  return topic.replace(/_/g, ' ');
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'Unknown date';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

const getDkgExplorerUrl = (ual: string | null) => {
  if (!ual) return null;
  return `https://dkg-testnet.origintrail.io/explore?ual=${encodeURIComponent(ual)}`;
};

const CommunityNoteCard: React.FC<{ note: CommunityNoteListItem; index: number }> = ({ note, index }) => {
  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return { accent: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
    if (score >= 60) return { accent: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' };
    if (score >= 40) return { accent: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    return { accent: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
  };

  const colors = getTrustScoreColor(note.trustScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-purple-300 overflow-hidden"
    >
      {/* Accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${colors.accent}`} />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-4 min-w-0">
            <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors truncate">
              {formatTopicName(note.topicId)}
            </h3>
            
            {/* Comparison Badge */}
            {note.grokTitle && note.wikiTitle && (
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 mb-2">
                <span className="text-xs font-medium text-purple-600">{note.grokTitle}</span>
                <span className="text-gray-300">•</span>
                <span className="text-xs font-medium text-blue-600">{note.wikiTitle}</span>
              </div>
            )}
            
            {/* Date */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(note.createdAt)}</span>
            </div>
          </div>
          
          {/* Trust Score Badge */}
          <div className={`flex-shrink-0 w-16 h-16 rounded-full ${colors.bg} ${colors.border} border-2 flex flex-col items-center justify-center shadow-sm`}>
            <div className={`text-xl font-bold ${colors.text}`}>
              {Math.round(note.trustScore)}
            </div>
            <div className="text-[10px] text-gray-500 font-medium">/100</div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-5">
          <p className="text-gray-700 leading-relaxed text-sm line-clamp-2">
            {note.summary || 'No summary available'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
          {note.ual && getDkgExplorerUrl(note.ual) && (
            <a
              href={getDkgExplorerUrl(note.ual)!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-xs shadow-sm hover:shadow"
            >
              <Network className="w-3.5 h-3.5" />
              <span>DKG</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <Link
            to={`/app?topic=${encodeURIComponent(note.topicId)}`}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-xs border border-gray-300 hover:border-blue-400 hover:text-blue-700"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Details</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default function CommunityNotesPage() {
  const [notes, setNotes] = useState<CommunityNoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'trust'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getAllCommunityNotes();
        if (response.found && response.notes) {
          setNotes(response.notes);
        } else {
          setNotes([]);
        }
      } catch (err: any) {
        console.error('Error fetching community notes:', err);
        setError(err?.message || 'Failed to fetch community notes');
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const getFilteredAndSortedNotes = () => {
    let filtered = [...notes];

    // Filter by trust score
    if (filterBy === 'high') {
      filtered = filtered.filter(n => n.trustScore >= 80);
    } else if (filterBy === 'medium') {
      filtered = filtered.filter(n => n.trustScore >= 60 && n.trustScore < 80);
    } else if (filterBy === 'low') {
      filtered = filtered.filter(n => n.trustScore < 60);
    }

    // Sort
    if (sortBy === 'date') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA; // Newest first
      });
    } else if (sortBy === 'trust') {
      filtered.sort((a, b) => b.trustScore - a.trustScore);
    }

    return filtered;
  };

  const filteredNotes = getFilteredAndSortedNotes();

  const stats = {
    total: notes.length,
    high: notes.filter(n => n.trustScore >= 80).length,
    medium: notes.filter(n => n.trustScore >= 60 && n.trustScore < 80).length,
    low: notes.filter(n => n.trustScore < 60).length,
    average: notes.length > 0 
      ? (notes.reduce((sum, n) => sum + n.trustScore, 0) / notes.length).toFixed(1)
      : '0',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/app">
                <img src={logoFull} alt="Parallelpedia" className="h-10 md:h-12 w-auto" />
              </Link>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">beta</span>
            </div>
            <Link
              to="/app"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Back to Search
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Network className="w-10 h-10 text-purple-600" />
            Community Notes
          </h1>
          <p className="text-lg text-gray-600">
            Explore all verified Community Notes published to the Decentralized Knowledge Graph
          </p>
        </div>

        {/* Stats Cards */}
        {!loading && notes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-4 border-2 border-gray-200"
            >
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600 mt-1">Total Notes</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-md p-4 border-2 border-green-200"
            >
              <div className="text-3xl font-bold text-green-600">{stats.high}</div>
              <div className="text-sm text-gray-600 mt-1">High Trust (≥80)</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-md p-4 border-2 border-yellow-200"
            >
              <div className="text-3xl font-bold text-yellow-600">{stats.medium}</div>
              <div className="text-sm text-gray-600 mt-1">Medium (60-79)</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-md p-4 border-2 border-red-200"
            >
              <div className="text-3xl font-bold text-red-600">{stats.low}</div>
              <div className="text-sm text-gray-600 mt-1">Low Trust (&lt;60)</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow-md p-4 border-2 border-blue-200"
            >
              <div className="text-3xl font-bold text-blue-600">{stats.average}</div>
              <div className="text-sm text-gray-600 mt-1">Avg Trust Score</div>
            </motion.div>
          </div>
        )}

        {/* Filters and Sort */}
        {!loading && notes.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <div className="flex gap-2">
                {(['all', 'high', 'medium', 'low'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setFilterBy(filter)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      filterBy === filter
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter === 'all' ? 'All' : filter === 'high' ? 'High' : filter === 'medium' ? 'Medium' : 'Low'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('date')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === 'date'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Date
                </button>
                <button
                  onClick={() => setSortBy('trust')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === 'trust'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Trust Score
                </button>
              </div>
            </div>
            <div className="ml-auto text-sm text-gray-600">
              Showing {filteredNotes.length} of {notes.length} notes
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
            <p className="text-gray-600 text-lg">Loading community notes...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-1">Error Loading Community Notes</h3>
                <p className="text-red-700">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && notes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-12 text-center"
          >
            <Network className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Community Notes Yet</h3>
            <p className="text-gray-600 mb-6">
              Community notes will appear here once they are published to the DKG.
            </p>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <TrendingUp className="w-5 h-5" />
              <span>Create Your First Community Note</span>
            </Link>
          </motion.div>
        )}

        {/* Notes Grid */}
        {!loading && !error && filteredNotes.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredNotes.map((note, index) => (
              <CommunityNoteCard key={note.ual || note.topicId || index} note={note} index={index} />
            ))}
          </div>
        )}

        {/* No Results for Filter */}
        {!loading && !error && notes.length > 0 && filteredNotes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-12 text-center"
          >
            <CheckCircle2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Notes Match Your Filter</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filter settings to see more community notes.
            </p>
            <button
              onClick={() => setFilterBy('all')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Show All Notes
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}

