"""DKG client for interacting with OriginTrail DKG."""
import os
import json
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
        # Increased timeout for DKG publishing (blockchain operations can take 60-1800 seconds)
        # Set explicit timeouts: connect, read, write, pool
        timeout_config = httpx.Timeout(
            connect=30.0,  # 30 seconds to establish connection
            read=1800.0,   # 30 minutes to read response (blockchain ops can be very slow)
            write=30.0,     # 30 seconds to write request
            pool=30.0       # 30 seconds to get connection from pool
        )
        self.client = httpx.AsyncClient(timeout=timeout_config)
    
    async def find_grok_article_ual(self, topic_id: str) -> Optional[str]:
        """
        Try to find a Grokipedia article Knowledge Asset by topic_id via SPARQL.
        
        This is schema-agnostic but tries common predicates:
        - schema:topicId
        - schema:name / schema:about
        - parallelpedia namespace if available
        """
        prefixes = """
          PREFIX schema: <https://schema.org/>
          PREFIX parallelpedia: <https://parallelpedia.org/schema/>
        """
        # Prefer explicit topicId match
        candidates = [
            f"""
            {prefixes}
            SELECT ?asset ?ual WHERE {{
              ?asset schema:topicId "{topic_id}" .
              OPTIONAL {{ ?asset schema:identifier ?ual . }}
            }}
            LIMIT 1
            """,
            f"""
            {prefixes}
            SELECT ?asset ?ual WHERE {{
              ?asset schema:name "{topic_id.replace("_", " ")}" .
              OPTIONAL {{ ?asset schema:identifier ?ual . }}
            }}
            LIMIT 1
            """,
        ]
        for q in candidates:
            try:
                result = await self.query_sparql(q)
                rows = (result or {}).get("data") or []
                if rows:
                    row = rows[0]
                    ual = (row.get("ual") or {}).get("value") or (row.get("asset") or {}).get("value")
                    if ual:
                        return ual
            except Exception:
                continue
        return None
    
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
    
    async def publish_community_note(self, note: CommunityNote, provenance: Optional[dict] = None) -> Optional[str]:
        """
        Publish a Community Note as a Knowledge Asset.
        
        Args:
            note: CommunityNote to publish
            provenance: Optional provenance metadata to include in the asset
            
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
            publish_url = f"{self.base_url}/parallelpedia/community-notes"
            print(f"[DKG publish] Connecting to DKG node server at: {self.base_url}")
            print(f"[DKG publish] Publishing to: {publish_url}")
            
            response = await self.client.post(
                publish_url,
                json={
                    "topicId": note.topic_id,
                    "trustScore": note.trust_score,
                    "summary": note.summary,
                    "labelsCount": note.labels_count,
                    "keyExamples": note.key_examples,
                    "grokTitle": note.grok_title,
                    "wikiTitle": note.wiki_title,
                    "provenance": provenance or {}
                }
            )
            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as http_err:
                # Bubble up richer server error details for easier debugging
                body_text = ""
                try:
                    body_text = response.text
                except Exception:
                    pass
                print(f"[DKG publish] HTTP error {http_err.response.status_code}: {body_text}")
                return None
            result = response.json()
            
            # Log the full response from DKG node server
            print("=" * 80)
            print("[DKG publish] Full response from DKG node server:")
            print(json.dumps(result, indent=2))
            print("=" * 80)
            
            # Extract UAL from response
            ual = result.get("ual") or result.get("UAL") or result.get("asset_id")
            
            if result.get("success") and ual:
                print(f"✅ [DKG publish] SUCCESS! Community Note published with UAL: {ual}")
                print(f"📋 [DKG publish] UAL (Unique Asset Locator): {ual}")
                print(f"🔗 [DKG publish] Verify asset: GET http://localhost:9200/api/dkg/assets?ual={ual}")
                return ual
            
            # Log any error from plugin
            print(f"❌ [DKG publish] Failed: {result}")
            if not result.get("success"):
                error_msg = result.get("error", "Unknown error")
                print(f"   Error message: {error_msg}")
            return None
        except httpx.ConnectError as e:
            print(f"\n❌ [DKG publish] CONNECTION ERROR: Cannot connect to DKG node server!")
            print(f"   Attempted URL: {self.base_url}")
            print(f"   Error: {e}")
            print(f"\n   🔧 SOLUTION: Make sure the DKG node server is running:")
            print(f"      1. Navigate to: dkg-node/apps/agent")
            print(f"      2. Run: npm run dev")
            print(f"      3. Wait for: 'Server running at http://localhost:9200/'")
            print(f"      4. Then try publishing again\n")
            return None
        except httpx.ReadTimeout as e:
            print(f"[DKG publish] ReadTimeout: The DKG node server took too long to respond.")
            print(f"  This usually means the OT-Node connection is slow or the blockchain operation is taking longer than expected.")
            print(f"  Current timeout: 30 minutes. If this persists, the DKG node server may need more time.")
            print(f"  Error details: {e}")
            return None
        except httpx.TimeoutException as e:
            print(f"[DKG publish] TimeoutException: Request timed out.")
            print(f"  Error details: {e}")
            return None
        except Exception as e:
            print(f"❌ [DKG publish] Error publishing community note: {e}")
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

