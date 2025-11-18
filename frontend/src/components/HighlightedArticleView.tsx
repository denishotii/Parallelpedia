import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Article, SegmentComparison, SegmentLabel } from '../types';
import {
  createHighlightedSegments,
  splitTextWithHighlights,
  HighlightedSegment
} from '../utils/textHighlighting';
import { DifferenceTooltip } from './DifferenceTooltip';

interface HighlightedArticleViewProps {
  article: Article;
  title: string;
  comparisons?: SegmentComparison[];
  source?: 'grok' | 'wiki';
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  onScroll?: (scrollTop: number) => void;
  syncScroll?: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export const HighlightedArticleView: React.FC<HighlightedArticleViewProps> = ({
  article,
  title,
  comparisons = [],
  source = 'grok',
  scrollContainerRef,
  onScroll,
  syncScroll = false,
  containerRef: externalContainerRef
}) => {
  const [activeSegment, setActiveSegment] = useState<HighlightedSegment | null>(null);
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const segmentRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = externalContainerRef || internalContainerRef;
  const isScrollingRef = useRef(false);

  // Create highlighted segments
  const highlightedSegments = comparisons
    ? createHighlightedSegments(article.raw_text, comparisons, source)
    : [];

  // Split text into paragraphs
  const splitParagraphs = (text: string): string[] => {
    let paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    if (paragraphs.length <= 1) {
      paragraphs = text.split(/\n+/).filter(p => p.trim().length > 20);
    }
    
    if (paragraphs.length <= 1) {
      paragraphs = text.split(/[.!?]+\s+/).filter(p => p.trim().length > 50);
    }
    
    return paragraphs.length > 0 ? paragraphs : [text];
  };

  const paragraphs = splitParagraphs(article.raw_text);

  // Get highlight color for a segment
  const getHighlightColor = (label: SegmentLabel): string => {
    switch (label) {
      case SegmentLabel.CONFLICT:
        return 'bg-red-100 hover:bg-red-200 border-b-2 border-red-500 cursor-pointer transition-all duration-200 rounded-sm px-0.5 font-medium';
      case SegmentLabel.MISSING_CONTEXT:
        return 'bg-yellow-100 hover:bg-yellow-200 border-b-2 border-yellow-500 cursor-pointer transition-all duration-200 rounded-sm px-0.5 font-medium';
      case SegmentLabel.UNSUPPORTED:
        return 'bg-gray-100 hover:bg-gray-200 border-b-2 border-gray-500 cursor-pointer transition-all duration-200 rounded-sm px-0.5 font-medium';
      case SegmentLabel.ALIGNED:
        return 'bg-green-100 hover:bg-green-200 border-b-2 border-green-500 cursor-pointer transition-all duration-200 rounded-sm px-0.5 font-medium';
      default:
        return 'bg-blue-100 hover:bg-blue-200 border-b-2 border-blue-500 cursor-pointer transition-all duration-200 rounded-sm px-0.5 font-medium';
    }
  };

  // Handle segment click
  const handleSegmentClick = (segment: HighlightedSegment, element: HTMLSpanElement, event: React.MouseEvent) => {
    if (source !== 'grok') return;

    event.stopPropagation();
    event.preventDefault();

    // Toggle: if same segment, close it; otherwise open new one
    if (activeSegment?.comparison.segment_id === segment.comparison.segment_id) {
      setActiveSegment(null);
      setAnchorElement(null);
    } else {
      setActiveSegment(segment);
      setAnchorElement(element);
    }
  };

  // Handle segment hover
  const handleSegmentHover = (segment: HighlightedSegment, element: HTMLSpanElement, event: React.MouseEvent) => {
    if (source !== 'grok') return;
    
    // Only show on hover if no tooltip is currently open
    if (!activeSegment) {
      setActiveSegment(segment);
      setAnchorElement(element);
    }
    
    event.stopPropagation();
  };

  // Close tooltip
  const closeTooltip = () => {
    setActiveSegment(null);
    setAnchorElement(null);
  };

  // Close tooltip on outside click or Escape
  useEffect(() => {
    if (!activeSegment) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest('[data-tooltip]') &&
        !target.closest('[data-highlighted-segment]')
      ) {
        closeTooltip();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeTooltip();
      }
    };

    // Small delay to avoid immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
    }, 10);

    document.addEventListener('keydown', handleEscape);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [activeSegment]);

  // Handle scroll synchronization
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !syncScroll || !scrollContainerRef?.current) return;

    const targetContainer = scrollContainerRef.current;
    let rafId: number | null = null;
    let lastScrollTop = container.scrollTop;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      
      if (Math.abs(currentScrollTop - lastScrollTop) < 1) {
        return;
      }
      
      lastScrollTop = currentScrollTop;
      
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      if (!isScrollingRef.current) {
        rafId = requestAnimationFrame(() => {
          if (!isScrollingRef.current && targetContainer) {
            isScrollingRef.current = true;
            targetContainer.scrollTop = currentScrollTop;
            requestAnimationFrame(() => {
              isScrollingRef.current = false;
            });
          }
        });
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [syncScroll, scrollContainerRef, containerRef]);

  // Render highlighted text for a paragraph
  const renderHighlightedParagraph = (paragraphText: string, paragraphIndex: number) => {
    let paragraphStart = -1;
    const normalizedParagraph = paragraphText.trim().toLowerCase();
    const normalizedFullText = article.raw_text.toLowerCase();
    
    const searchStart = paragraphIndex > 0 
      ? paragraphs.slice(0, paragraphIndex).join('\n\n').length 
      : 0;
    const searchText = normalizedFullText.substring(searchStart);
    const relativeIndex = searchText.indexOf(normalizedParagraph);
    
    if (relativeIndex !== -1) {
      paragraphStart = searchStart + relativeIndex;
    } else {
      const firstWords = normalizedParagraph.split(/\s+/).slice(0, 5).join(' ');
      const wordIndex = normalizedFullText.indexOf(firstWords, searchStart);
      if (wordIndex !== -1) {
        paragraphStart = wordIndex;
      }
    }

    if (paragraphStart === -1) {
      return (
        <p key={paragraphIndex} className="mb-4 leading-7 text-gray-700">
          {paragraphText}
        </p>
      );
    }

    const paragraphEnd = paragraphStart + paragraphText.length;
    const relevantSegments = highlightedSegments.filter(
      seg => seg.startIndex < paragraphEnd && seg.endIndex > paragraphStart
    );

    if (relevantSegments.length === 0) {
      return (
        <p key={paragraphIndex} className="mb-4 leading-7 text-gray-700">
          {paragraphText}
        </p>
      );
    }

    const paragraphParts = splitTextWithHighlights(
      paragraphText, 
      relevantSegments.map(seg => ({
        ...seg,
        startIndex: Math.max(0, seg.startIndex - paragraphStart),
        endIndex: Math.min(paragraphText.length, seg.endIndex - paragraphStart)
      }))
    );

    return (
      <p key={paragraphIndex} className="mb-4 leading-7 text-gray-700">
        {paragraphParts.map((part, partIndex) => {
          if (part.isHighlighted && part.segment) {
            const segmentId = `${paragraphIndex}-${partIndex}-${part.segment.startIndex}`;
            const isActive = activeSegment?.comparison.segment_id === part.segment.comparison.segment_id;
            
            return (
              <span
                key={partIndex}
                ref={(el) => {
                  if (el) segmentRefs.current.set(segmentId, el);
                }}
                className={`${getHighlightColor(part.segment.label)} ${isActive ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}
                onClick={(e) => {
                  if (source === 'grok' && part.segment && e.currentTarget) {
                    handleSegmentClick(part.segment, e.currentTarget, e);
                  }
                }}
                onMouseEnter={(e) => {
                  if (source === 'grok' && part.segment && e.currentTarget) {
                    handleSegmentHover(part.segment, e.currentTarget, e);
                  }
                }}
                data-highlighted-segment
                data-segment-id={part.segment.comparison.segment_id}
                title={`${part.segment.label}: Click to see details`}
              >
                {part.text}
              </span>
            );
          }
          return <span key={partIndex}>{part.text}</span>;
        })}
      </p>
    );
  };

  return (
    <>
      <div 
        ref={containerRef}
        className="flex-1 bg-white rounded-lg shadow-md p-6 overflow-y-auto max-h-[600px]"
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-800">{title}</h2>
        {article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm mb-6 inline-block"
          >
            View source →
          </a>
        )}
        
        <div className="prose prose-sm max-w-none">
          {paragraphs.map((paragraph, index) => renderHighlightedParagraph(paragraph, index))}
        </div>

        {/* Legend */}
        {highlightedSegments.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-xs font-semibold text-gray-600 mb-2">Legend:</div>
            <div className="flex flex-wrap gap-3 text-xs">
              {[
                { label: SegmentLabel.CONFLICT, color: 'bg-red-100 border-red-400', text: 'Conflict' },
                { label: SegmentLabel.MISSING_CONTEXT, color: 'bg-yellow-100 border-yellow-400', text: 'Missing Context' },
                { label: SegmentLabel.UNSUPPORTED, color: 'bg-gray-100 border-gray-400', text: 'Unsupported' },
              ].map(({ label, color, text }) => {
                const count = highlightedSegments.filter(s => s.label === label).length;
                if (count === 0) return null;
                return (
                  <div key={label} className="flex items-center gap-1">
                    <span className={`w-4 h-4 ${color} border-b-2 rounded-sm`} />
                    <span className="text-gray-600">{text} ({count})</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modern Tooltip via Portal */}
      {activeSegment && source === 'grok' && anchorElement && typeof document !== 'undefined' && document.body && createPortal(
        <div data-tooltip>
          <DifferenceTooltip
            comparison={activeSegment.comparison}
            anchorElement={anchorElement}
            onClose={closeTooltip}
          />
        </div>,
        document.body
      )}
    </>
  );
};
