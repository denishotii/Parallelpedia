import React from 'react';
import { SegmentComparison as SegmentComparisonType, SegmentLabel } from '../types';

interface SegmentComparisonProps {
  comparison: SegmentComparisonType;
}

export const SegmentComparison: React.FC<SegmentComparisonProps> = ({ comparison }) => {
  const getLabelColor = (label: SegmentLabel): string => {
    switch (label) {
      case SegmentLabel.ALIGNED:
        return 'bg-green-100 border-green-300 text-green-800';
      case SegmentLabel.MISSING_CONTEXT:
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case SegmentLabel.CONFLICT:
        return 'bg-red-100 border-red-300 text-red-800';
      case SegmentLabel.UNSUPPORTED:
        return 'bg-gray-100 border-gray-300 text-gray-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getLabelText = (label: SegmentLabel): string => {
    switch (label) {
      case SegmentLabel.ALIGNED:
        return '✓ Aligned';
      case SegmentLabel.MISSING_CONTEXT:
        return '⚠ Missing Context';
      case SegmentLabel.CONFLICT:
        return '✗ Conflict';
      case SegmentLabel.UNSUPPORTED:
        return '? Unsupported';
      default:
        return label;
    }
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 ${getLabelColor(comparison.label)}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm uppercase tracking-wide">
          {getLabelText(comparison.label)}
        </span>
        <span className="text-xs opacity-75">
          Similarity: {(comparison.similarity_score * 100).toFixed(1)}%
        </span>
      </div>
      <p className="text-sm mb-2">{comparison.text}</p>
      {comparison.matched_wiki_sentences && comparison.matched_wiki_sentences.length > 0 && (
        <div className="mt-2 pt-2 border-t border-current border-opacity-20">
          <p className="text-xs font-semibold mb-1">Matched Wikipedia:</p>
          {comparison.matched_wiki_sentences.map((sentence, idx) => (
            <p key={idx} className="text-xs opacity-90 italic">{sentence}</p>
          ))}
        </div>
      )}
    </div>
  );
};

