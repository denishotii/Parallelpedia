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
    
    def classify_segment_relationship(
        self, 
        grok_segment: str, 
        wiki_segment: str,
        context: Optional[str] = None
    ) -> Dict:
        """
        Use GPT-4 to intelligently classify the relationship between two text segments.
        
        Args:
            grok_segment: Segment from Grokipedia
            wiki_segment: Segment from Wikipedia
            context: Optional surrounding context
            
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
        
        prompt = f"""You are an expert fact-checker comparing AI-generated content (Grokipedia) with Wikipedia.

Analyze the relationship between these two text segments:

GROKIPEDIA SEGMENT:
{grok_segment}

WIKIPEDIA SEGMENT:
{wiki_segment}

{f'CONTEXT: {context}' if context else ''}

Classify the relationship and return JSON with:
1. "label": one of "aligned", "missing_context", "conflict", or "unsupported"
   - "aligned": Same facts, similar meaning, well-supported
   - "missing_context": Related but missing important details or nuance
   - "conflict": Contradictory facts, different numbers/dates, opposing claims
   - "unsupported": Content not found in Wikipedia, potentially hallucinated

2. "confidence": float 0.0-1.0

3. "explanation": Brief explanation of why this classification

4. "detected_issues": Array of specific issues found (e.g., ["different dates", "missing citation", "conflicting statistics"])

Be strict: only mark as "aligned" if facts truly match. Mark as "conflict" if numbers, dates, or core facts differ.
Mark as "unsupported" if the Grokipedia content has no basis in Wikipedia.

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

