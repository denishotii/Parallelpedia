"""Enhanced service for comparing Grokipedia and Wikipedia articles with multi-layered analysis."""
import os
import re
from typing import List, Dict, Optional, Tuple, Set
import numpy as np

# Simple cosine similarity using numpy (replaces sklearn)
def cosine_similarity(a, b):
    """Compute cosine similarity between two arrays (replaces sklearn.metrics.pairwise.cosine_similarity)."""
    # Handle sparse matrices by converting to dense if needed
    if hasattr(a, 'toarray'):
        a = a.toarray()
    if hasattr(b, 'toarray'):
        b = b.toarray()
    
    a = np.asarray(a)
    b = np.asarray(b)
    
    # Ensure 2D
    if a.ndim == 1:
        a = a.reshape(1, -1)
    if b.ndim == 1:
        b = b.reshape(1, -1)
    
    a_norm = np.linalg.norm(a, axis=1, keepdims=True)
    b_norm = np.linalg.norm(b, axis=1, keepdims=True)
    a_normalized = a / (a_norm + 1e-8)
    b_normalized = b / (b_norm + 1e-8)
    return np.dot(a_normalized, b_normalized.T)

# Optional imports with fallbacks
try:
    import spacy
    from spacy.lang.en import English
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    spacy = None

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    SentenceTransformer = None

try:
    import dateparser
    DATEPARSER_AVAILABLE = True
except ImportError:
    DATEPARSER_AVAILABLE = False
    dateparser = None

from app.models import (
    Article,
    SegmentComparison,
    SegmentLabel,
    TopicAnalysis
)
from app.services.llm_client import LLMClient


