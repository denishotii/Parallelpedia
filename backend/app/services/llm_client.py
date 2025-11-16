"""LLM client abstraction for flexible provider switching."""
import os
from typing import Optional

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
        
        if provider == "openai":
            if not OPENAI_AVAILABLE:
                print("Warning: OpenAI package not installed. Install with: pip install openai")
                print("LLM features will be disabled. App will use TF-IDF similarity instead.")
            elif self.api_key:
                self.client = OpenAI(api_key=self.api_key)
            else:
                print("Warning: OPENAI_API_KEY not set. LLM features will be disabled.")
                print("App will use TF-IDF similarity instead.")
        else:
            raise ValueError(f"Provider {provider} not yet supported")
    
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
    
    def compare_texts(self, text1: str, text2: str) -> dict:
        """
        Compare two texts using LLM.
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Dictionary with comparison results
        """
        # For now, this is a placeholder
        # In a full implementation, you'd use the LLM to classify the relationship
        # between text1 and text2
        prompt = f"""Compare these two texts and classify their relationship:
        
Text 1: {text1[:500]}
Text 2: {text2[:500]}

Classify as: aligned, missing_context, conflict, or unsupported.
Return JSON with: {{"label": "...", "confidence": 0.0-1.0, "explanation": "..."}}"""
        
        # Placeholder - implement actual LLM call
        return {
            "label": "aligned",
            "confidence": 0.8,
            "explanation": "Texts are similar"
        }

