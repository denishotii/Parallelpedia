import React from 'react';
import { SegmentComparison, SegmentLabel } from '../types';

interface DifferenceTooltipProps {
  comparison: SegmentComparison;
  position: { x: number; y: number };
  onClose: () => void;
}

export const DifferenceTooltip: React.FC<DifferenceTooltipProps> = ({
  comparison,
  position,
  onClose
}) => {
  const getLabelInfo = (label: SegmentLabel) => {
    switch (label) {
      case SegmentLabel.CONFLICT:
        return {
          title: 'Conflict Detected',
          icon: '⚠️',
          color: 'red',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          textColor: 'text-red-800'
        };
      case SegmentLabel.MISSING_CONTEXT:
        return {
          title: 'Missing Context',
          icon: 'ℹ️',
          color: 'yellow',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-300',
          textColor: 'text-yellow-800'
        };
      case SegmentLabel.UNSUPPORTED:
        return {
          title: 'Unsupported',
          icon: '❓',
          color: 'gray',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-300',
          textColor: 'text-gray-800'
        };
      default:
        return {
          title: 'Difference',
          icon: '📝',
          color: 'blue',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-300',
          textColor: 'text-blue-800'
        };
    }
  };

  const labelInfo = getLabelInfo(comparison.label);

  // Calculate optimal position to keep tooltip on screen
  // position.x and position.y are in viewport coordinates (from getBoundingClientRect)
  // Since we're using 'fixed' positioning, these coordinates are already correct for the viewport
  const tooltipWidth = 384; // max-w-md = 28rem = 448px, but we'll use 384px for calculation
  const tooltipHeight = 250; // approximate height
  const margin = 10;
  const arrowHeight = 8;
  
  // position.x and position.y are already in viewport coordinates (from getBoundingClientRect)
  // 'fixed' positioning is also relative to viewport, so we can use them directly
  let left = position.x;
  let top = position.y - tooltipHeight - arrowHeight - margin;
  let transform = 'translate(-50%, -100%)';
  let isAbove = true; // Track if tooltip is above or below the highlighted text
  
  // Adjust if tooltip would go off the left edge
  if (left - tooltipWidth / 2 < margin) {
    left = tooltipWidth / 2 + margin;
  }
  
  // Adjust if tooltip would go off the right edge
  if (left + tooltipWidth / 2 > window.innerWidth - margin) {
    left = window.innerWidth - tooltipWidth / 2 - margin;
  }
  
  // If tooltip would go off the top, show it below instead
  if (top < margin) {
    top = position.y + arrowHeight + margin;
    transform = 'translate(-50%, 0)';
    isAbove = false;
  }
  
  // Ensure tooltip doesn't go off bottom of viewport
  const maxTop = window.innerHeight - tooltipHeight - margin;
  if (top > maxTop) {
    top = Math.max(margin, position.y - tooltipHeight - arrowHeight - margin);
  }

  return (
    <div
      className="fixed z-50 max-w-md pointer-events-auto"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        transform: transform
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className={`${labelInfo.bgColor} ${labelInfo.borderColor} ${labelInfo.textColor} border-2 rounded-lg shadow-xl p-4 relative`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{labelInfo.icon}</span>
          <h4 className="font-bold text-sm uppercase tracking-wide">
            {labelInfo.title}
          </h4>
          <span className="ml-auto text-xs opacity-75">
            {(comparison.similarity_score * 100).toFixed(0)}% similar
          </span>
        </div>

        {/* Grokipedia text */}
        <div className="mb-3">
          <div className="text-xs font-semibold mb-1 opacity-75">Grokipedia:</div>
          <div className="text-sm bg-white rounded p-2 border border-gray-200">
            {comparison.text}
          </div>
        </div>

        {/* Wikipedia comparison */}
        {comparison.matched_wiki_sentences && comparison.matched_wiki_sentences.length > 0 && (
          <div>
            <div className="text-xs font-semibold mb-1 opacity-75">Wikipedia:</div>
            <div className="text-sm bg-white rounded p-2 border border-gray-200 space-y-1">
              {comparison.matched_wiki_sentences.map((sentence, idx) => (
                <div key={idx} className="italic text-gray-700">
                  {sentence}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Arrow pointing to highlighted text */}
        {isAbove ? (
          // Arrow pointing down (tooltip is above the text)
          <div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0"
            style={{
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: `8px solid ${labelInfo.color === 'red' ? '#fca5a5' : labelInfo.color === 'yellow' ? '#fde047' : '#d1d5db'}`
            }}
          />
        ) : (
          // Arrow pointing up (tooltip is below the text)
          <div
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full w-0 h-0"
            style={{
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: `8px solid ${labelInfo.color === 'red' ? '#fca5a5' : labelInfo.color === 'yellow' ? '#fde047' : '#d1d5db'}`
            }}
          />
        )}
      </div>
    </div>
  );
};