class ComparisonService:
    """Enhanced service for comparing articles with semantic embeddings, NER, fact extraction, and LLM classification."""
    
    def __init__(self, llm_client: LLMClient):
        """
        Initialize enhanced comparison service.
        
        Args:
            llm_client: LLM client for embeddings and classification
        """
        self.llm_client = llm_client
        self.max_segments_per_article = int(os.getenv("COMPARE_MAX_SEGMENTS", "300"))
        self.use_llm_classification = os.getenv("USE_LLM_CLASSIFICATION", "1") == "1"
        self.llm_batch_size = int(os.getenv("LLM_BATCH_SIZE", "10"))  # Process segments in batches
        
        # Initialize spaCy for better NLP
        self.nlp = None
        if SPACY_AVAILABLE:
            try:
                # Try to load English model (user needs to run: python -m spacy download en_core_web_sm)
                self.nlp = spacy.load("en_core_web_sm")
            except OSError:
                try:
                    # Fallback to basic English
                    self.nlp = English()
                    self.nlp.add_pipe("sentencizer")
                except Exception:
                    print("Warning: spaCy not properly configured. Using regex sentence splitting.")
                    self.nlp = None
        
        # Initialize sentence transformers as fallback for embeddings
        self.sentence_model = None
        if SENTENCE_TRANSFORMERS_AVAILABLE and not self.llm_client.is_available():
            try:
                self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
                print("Using sentence-transformers for embeddings (OpenAI not available)")
            except Exception as e:
                print(f"Could not load sentence-transformers: {e}")
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences using spaCy if available, otherwise regex."""
        if self.nlp and hasattr(self.nlp, 'pipe'):
            try:
                doc = self.nlp(text)
                sentences = [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 20]
                return sentences
            except Exception:
                pass
        
        # Fallback to regex
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if len(s.strip()) > 20]
    
    def _get_embeddings(self, texts: List[str]) -> Optional[np.ndarray]:
        """
        Get embeddings for texts using OpenAI or sentence-transformers.
        
        Returns:
            numpy array of embeddings or None if unavailable
        """
        if not texts:
            return None
        
        try:
            if self.llm_client.is_available():
                # Use OpenAI embeddings (better quality)
                embeddings = self.llm_client.get_embeddings_batch(texts)
                return np.array(embeddings)
            elif self.sentence_model:
                # Fallback to sentence-transformers
                embeddings = self.sentence_model.encode(texts, show_progress_bar=False)
                return embeddings
        except Exception as e:
            print(f"Embedding error: {e}")
        
        return None
    
    def _extract_entities(self, text: str) -> Dict[str, List[str]]:
        """
        Extract named entities using spaCy NER.
        
        Returns:
            Dictionary with entity types as keys and lists of entities as values
        """
        entities = {
            "PERSON": [],
            "ORG": [],
            "GPE": [],  # Countries, cities, states
            "DATE": [],
            "CARDINAL": [],  # Numbers
            "EVENT": []
        }
        
        if not self.nlp or not hasattr(self.nlp, 'pipe'):
            return entities
        
        try:
            doc = self.nlp(text)
            for ent in doc.ents:
                ent_type = ent.label_
                if ent_type in entities:
                    entities[ent_type].append(ent.text)
                elif ent_type == "MONEY" or ent_type == "PERCENT":
                    entities["CARDINAL"].append(ent.text)
        except Exception:
            pass
        
        return entities
    
    def _extract_dates(self, text: str) -> List[str]:
        """Extract dates from text using regex and dateparser."""
        dates = []
        
        # Regex patterns for dates
        date_patterns = [
            r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',  # MM/DD/YYYY
            r'\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b',    # YYYY-MM-DD
            r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b',
            r'\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b',
            r'\b\d{4}\b'  # Years
        ]
        
        for pattern in date_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            dates.extend(matches)
        
        return list(set(dates))  # Remove duplicates
    
    def _extract_numbers(self, text: str) -> List[Tuple[str, str]]:
        """
        Extract numbers with context.
        
        Returns:
            List of (number, context) tuples
        """
        # Pattern for numbers (including percentages, decimals, etc.)
        number_pattern = r'\b\d+(?:\.\d+)?%?\b'
        numbers = re.findall(number_pattern, text)
        
        # Try to get context (surrounding words)
        contexts = []
        for match in re.finditer(number_pattern, text):
            start = max(0, match.start() - 20)
            end = min(len(text), match.end() + 20)
            context = text[start:end].strip()
            contexts.append((match.group(), context))
        
        return contexts
    
    def _extract_citations(self, text: str) -> List[str]:
        """Extract citation markers from text (e.g., [1], [citation needed])."""
        citation_patterns = [
            r'\[\d+\]',  # [1], [2], etc.
            r'\[citation needed\]',
            r'\[who\?\]',
            r'\[when\?\]'
        ]
        
        citations = []
        for pattern in citation_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            citations.extend(matches)
        
        return citations
    
    def _compare_entities(self, grok_entities: Dict, wiki_entities: Dict) -> Dict[str, float]:
        """
        Compare entities between two texts.
        
        Returns:
            Dictionary with similarity scores per entity type
        """
        similarities = {}
        
        for ent_type in grok_entities:
            grok_set = set(grok_entities[ent_type])
            wiki_set = set(wiki_entities[ent_type])
            
            if not grok_set and not wiki_set:
                similarities[ent_type] = 1.0
            elif not grok_set or not wiki_set:
                similarities[ent_type] = 0.0
            else:
                # Jaccard similarity
                intersection = len(grok_set & wiki_set)
                union = len(grok_set | wiki_set)
                similarities[ent_type] = intersection / union if union > 0 else 0.0
        
        return similarities
    
    def _compare_dates(self, grok_dates: List[str], wiki_dates: List[str]) -> Tuple[float, List[str]]:
        """
        Compare dates between texts.
        
        Returns:
            Tuple of (similarity_score, conflicting_dates)
        """
        grok_set = set(grok_dates)
        wiki_set = set(wiki_dates)
        
        if not grok_set and not wiki_set:
            return 1.0, []
        if not grok_set or not wiki_set:
            return 0.0, []
        
        # Find conflicts (dates that appear in both but might be different)
        common = grok_set & wiki_set
        conflicts = []
        
        # Check for year conflicts (same topic, different years)
        grok_years = {d for d in grok_set if re.match(r'^\d{4}$', d)}
        wiki_years = {d for d in wiki_set if re.match(r'^\d{4}$', d)}
        
        if grok_years and wiki_years and not (grok_years & wiki_years):
            conflicts.append("Different years mentioned")
        
        similarity = len(common) / len(grok_set | wiki_set) if (grok_set | wiki_set) else 0.0
        return similarity, conflicts
    
    def _classify_segment_enhanced(
        self,
        grok_segment: str,
        wiki_segments: List[str],
        grok_entities: Dict,
        wiki_entities: Dict,
        similarity_score: float,
        best_wiki_match: str
    ) -> Tuple[SegmentLabel, float, List[str], List[str]]:
        """
        Enhanced classification using multiple signals: embeddings, entities, dates, and optionally LLM.
        
        Returns:
            Tuple of (label, confidence, matched_sentences, detected_issues)
        """
        detected_issues = []
        
        # 1. Check entity alignment
        entity_similarities = self._compare_entities(grok_entities, self._extract_entities(best_wiki_match))
        low_entity_sim = any(score < 0.5 for score in entity_similarities.values() if score > 0)
        if low_entity_sim:
            detected_issues.append("Entity mismatch")
        
        # 2. Check date conflicts
        grok_dates = self._extract_dates(grok_segment)
        wiki_dates = self._extract_dates(best_wiki_match)
        date_sim, date_conflicts = self._compare_dates(grok_dates, wiki_dates)
        if date_conflicts:
            detected_issues.extend(date_conflicts)
        
        # 3. Check number conflicts
        grok_numbers = self._extract_numbers(grok_segment)
        wiki_numbers = self._extract_numbers(best_wiki_match)
        if grok_numbers and wiki_numbers:
            # Simple check: if same context but different numbers
            grok_num_set = {num for num, _ in grok_numbers}
            wiki_num_set = {num for num, _ in wiki_numbers}
            if grok_num_set and wiki_num_set and not (grok_num_set & wiki_num_set):
                # Check if contexts overlap (same topic, different numbers)
                grok_contexts = {ctx.lower() for _, ctx in grok_numbers}
                wiki_contexts = {ctx.lower() for _, ctx in wiki_numbers}
                if grok_contexts & wiki_contexts:
                    detected_issues.append("Conflicting numbers/statistics")
        
        # 4. Check citations
        grok_citations = self._extract_citations(grok_segment)
        wiki_citations = self._extract_citations(best_wiki_match)
        if wiki_citations and not grok_citations:
            detected_issues.append("Missing citations")
        
        # 5. Use LLM for final classification if available and enabled
        if self.use_llm_classification and self.llm_client.is_available():
            try:
                # Get context from surrounding segments
                context = f"Similarity: {similarity_score:.2f}, Entity alignment: {entity_similarities}, Date conflicts: {date_conflicts}"
                
                llm_result = self.llm_client.classify_segment_relationship(
                    grok_segment,
                    best_wiki_match,
                    context=context
                )
                
                # Combine LLM detected issues with our detected issues
                detected_issues.extend(llm_result.get("detected_issues", []))
                
                # Use LLM label if confidence is high, otherwise use similarity-based
                llm_confidence = llm_result.get("confidence", 0.0)
                if llm_confidence > 0.7:
                    label_str = llm_result.get("label", "unsupported")
                    try:
                        label = SegmentLabel(label_str)
                        return label, similarity_score, [best_wiki_match], detected_issues
                    except ValueError:
                        pass  # Fall through to similarity-based classification
            except Exception as e:
                print(f"LLM classification error: {e}")
        
        # 6. Fallback to similarity-based classification (enhanced with entity/date checks)
        if detected_issues and similarity_score < 0.5:
            # If we have issues and low similarity, likely conflict
            if any("conflict" in issue.lower() or "different" in issue.lower() for issue in detected_issues):
                return SegmentLabel.CONFLICT, similarity_score, [best_wiki_match], detected_issues
            else:
                return SegmentLabel.MISSING_CONTEXT, similarity_score, [best_wiki_match], detected_issues
        
        # Standard similarity-based classification
        if similarity_score >= 0.7:
            return SegmentLabel.ALIGNED, similarity_score, [best_wiki_match], detected_issues
        elif similarity_score >= 0.3:
            return SegmentLabel.MISSING_CONTEXT, similarity_score, [best_wiki_match], detected_issues
        elif similarity_score > 0.1:
            # Check if issues suggest conflict
            if detected_issues:
                return SegmentLabel.CONFLICT, similarity_score, [best_wiki_match], detected_issues
            return SegmentLabel.MISSING_CONTEXT, similarity_score, [best_wiki_match], detected_issues
        else:
            return SegmentLabel.UNSUPPORTED, similarity_score, [], detected_issues
    
    def _calculate_trust_score(self, comparisons: List[SegmentComparison]) -> float:
        """Calculate overall trust score from segment comparisons."""
        if not comparisons:
            return 0.0
        
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
            # Factor in similarity score
            adjusted_weight = weight * (0.5 + 0.5 * comp.similarity_score)
            total_score += adjusted_weight
            total_weight += abs(weight)
        
        if total_weight == 0:
            return 50.0
        
        normalized = (total_score / total_weight) * 100
        return max(0.0, min(100.0, normalized))
    
    def compare_articles(
        self,
        grok_article: Article,
        wiki_article: Article
    ) -> TopicAnalysis:
        """
        Compare Grokipedia and Wikipedia articles using enhanced multi-layered analysis.
        
        Args:
            grok_article: Grokipedia article
            wiki_article: Wikipedia article
            
        Returns:
            TopicAnalysis with comparisons and trust score
        """
        grok_text = grok_article.raw_text or ""
        wiki_text = wiki_article.raw_text or ""
        
        # Split into segments
        grok_segments = self._split_into_sentences(grok_text)
        wiki_segments = self._split_into_sentences(wiki_text)
        
        # Bound segments
        if len(grok_segments) > self.max_segments_per_article:
            grok_segments = grok_segments[:self.max_segments_per_article]
        if len(wiki_segments) > self.max_segments_per_article:
            wiki_segments = wiki_segments[:self.max_segments_per_article]
        
        if not grok_segments or not wiki_segments:
            return TopicAnalysis(
                topic_id=grok_article.topic_id,
                grok_title=grok_article.title,
                wiki_title=wiki_article.title,
                trust_score=0.0,
                summary="No content to compare.",
                segment_comparisons=[],
                labels_count={
                    SegmentLabel.ALIGNED: 0,
                    SegmentLabel.MISSING_CONTEXT: 0,
                    SegmentLabel.CONFLICT: 0,
                    SegmentLabel.UNSUPPORTED: 0,
                },
            )
        
        # Get embeddings for all segments
        print(f"Computing embeddings for {len(grok_segments)} Grokipedia and {len(wiki_segments)} Wikipedia segments...")
        all_segments = wiki_segments + grok_segments
        embeddings = self._get_embeddings(all_segments)
        
        if embeddings is None:
            # Fallback to simple word overlap if embeddings unavailable
            print("Warning: Embeddings unavailable, using simple word overlap similarity")
            # Simple word-based similarity (Jaccard-like)
            def simple_similarity(seg1, seg2):
                words1 = set(seg1.lower().split())
                words2 = set(seg2.lower().split())
                if not words1 or not words2:
                    return 0.0
                intersection = len(words1 & words2)
                union = len(words1 | words2)
                return intersection / union if union > 0 else 0.0
            
            sim_matrix = np.array([
                [simple_similarity(grok_seg, wiki_seg) for wiki_seg in wiki_segments]
                for grok_seg in grok_segments
            ])
        else:
            # Use semantic embeddings
            wiki_embeddings = embeddings[:len(wiki_segments)]
            grok_embeddings = embeddings[len(wiki_segments):]
            sim_matrix = cosine_similarity(grok_embeddings, wiki_embeddings)
        
        # Compare each Grokipedia segment
        comparisons = []
        for idx, grok_seg in enumerate(grok_segments):
            row = sim_matrix[idx]
            if row.size == 0:
                label, similarity, matched, issues = SegmentLabel.UNSUPPORTED, 0.0, [], []
            else:
                best_idx = row.argmax()
                max_sim = float(row[best_idx])
                best_match = wiki_segments[best_idx] if 0 <= best_idx < len(wiki_segments) else ""
                
                # Extract entities for this segment
                grok_entities = self._extract_entities(grok_seg)
                
                # Enhanced classification
                label, similarity, matched, issues = self._classify_segment_enhanced(
                    grok_seg,
                    wiki_segments,
                    grok_entities,
                    {},  # Will extract wiki entities in the method
                    max_sim,
                    best_match
                )
            
            comparisons.append(
                SegmentComparison(
                    segment_id=f"{grok_article.topic_id}_seg_{idx}",
                    text=grok_seg,
                    label=label,
                    similarity_score=similarity,
                    matched_wiki_sentences=matched,
                )
            )
        
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
        unsupported_pct = (labels_count.get(SegmentLabel.UNSUPPORTED, 0) / total) * 100
        
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
        
        if unsupported_pct > 30:
            summary_parts.append(f"{unsupported_pct:.1f}% of segments are unsupported by Wikipedia.")
        
        if aligned_pct > 50:
            summary_parts.append(f"{aligned_pct:.1f}% of segments align well with Wikipedia.")
        
        return " ".join(summary_parts)
