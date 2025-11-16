"""DKG client for interacting with OriginTrail DKG."""
import os
import httpx
from typing import Optional
from app.models import CommunityNote


class DKGClient:
    """Client for interacting with OriginTrail DKG."""
    
    def __init__(self, base_url: Optional[str] = None):
        """
        Initialize DKG client.
        
        Args:
            base_url: Base URL for DKG node (defaults to DKG_BASE_URL env var or localhost:9200)
        """
        self.base_url = base_url or os.getenv("DKG_BASE_URL", "http://localhost:9200")
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get_asset(self, ual: str) -> Optional[dict]:
        """
        Get a Knowledge Asset by UAL.
        
        Args:
            ual: Unique Asset Locator
            
        Returns:
            Asset data or None if not found
        """
        try:
            response = await self.client.get(
                f"{self.base_url}/api/dkg/assets",
                params={"ual": ual}
            )
            response.raise_for_status()
            data = response.json()
            return data.get("data") if data.get("success") else None
        except Exception as e:
            print(f"Error fetching asset {ual}: {e}")
            return None
    
    async def query_sparql(self, query: str) -> Optional[dict]:
        """
        Execute a SPARQL query on the DKG.
        
        Args:
            query: SPARQL query string
            
        Returns:
            Query results or None if error
        """
        try:
            response = await self.client.post(
                f"{self.base_url}/api/dkg/query",
                json={"query": query, "queryType": "SELECT"}
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Error executing SPARQL query: {e}")
            return None
    
    async def publish_community_note(self, note: CommunityNote) -> Optional[str]:
        """
        Publish a Community Note as a Knowledge Asset.
        
        Args:
            note: CommunityNote to publish
            
        Returns:
            UAL (Unique Asset Locator) if successful, None otherwise
        """
        from datetime import datetime
        
        # Convert CommunityNote to JSON-LD format
        # Using schema.org and parallelpedia namespace
        jsonld = {
            "@context": {
                "@vocab": "https://schema.org/",
                "parallelpedia": "https://parallelpedia.org/schema/"
            },
            "@type": "CommunityNote",
            "topicId": note.topic_id,
            "trustScore": note.trust_score,
            "summary": note.summary,
            "labelsCount": note.labels_count,
            "keyExamples": note.key_examples,
            "grokTitle": note.grok_title,
            "wikiTitle": note.wiki_title,
            "dateCreated": datetime.utcnow().isoformat() + "Z"
        }
        
        try:
            # Use the Parallelpedia plugin API endpoint for publishing
            response = await self.client.post(
                f"{self.base_url}/parallelpedia/community-notes",
                json={
                    "topicId": note.topic_id,
                    "trustScore": note.trust_score,
                    "summary": note.summary,
                    "labelsCount": note.labels_count,
                    "keyExamples": note.key_examples,
                    "grokTitle": note.grok_title,
                    "wikiTitle": note.wiki_title
                }
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get("success") and result.get("ual"):
                return result["ual"]
            
            error_msg = result.get("error", "Unknown error")
            print(f"Failed to publish: {error_msg}")
            return None
        except Exception as e:
            print(f"Error publishing community note: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def get_community_note(self, topic_id: str) -> Optional[CommunityNote]:
        """
        Get a Community Note for a topic (by querying DKG).
        
        Args:
            topic_id: Topic identifier
            
        Returns:
            CommunityNote if found, None otherwise
        """
        try:
            # Use the Parallelpedia plugin API endpoint
            response = await self.client.get(
                f"{self.base_url}/parallelpedia/community-notes/{topic_id}"
            )
            
            if response.status_code == 404:
                return None
            
            response.raise_for_status()
            data = response.json()
            
            if not data.get("found"):
                return None
            
            # Convert API response to CommunityNote model
            return CommunityNote(
                topic_id=data["topicId"],
                trust_score=data.get("trustScore", 0.0),
                summary=data.get("summary", ""),
                labels_count={},  # Would need to be stored/retrieved separately
                key_examples=[],  # Would need to be stored/retrieved separately
                grok_title=data.get("grokTitle", ""),
                wiki_title=data.get("wikiTitle", "")
            )
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            raise
        except Exception as e:
            print(f"Error fetching community note for {topic_id}: {e}")
            return None
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()

