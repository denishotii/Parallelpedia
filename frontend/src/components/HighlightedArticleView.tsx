import React, { useState, useRef, useEffect } from 'react';
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
  const [hoveredSegment, setHoveredSegment] = useState<HighlightedSegment | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const segmentRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = externalContainerRef || internalContainerRef;
  const isScrollingRef = useRef(false);

  // Create highlighted segments
  const highlightedSegments = comparisons
    ? createHighlightedSegments(article.raw_text, comparisons, source)
    : [];

  // Split text into paragraphs for better readability
  // Try multiple paragraph splitting strategies
  const splitParagraphs = (text: string): string[] => {
    // First try double newlines
    let paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    // If that doesn't work well, try single newlines
    if (paragraphs.length <= 1) {
      paragraphs = text.split(/\n+/).filter(p => p.trim().length > 20);
    }
    
    // If still not good, split by sentence boundaries with minimum length
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
        return 'bg-red-100 hover:bg-red-200 border-b-2 border-red-400 cursor-pointer transition-colors rounded-sm px-0.5';
      case SegmentLabel.MISSING_CONTEXT:
        return 'bg-yellow-100 hover:bg-yellow-200 border-b-2 border-yellow-400 cursor-pointer transition-colors rounded-sm px-0.5';
      case SegmentLabel.UNSUPPORTED:
        return 'bg-gray-100 hover:bg-gray-200 border-b-2 border-gray-400 cursor-pointer transition-colors rounded-sm px-0.5';
      case SegmentLabel.ALIGNED:
        return 'bg-green-100 hover:bg-green-200 border-b-2 border-green-400 cursor-pointer transition-colors rounded-sm px-0.5';
      default:
        return 'bg-blue-100 hover:bg-blue-200 border-b-2 border-blue-400 cursor-pointer transition-colors rounded-sm px-0.5';
    }
  };

  // Handle segment hover - only show tooltip when actually hovering
  const handleSegmentHover = (
    segment: HighlightedSegment,
    event: React.MouseEvent<HTMLSpanElement>
  ) => {
    // Only show tooltip for Grokipedia segments (conflicts, missing context, etc.)
    if (source !== 'grok') {
      return;
    }
    
    // Verify the element is actually visible and in viewport
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    
    // Check if element is actually visible
    if (rect.width === 0 || rect.height === 0) {
      return;
    }
    
    // Check if mouse is actually over the element
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    if (mouseX < rect.left || mouseX > rect.right || mouseY < rect.top || mouseY > rect.bottom) {
      return;
    }
    
    // Use getBoundingClientRect which gives viewport coordinates
    // These coordinates are already relative to the viewport, perfect for fixed positioning
    // Use the center of the element for better positioning
    const viewportX = rect.left + rect.width / 2;
    const viewportY = rect.top + rect.height / 2; // Center of the element in viewport coordinates
    
    setTooltipPosition({
      x: viewportX,
      y: viewportY
    });
    setHoveredSegment(segment);
    event.stopPropagation();
  };

  // Handle scroll synchronization - sync this container's scroll to the other container
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !syncScroll || !scrollContainerRef?.current) return;

    const targetContainer = scrollContainerRef.current;
    let rafId: number | null = null;
    let lastScrollTop = container.scrollTop;

    const handleScroll = () => {
      // Close tooltip when scrolling
      if (hoveredSegment) {
        setHoveredSegment(null);
      }
      
      const currentScrollTop = container.scrollTop;
      
      // Only sync if scroll position actually changed
      if (Math.abs(currentScrollTop - lastScrollTop) < 1) {
        return;
      }
      
      lastScrollTop = currentScrollTop;
      
      // Cancel any pending animation frame
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      // Only sync if we're not already syncing (to prevent infinite loops)
      if (!isScrollingRef.current) {
        rafId = requestAnimationFrame(() => {
          if (!isScrollingRef.current && targetContainer) {
            isScrollingRef.current = true;
            // Sync scroll position to the other container
            targetContainer.scrollTop = currentScrollTop;
            // Reset flag after a tiny delay to allow scroll event to complete
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
  }, [syncScroll, scrollContainerRef, hoveredSegment]);

  // Close tooltip when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking on the tooltip or highlighted segment
      if (
        hoveredSegment &&
        !target.closest('[data-tooltip]') &&
        !target.closest('[data-highlighted-segment]')
      ) {
        setHoveredSegment(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && hoveredSegment) {
        setHoveredSegment(null);
      }
    };

    if (hoveredSegment) {
      // Use a small delay to allow mouse to move to tooltip
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);
      
      document.addEventListener('keydown', handleEscape);
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [hoveredSegment]);

  // Render highlighted text for a paragraph
  const renderHighlightedParagraph = (paragraphText: string, paragraphIndex: number) => {
    // Find the position of this paragraph in the full text
    // Use a more robust method to find paragraph position
    let paragraphStart = -1;
    const normalizedParagraph = paragraphText.trim().toLowerCase();
    const normalizedFullText = article.raw_text.toLowerCase();
    
    // Try to find the paragraph in the full text
    const searchStart = paragraphIndex > 0 
      ? paragraphs.slice(0, paragraphIndex).join('\n\n').length 
      : 0;
    const searchText = normalizedFullText.substring(searchStart);
    const relativeIndex = searchText.indexOf(normalizedParagraph);
    
    if (relativeIndex !== -1) {
      paragraphStart = searchStart + relativeIndex;
    } else {
      // Fallback: try finding by first few words
      const firstWords = normalizedParagraph.split(/\s+/).slice(0, 5).join(' ');
      const wordIndex = normalizedFullText.indexOf(firstWords, searchStart);
      if (wordIndex !== -1) {
        paragraphStart = wordIndex;
      }
    }

    if (paragraphStart === -1) {
      // Fallback: render as plain text
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

    // Create parts for this paragraph
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
            return (
              <span
                key={partIndex}
                ref={(el) => {
                  if (el) segmentRefs.current.set(segmentId, el);
                }}
                className={getHighlightColor(part.segment.label)}
                onMouseEnter={(e) => {
                  if (source === 'grok' && part.segment) {
                    // Immediately check if mouse is over element
                    const element = e.currentTarget;
                    const rect = element.getBoundingClientRect();
                    const mouseX = e.clientX;
                    const mouseY = e.clientY;
                    
                    // Verify mouse is actually over the element
                    if (
                      mouseX >= rect.left &&
                      mouseX <= rect.right &&
                      mouseY >= rect.top &&
                      mouseY <= rect.bottom &&
                      rect.width > 0 &&
                      rect.height > 0
                    ) {
                      handleSegmentHover(part.segment!, e);
                    }
                  }
                }}
                onMouseLeave={() => {
                  // Close tooltip if mouse leaves
                  if (source === 'grok') {
                    setHoveredSegment(null);
                  }
                }}
                data-highlighted-segment
                title={`${part.segment.label}: Hover to see details`}
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

      {/* Tooltip - only show for Grokipedia and when actually hovering */}
      {hoveredSegment && source === 'grok' && tooltipPosition.x > 0 && tooltipPosition.y > 0 && (
        <div
          onMouseEnter={(e) => {
            e.stopPropagation();
            // Keep tooltip open when hovering over it
          }}
          onMouseLeave={() => {
            // Close when mouse leaves tooltip
            setHoveredSegment(null);
          }}
          data-tooltip
          style={{ pointerEvents: 'auto' }}
        >
          <DifferenceTooltip
            comparison={hoveredSegment.comparison}
            position={tooltipPosition}
            onClose={() => setHoveredSegment(null)}
          />
        </div>
      )}

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
  );
};

