"""LLM client abstraction for flexible provider switching."""
import os
import json
from typing import Optional, List, Dict

# Optional OpenAI import - app works without it
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None


class LLMClient:
    """Abstracted LLM client that can work with different providers."""
    
    def __init__(self, provider: str = "openai", api_key: Optional[str] = None):
        """
        Initialize LLM client.
        
        Args:
            provider: LLM provider ("openai", "anthropic", etc.)
            api_key: API key for the provider (defaults to OPENAI_API_KEY env var)
        """
        self.provider = provider
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.client = None
        self.available = False
        
        if provider == "openai":
            if not OPENAI_AVAILABLE:
                print("Warning: OpenAI package not installed. Install with: pip install openai")
                print("LLM features will be disabled. App will use TF-IDF similarity instead.")
            elif self.api_key:
                self.client = OpenAI(api_key=self.api_key)
                self.available = True
            else:
                print("Warning: OPENAI_API_KEY not set. LLM features will be disabled.")
                print("App will use TF-IDF similarity instead.")
        else:
            raise ValueError(f"Provider {provider} not yet supported")
    
    def is_available(self) -> bool:
        """Check if LLM client is available and configured."""
        return self.available and self.client is not None
    
    def get_embeddings(self, text: str, model: str = "text-embedding-3-small") -> list[float]:
        """
        Get embeddings for text.
        
        Args:
            text: Input text
            model: Embedding model name
            
        Returns:
            List of embedding values
        """
        if not self.client:
            raise ValueError("LLM client not initialized. Set OPENAI_API_KEY environment variable.")
        
        if self.provider == "openai":
            response = self.client.embeddings.create(
                model=model,
                input=text
            )
            return response.data[0].embedding
        else:
            raise ValueError(f"Embeddings not supported for provider {self.provider}")
    
    def get_embeddings_batch(self, texts: List[str], model: str = "text-embedding-3-small") -> List[List[float]]:
        """
        Get embeddings for multiple texts in batch (more efficient).
        
        Args:
            texts: List of input texts
            model: Embedding model name
            
        Returns:
            List of embedding vectors
        """
        if not self.client:
            raise ValueError("LLM client not initialized. Set OPENAI_API_KEY environment variable.")
        
        if self.provider == "openai":
            # OpenAI supports batch embeddings
            response = self.client.embeddings.create(
                model=model,
                input=texts
            )
            return [item.embedding for item in response.data]
        else:
            raise ValueError(f"Batch embeddings not supported for provider {self.provider}")
    
    def check_topic_relevance(
        self,
        grok_segment: str,
        wiki_segment: str
    ) -> Dict:
        """
        Use GPT to check if two segments are about the same topic BEFORE detailed comparison.
        This prevents false conflicts from unrelated paragraphs.
        
        Args:
            grok_segment: Segment from Grokipedia
            wiki_segment: Segment from Wikipedia
            
        Returns:
            Dictionary with is_relevant (bool), relevance_score (float), and topic_summary
        """
        if not self.client:
            return {
                "is_relevant": True,  # Assume relevant if LLM not available
                "relevance_score": 0.5,
                "topic_summary": "LLM not available"
            }
        
        prompt = f"""You are a topic relevance checker. Determine if these two text segments are about the SAME TOPIC.

GROKIPEDIA SEGMENT:
{grok_segment[:500]}

WIKIPEDIA SEGMENT:
{wiki_segment[:500]}

CRITICAL: Only return "is_relevant": true if both segments discuss the SAME specific topic, person, event, or concept.
If they discuss different topics (e.g., "Early Life" vs "Career", "History" vs "Current Status"), return "is_relevant": false.

Return JSON with:
1. "is_relevant": boolean - true ONLY if same topic
2. "relevance_score": float 0.0-1.0 (1.0 = same topic, 0.0 = completely different topics)
3. "topic_summary": Brief description of what topic(s) each segment discusses
4. "reason": Why they are/aren't about the same topic

Return ONLY valid JSON, no other text."""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a precise topic relevance checker. Always return valid JSON. Be strict: only mark as relevant if truly the same topic."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return {
                "is_relevant": bool(result.get("is_relevant", False)),
                "relevance_score": float(result.get("relevance_score", 0.0)),
                "topic_summary": result.get("topic_summary", ""),
                "reason": result.get("reason", "")
            }
        except Exception as e:
            print(f"Topic relevance check error: {e}")
            return {
                "is_relevant": True,  # Default to relevant on error
                "relevance_score": 0.5,
                "topic_summary": f"Error: {str(e)}",
                "reason": "Error during topic check"
            }
    
    def classify_segment_relationship(
        self, 
        grok_segment: str, 
        wiki_segment: str,
        context: Optional[str] = None,
        topic_relevance: Optional[Dict] = None
    ) -> Dict:
        """
        Use GPT-4 to intelligently classify the relationship between two text segments.
        Now includes topic relevance checking to avoid false conflicts.
        
        Args:
            grok_segment: Segment from Grokipedia
            wiki_segment: Segment from Wikipedia
            context: Optional surrounding context
            topic_relevance: Optional pre-computed topic relevance check result
            
        Returns:
            Dictionary with label, confidence, explanation, and detected_issues
        """
        if not self.client:
            # Fallback to basic similarity if LLM not available
            return {
                "label": "aligned",
                "confidence": 0.5,
                "explanation": "LLM not available, using fallback",
                "detected_issues": []
            }
        
        # Build context about topic relevance
        topic_info = ""
        if topic_relevance:
            if not topic_relevance.get("is_relevant", True):
                topic_info = f"\n⚠️ TOPIC RELEVANCE WARNING: These segments appear to be about DIFFERENT topics.\n"
                topic_info += f"Grokipedia topic: {topic_relevance.get('topic_summary', 'Unknown')}\n"
                topic_info += f"Reason: {topic_relevance.get('reason', '')}\n"
                topic_info += f"DO NOT mark as 'conflict' - mark as 'unsupported' instead.\n"
        
        prompt = f"""You are an expert fact-checker comparing AI-generated content (Grokipedia) with Wikipedia.

FIRST: Check if these segments are about the SAME TOPIC. If they discuss different topics (e.g., "Early Life" vs "Career"), 
mark as "unsupported" NOT "conflict".

GROKIPEDIA SEGMENT:
{grok_segment}

WIKIPEDIA SEGMENT:
{wiki_segment}

{topic_info}

{f'ADDITIONAL CONTEXT: {context}' if context else ''}

Classify the relationship and return JSON with:
1. "label": one of "aligned", "missing_context", "conflict", or "unsupported"
   - "aligned": Same topic AND same facts, similar meaning, well-supported
   - "missing_context": Same topic but missing important details or nuance
   - "conflict": SAME TOPIC but contradictory facts, different numbers/dates, opposing claims
   - "unsupported": Different topic OR content not found in Wikipedia, potentially hallucinated
   
   ⚠️ CRITICAL: Only use "conflict" if segments are about the SAME topic but have conflicting facts.
   If segments are about different topics, use "unsupported".

2. "confidence": float 0.0-1.0

3. "explanation": Brief explanation of why this classification

4. "detected_issues": Array of specific issues found (e.g., ["different dates", "missing citation", "conflicting statistics"])
   - Only include issues if segments are about the same topic

Be VERY strict: 
- Only mark as "aligned" if same topic AND facts truly match
- Only mark as "conflict" if SAME topic but numbers, dates, or core facts differ
- Mark as "unsupported" if different topics OR content has no basis in Wikipedia

Return ONLY valid JSON, no other text."""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Using mini for cost efficiency, can switch to gpt-4o for better results
                messages=[
                    {"role": "system", "content": "You are a precise fact-checking assistant. Always return valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Low temperature for consistent classification
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Validate and normalize
            label = result.get("label", "unsupported")
            if label not in ["aligned", "missing_context", "conflict", "unsupported"]:
                label = "unsupported"
            
            return {
                "label": label,
                "confidence": float(result.get("confidence", 0.5)),
                "explanation": result.get("explanation", ""),
                "detected_issues": result.get("detected_issues", [])
            }
        except Exception as e:
            print(f"LLM classification error: {e}")
            return {
                "label": "unsupported",
                "confidence": 0.0,
                "explanation": f"Classification failed: {str(e)}",
                "detected_issues": []
            }
    
    def extract_facts(self, text: str) -> List[Dict]:
        """
        Extract structured facts from text using LLM.
        
        Args:
            text: Input text
            
        Returns:
            List of fact dictionaries with subject, predicate, object, and confidence
        """
        if not self.client:
            return []
        
        prompt = f"""Extract factual claims from this text as structured triples (subject-predicate-object).

TEXT:
{text[:1000]}

Return JSON array of facts, each with:
- "subject": The entity or topic
- "predicate": The relationship or action
- "object": The value, target, or claim
- "confidence": 0.0-1.0

Focus on verifiable facts: dates, numbers, relationships, events.
Return ONLY valid JSON array, no other text."""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a fact extraction assistant. Return valid JSON arrays."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return result.get("facts", [])
        except Exception as e:
            print(f"Fact extraction error: {e}")
            return []
    
    def compare_texts(self, text1: str, text2: str) -> dict:
        """
        Compare two texts using LLM (legacy method, uses new classify_segment_relationship).
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Dictionary with comparison results
        """
        return self.classify_segment_relationship(text1, text2)

