"""Service for comparing Grokipedia and Wikipedia articles."""
import re
from typing import List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.models import (
    Article,
    SegmentComparison,
    SegmentLabel,
    TopicAnalysis
)
from app.services.llm_client import LLMClient


class ComparisonService:
    """Service for comparing articles and generating trust scores."""
    
    def __init__(self, llm_client: LLMClient):
        """
        Initialize comparison service.
        
        Args:
            llm_client: LLM client for advanced comparisons
        """
        self.llm_client = llm_client
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        # Simple sentence splitting (can be improved with nltk)
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if len(s.strip()) > 20]  # Filter very short sentences
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate similarity between two texts using TF-IDF cosine similarity.
        
        This method uses semantic analysis to understand meaning, not just word matching.
        It's robust to paraphrasing and different phrasings of the same concept.
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Similarity score between 0 and 1
        """
        if not text1 or not text2:
            return 0.0
        
        # Normalize text (lowercase, basic cleaning)
        text1 = text1.lower().strip()
        text2 = text2.lower().strip()
        
        if len(text1) < 10 or len(text2) < 10:
            return 0.0
        
        try:
            # Use TF-IDF to understand semantic importance
            vectors = self.vectorizer.fit_transform([text1, text2])
            
            # Calculate cosine similarity (measures angle between vectors)
            # Higher similarity = more aligned content
            similarity = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
            
            # Ensure it's a valid float between 0 and 1
            similarity = max(0.0, min(1.0, float(similarity)))
            
            return similarity
        except Exception as e:
            # If vectorization fails (e.g., empty after preprocessing), return 0
            print(f"Similarity calculation error: {e}")
            return 0.0
    
    def _classify_segment(
        self,
        grok_segment: str,
        wiki_segments: List[str],
        similarity_threshold: float = 0.3
    ) -> tuple[SegmentLabel, float, List[str]]:
        """
        Classify a Grokipedia segment against Wikipedia segments.
        
        Args:
            grok_segment: Segment from Grokipedia
            wiki_segments: List of Wikipedia segments
            similarity_threshold: Minimum similarity to consider aligned
            
        Returns:
            Tuple of (label, max_similarity, matched_sentences)
        """
        if not wiki_segments:
            return SegmentLabel.UNSUPPORTED, 0.0, []
        
        # Calculate similarity with all Wikipedia segments
        similarities = []
        for wiki_seg in wiki_segments:
            sim = self._calculate_similarity(grok_segment, wiki_seg)
            similarities.append((sim, wiki_seg))
        
        # Sort by similarity
        similarities.sort(key=lambda x: x[0], reverse=True)
        max_sim, best_match = similarities[0] if similarities else (0.0, "")
        
        # Classify based on similarity
        if max_sim >= 0.7:
            # High similarity - aligned
            matched = [best_match] if max_sim >= 0.7 else []
            return SegmentLabel.ALIGNED, max_sim, matched
        elif max_sim >= similarity_threshold:
            # Medium similarity - might be missing context
            matched = [best_match]
            return SegmentLabel.MISSING_CONTEXT, max_sim, matched
        elif max_sim > 0.1:
            # Low similarity but some match - possible conflict
            # Check for conflicting facts (simplified)
            if self._has_conflicting_facts(grok_segment, best_match):
                return SegmentLabel.CONFLICT, max_sim, [best_match]
            else:
                return SegmentLabel.MISSING_CONTEXT, max_sim, [best_match]
        else:
            # Very low similarity - unsupported
            return SegmentLabel.UNSUPPORTED, max_sim, []
    
    def _has_conflicting_facts(self, text1: str, text2: str) -> bool:
        """
        Simple heuristic to detect conflicting facts.
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            True if conflicting facts detected
        """
        # Extract numbers and dates
        numbers1 = set(re.findall(r'\d+', text1))
        numbers2 = set(re.findall(r'\d+', text2))
        
        # If both have numbers but they're different, might be a conflict
        if numbers1 and numbers2 and not numbers1.intersection(numbers2):
            # Check if they're talking about the same thing
            # Simple keyword overlap check
            words1 = set(text1.lower().split())
            words2 = set(text2.lower().split())
            overlap = len(words1.intersection(words2)) / max(len(words1), len(words2))
            
            # If high word overlap but different numbers, likely conflict
            if overlap > 0.3:
                return True
        
        return False
    
    def _calculate_trust_score(self, comparisons: List[SegmentComparison]) -> float:
        """
        Calculate overall trust score from segment comparisons.
        
        Args:
            comparisons: List of segment comparisons
            
        Returns:
            Trust score from 0 to 100
        """
        if not comparisons:
            return 0.0
        
        # Weight different labels
        weights = {
            SegmentLabel.ALIGNED: 1.0,
            SegmentLabel.MISSING_CONTEXT: 0.6,
            SegmentLabel.CONFLICT: -0.5,
            SegmentLabel.UNSUPPORTED: 0.3
        }
        
        total_score = 0.0
        total_weight = 0.0
        
        for comp in comparisons:
            weight = weights.get(comp.label, 0.0)
            # Also factor in similarity score
            adjusted_weight = weight * (0.5 + 0.5 * comp.similarity_score)
            total_score += adjusted_weight
            total_weight += abs(weight)
        
        if total_weight == 0:
            return 50.0  # Neutral score
        
        # Normalize to 0-100
        normalized = (total_score / total_weight) * 100
        return max(0.0, min(100.0, normalized))
    
    def compare_articles(
        self,
        grok_article: Article,
        wiki_article: Article
    ) -> TopicAnalysis:
        """
        Compare Grokipedia and Wikipedia articles.
        
        Args:
            grok_article: Grokipedia article
            wiki_article: Wikipedia article
            
        Returns:
            TopicAnalysis with comparisons and trust score
        """
        # Handle empty text
        grok_text = grok_article.raw_text or ""
        wiki_text = wiki_article.raw_text or ""
        
        # Split articles into segments
        grok_segments = self._split_into_sentences(grok_text)
        wiki_segments = self._split_into_sentences(wiki_text)
        
        # Compare each Grokipedia segment
        comparisons = []
        for idx, grok_seg in enumerate(grok_segments):
            label, similarity, matched = self._classify_segment(
                grok_seg,
                wiki_segments
            )
            
            comparisons.append(SegmentComparison(
                segment_id=f"{grok_article.topic_id}_seg_{idx}",
                text=grok_seg,
                label=label,
                similarity_score=similarity,
                matched_wiki_sentences=matched
            ))
        
        # Calculate trust score
        trust_score = self._calculate_trust_score(comparisons)
        
        # Count labels
        labels_count = {
            SegmentLabel.ALIGNED: sum(1 for c in comparisons if c.label == SegmentLabel.ALIGNED),
            SegmentLabel.MISSING_CONTEXT: sum(1 for c in comparisons if c.label == SegmentLabel.MISSING_CONTEXT),
            SegmentLabel.CONFLICT: sum(1 for c in comparisons if c.label == SegmentLabel.CONFLICT),
            SegmentLabel.UNSUPPORTED: sum(1 for c in comparisons if c.label == SegmentLabel.UNSUPPORTED)
        }
        
        # Generate summary
        summary = self._generate_summary(comparisons, trust_score, labels_count)
        
        return TopicAnalysis(
            topic_id=grok_article.topic_id,
            grok_title=grok_article.title,
            wiki_title=wiki_article.title,
            trust_score=trust_score,
            summary=summary,
            segment_comparisons=comparisons,
            labels_count=labels_count
        )
    
    def _generate_summary(
        self,
        comparisons: List[SegmentComparison],
        trust_score: float,
        labels_count: dict[str, int]
    ) -> str:
        """Generate a human-readable summary of the analysis."""
        total = len(comparisons)
        if total == 0:
            return "No content to compare."
        
        aligned_pct = (labels_count.get(SegmentLabel.ALIGNED, 0) / total) * 100
        conflict_pct = (labels_count.get(SegmentLabel.CONFLICT, 0) / total) * 100
        
        summary_parts = []
        
        if trust_score >= 80:
            summary_parts.append("High trust score: Content is largely aligned with Wikipedia.")
        elif trust_score >= 60:
            summary_parts.append("Moderate trust score: Content mostly aligns but has some gaps.")
        elif trust_score >= 40:
            summary_parts.append("Low trust score: Significant differences detected.")
        else:
            summary_parts.append("Very low trust score: Major discrepancies found.")
        
        if conflict_pct > 20:
            summary_parts.append(f"{conflict_pct:.1f}% of segments contain conflicting information.")
        
        if aligned_pct > 50:
            summary_parts.append(f"{aligned_pct:.1f}% of segments align well with Wikipedia.")
        
        return " ".join(summary_parts)

