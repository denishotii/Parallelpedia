import React, { useEffect, useRef, useState } from 'react';
import { SegmentComparison, SegmentLabel } from '../types';

interface DifferenceTooltipProps {
  comparison: SegmentComparison;
  anchorElement: HTMLElement | null;
  onClose: () => void;
}

export const DifferenceTooltip: React.FC<DifferenceTooltipProps> = ({
  comparison,
  anchorElement,
  onClose
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; placement: 'top' | 'bottom' } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!anchorElement) {
      setPosition(null);
      setIsVisible(false);
      return;
    }

    // Reset position when anchor changes
    setPosition(null);
    setIsVisible(false);

    const updatePosition = () => {
      if (!anchorElement || !tooltipRef.current) return;

      const anchorRect = anchorElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 12;
      const gap = 8;

      // Calculate horizontal position (centered on anchor)
      let left = anchorRect.left + (anchorRect.width / 2) - (tooltipRect.width / 2);
      
      // Keep tooltip within viewport horizontally
      if (left < margin) {
        left = margin;
      } else if (left + tooltipRect.width > viewportWidth - margin) {
        left = viewportWidth - tooltipRect.width - margin;
      }

      // Try to place above first
      let top = anchorRect.top - tooltipRect.height - gap;
      let placement: 'top' | 'bottom' = 'top';

      // If not enough space above, place below
      if (top < margin) {
        top = anchorRect.bottom + gap;
        placement = 'bottom';
      }

      // Ensure tooltip doesn't go off bottom
      if (top + tooltipRect.height > viewportHeight - margin) {
        top = viewportHeight - tooltipRect.height - margin;
      }

      setPosition({ top, left, placement });
      setIsVisible(true);
    };

    // First render: measure tooltip, then position
    // Use double RAF to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (tooltipRef.current && anchorElement) {
          updatePosition();
        }
      });
    });

    // Throttled update on scroll/resize for better performance
    let updateRaf: number | null = null;
    const handleUpdate = () => {
      if (updateRaf) return;
      updateRaf = requestAnimationFrame(() => {
        updatePosition();
        updateRaf = null;
      });
    };

    // Only listen to window scroll/resize - more performant
    window.addEventListener('scroll', handleUpdate, { passive: true, capture: true });
    window.addEventListener('resize', handleUpdate, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
      if (updateRaf) {
        cancelAnimationFrame(updateRaf);
      }
    };
  }, [anchorElement]);

  const getLabelInfo = (label: SegmentLabel) => {
    switch (label) {
      case SegmentLabel.CONFLICT:
        return {
          title: 'Conflict Detected',
          icon: '⚠️',
          gradient: 'from-red-500 to-red-600',
          bgGradient: 'from-red-50 to-red-100',
          borderColor: 'border-red-200',
          textColor: 'text-red-900',
          badgeColor: 'bg-red-100 text-red-700'
        };
      case SegmentLabel.MISSING_CONTEXT:
        return {
          title: 'Missing Context',
          icon: 'ℹ️',
          gradient: 'from-amber-500 to-amber-600',
          bgGradient: 'from-amber-50 to-amber-100',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-900',
          badgeColor: 'bg-amber-100 text-amber-700'
        };
      case SegmentLabel.UNSUPPORTED:
        return {
          title: 'Unsupported',
          icon: '❓',
          gradient: 'from-slate-500 to-slate-600',
          bgGradient: 'from-slate-50 to-slate-100',
          borderColor: 'border-slate-200',
          textColor: 'text-slate-900',
          badgeColor: 'bg-slate-100 text-slate-700'
        };
      default:
        return {
          title: 'Difference',
          icon: '📝',
          gradient: 'from-blue-500 to-blue-600',
          bgGradient: 'from-blue-50 to-blue-100',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-900',
          badgeColor: 'bg-blue-100 text-blue-700'
        };
    }
  };

  const labelInfo = getLabelInfo(comparison.label);
  const similarity = Math.round(comparison.similarity_score * 100);

  // Don't render until we have a position calculated
  if (!position) {
    return (
      <div
        ref={tooltipRef}
        className="fixed z-[10000] w-96 pointer-events-none opacity-0"
        style={{
          top: '-9999px',
          left: '-9999px',
        }}
      >
        <div
          className={`bg-gradient-to-br ${labelInfo.bgGradient} ${labelInfo.borderColor} border rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm`}
        >
          {/* Header with gradient */}
          <div className={`bg-gradient-to-r ${labelInfo.gradient} px-4 py-3 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{labelInfo.icon}</span>
              <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                {labelInfo.title}
              </h3>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Similarity Score</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${labelInfo.badgeColor}`}>
                {similarity}%
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-1 h-4 bg-gradient-to-b ${labelInfo.gradient} rounded-full`}></div>
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Grokipedia</span>
              </div>
              <div className="bg-white/80 rounded-lg p-3 border border-gray-200/50 shadow-sm">
                <p className="text-sm text-gray-800 leading-relaxed">{comparison.text}</p>
              </div>
            </div>
            {comparison.matched_wiki_sentences && comparison.matched_wiki_sentences.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Wikipedia</span>
                </div>
                <div className="bg-white/80 rounded-lg p-3 border border-gray-200/50 shadow-sm space-y-2">
                  {comparison.matched_wiki_sentences.map((sentence, idx) => (
                    <p key={idx} className="text-sm text-gray-700 leading-relaxed italic">
                      {sentence}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={tooltipRef}
      className={`fixed z-[10000] w-96 pointer-events-auto transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className={`bg-gradient-to-br ${labelInfo.bgGradient} ${labelInfo.borderColor} border rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm`}
      >
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${labelInfo.gradient} px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{labelInfo.icon}</span>
            <h3 className="font-bold text-white text-sm uppercase tracking-wide">
              {labelInfo.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1 rounded hover:bg-white/20"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Similarity badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Similarity Score</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${labelInfo.badgeColor}`}>
              {similarity}%
            </span>
          </div>

          {/* Grokipedia text */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-1 h-4 bg-gradient-to-b ${labelInfo.gradient} rounded-full`}></div>
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Grokipedia</span>
            </div>
            <div className="bg-white/80 rounded-lg p-3 border border-gray-200/50 shadow-sm">
              <p className="text-sm text-gray-800 leading-relaxed">{comparison.text}</p>
            </div>
          </div>

          {/* Wikipedia comparison */}
          {comparison.matched_wiki_sentences && comparison.matched_wiki_sentences.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Wikipedia</span>
              </div>
              <div className="bg-white/80 rounded-lg p-3 border border-gray-200/50 shadow-sm space-y-2">
                {comparison.matched_wiki_sentences.map((sentence, idx) => (
                  <p key={idx} className="text-sm text-gray-700 leading-relaxed italic">
                    {sentence}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Arrow pointing to anchor */}
          <div
            className={`absolute ${position.placement === 'top' ? 'bottom-0' : 'top-0'} left-1/2 transform -translate-x-1/2 ${position.placement === 'top' ? 'translate-y-full' : '-translate-y-full'}`}
          >
            {position.placement === 'top' ? (
              <div
                className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent"
                style={{
                  borderTopColor: labelInfo.gradient.includes('red') 
                    ? '#fef2f2' 
                    : labelInfo.gradient.includes('amber') 
                    ? '#fffbeb' 
                    : '#f8fafc'
                }}
              />
            ) : (
              <div
                className="w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent"
                style={{
                  borderBottomColor: labelInfo.gradient.includes('red') 
                    ? '#fef2f2' 
                    : labelInfo.gradient.includes('amber') 
                    ? '#fffbeb' 
                    : '#f8fafc'
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
