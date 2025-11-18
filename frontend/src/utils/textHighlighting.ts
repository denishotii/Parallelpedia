import { SegmentComparison, SegmentLabel } from '../types';

export interface HighlightedSegment {
  text: string;
  startIndex: number;
  endIndex: number;
  label: SegmentLabel;
  comparison: SegmentComparison;
}

/**
 * Normalize text for comparison (remove extra whitespace, normalize quotes, etc.)
 */
function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .trim()
    .toLowerCase();
}

/**
 * Find all occurrences of segment text in the article text
 * Returns positions where the segment text appears
 */
export function findSegmentPositions(
  segmentText: string,
  articleText: string,
  tolerance: number = 100
): Array<{ start: number; end: number }> {
  const positions: Array<{ start: number; end: number }> = [];
  
  if (!segmentText || segmentText.trim().length < 10) {
    return positions;
  }
  
  const normalizedSegment = normalizeText(segmentText);
  const normalizedArticle = normalizeText(articleText);
  
  // Try exact normalized match first
  let searchIndex = 0;
  while (true) {
    const index = normalizedArticle.indexOf(normalizedSegment, searchIndex);
    if (index === -1) break;
    
    // Map back to original text positions (approximate)
    // Since we normalized, we need to find the actual position in original text
    const originalStart = findOriginalPosition(articleText, index, normalizedArticle);
    const originalEnd = originalStart + segmentText.length;
    
    positions.push({
      start: originalStart,
      end: Math.min(originalEnd, articleText.length)
    });
    searchIndex = index + 1;
  }
  
  // If no exact match, try fuzzy matching (find by first few significant words)
  if (positions.length === 0) {
    const segmentWords = normalizedSegment.split(/\s+/).filter(w => w.length > 4);
    if (segmentWords.length >= 3) {
      // Use first 3-5 significant words
      const searchPhrase = segmentWords.slice(0, Math.min(5, segmentWords.length)).join(' ');
      let searchIndex = 0;
      while (true) {
        const index = normalizedArticle.indexOf(searchPhrase, searchIndex);
        if (index === -1) break;
        
        // Map back to original and estimate segment boundaries
        const originalStart = findOriginalPosition(articleText, index, normalizedArticle);
        const estimatedLength = Math.min(segmentText.length + tolerance, articleText.length - originalStart);
        const originalEnd = originalStart + estimatedLength;
        
        positions.push({
          start: originalStart,
          end: Math.min(originalEnd, articleText.length)
        });
        searchIndex = index + 1;
      }
    }
  }
  
  return positions;
}

/**
 * Find approximate position in original text given normalized position
 */
function findOriginalPosition(originalText: string, normalizedIndex: number, normalizedText: string): number {
  // Simple approximation: count characters up to normalizedIndex
  // This is not perfect but should work reasonably well for most cases
  let charCount = 0;
  let normalizedCharCount = 0;
  
  for (let i = 0; i < originalText.length && normalizedCharCount < normalizedIndex; i++) {
    const char = originalText[i].toLowerCase();
    if (char.match(/\s/)) {
      // Skip multiple spaces in normalized version
      if (normalizedCharCount < normalizedText.length && normalizedText[normalizedCharCount] === ' ') {
        normalizedCharCount++;
      }
    } else {
      normalizedCharCount++;
    }
    charCount++;
  }
  
  return Math.min(charCount, originalText.length);
}

/**
 * Create highlighted segments from article text and comparisons
 */
export function createHighlightedSegments(
  articleText: string,
  comparisons: SegmentComparison[],
  source: 'grok' | 'wiki' = 'grok'
): HighlightedSegment[] {
  const segments: HighlightedSegment[] = [];
  
  // Only highlight Grokipedia segments (conflicts, missing context, etc.)
  // For Wikipedia, we might want to show matched segments differently
  if (source === 'grok') {
    for (const comparison of comparisons) {
      // Prioritize conflicts and missing context for highlighting
      if (
        comparison.label === SegmentLabel.CONFLICT ||
        comparison.label === SegmentLabel.MISSING_CONTEXT ||
        comparison.label === SegmentLabel.UNSUPPORTED
      ) {
        const positions = findSegmentPositions(comparison.text, articleText);
        
        for (const pos of positions) {
          segments.push({
            text: articleText.substring(pos.start, pos.end),
            startIndex: pos.start,
            endIndex: pos.end,
            label: comparison.label,
            comparison
          });
        }
      }
    }
  }
  
  // Sort by start index
  segments.sort((a, b) => a.startIndex - b.startIndex);
  
  // Remove overlapping segments (keep the first one)
  const nonOverlapping: HighlightedSegment[] = [];
  let lastEnd = 0;
  
  for (const segment of segments) {
    if (segment.startIndex >= lastEnd) {
      nonOverlapping.push(segment);
      lastEnd = segment.endIndex;
    }
  }
  
  return nonOverlapping;
}

/**
 * Split text into parts with highlighted segments
 */
export interface TextPart {
  text: string;
  isHighlighted: boolean;
  segment?: HighlightedSegment;
}

export function splitTextWithHighlights(
  articleText: string,
  highlightedSegments: HighlightedSegment[]
): TextPart[] {
  if (highlightedSegments.length === 0) {
    return [{ text: articleText, isHighlighted: false }];
  }
  
  const parts: TextPart[] = [];
  let currentIndex = 0;
  
  for (const segment of highlightedSegments) {
    // Add text before highlight
    if (segment.startIndex > currentIndex) {
      parts.push({
        text: articleText.substring(currentIndex, segment.startIndex),
        isHighlighted: false
      });
    }
    
    // Add highlighted segment
    parts.push({
      text: articleText.substring(segment.startIndex, segment.endIndex),
      isHighlighted: true,
      segment
    });
    
    currentIndex = segment.endIndex;
  }
  
  // Add remaining text
  if (currentIndex < articleText.length) {
    parts.push({
      text: articleText.substring(currentIndex),
      isHighlighted: false
    });
  }
  
  return parts;
}

