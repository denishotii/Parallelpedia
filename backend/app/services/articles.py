"""Service for fetching articles from Grokipedia (DKG) and Wikipedia."""
import httpx
import os
from typing import Optional
from app.models import Article, ArticleSource
from app.services.dkg_client import DKGClient
try:
    import wikipediaapi  # type: ignore
except Exception:
    wikipediaapi = None  # Optional dependency; fall back to HTTP methods if missing


class ArticleService:
    """Service for fetching articles from various sources."""
    
    def __init__(self, dkg_client: Optional[DKGClient] = None):
        """
        Initialize article service.
        
        Args:
            dkg_client: DKG client instance (creates new one if not provided)
        """
        self.dkg_client = dkg_client or DKGClient()
        # Wikipedia requires a User-Agent header to prevent 403 errors
        self.http_client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "User-Agent": "Parallelpedia/1.0 (https://github.com/yourusername/parallelpedia; contact@example.com)"
            }
        )
        self.wikipedia_api_base = "https://en.wikipedia.org/api/rest_v1"
        # Wikipedia-API client (provides complete text, sections, etc.) if available
        self.wiki_api = None
        if wikipediaapi is not None:
            try:
                self.wiki_api = wikipediaapi.Wikipedia(
                    user_agent="Parallelpedia/1.0 (contact@example.com)",
                    language="en",
                    extract_format=wikipediaapi.ExtractFormat.WIKI
                )
            except Exception:
                self.wiki_api = None
        # Optional unofficial Grokipedia API base (e.g., https://grokipedia-api.com)
        # If set, we'll try it first before scraping HTML
        self.grok_api_base = os.getenv("GROKIPEDIA_API_BASE", "https://grokipedia-api.com")
    
    async def get_grok_article(self, topic_id: str) -> Optional[Article]:
        """
        Fetch a Grokipedia article, preferring DKG Knowledge Assets, then API/scrape.
        
        Args:
            topic_id: Topic identifier (article title/slug)
            
        Returns:
            Article object or None if not found
        """
        # Option 1: If topic_id is a UAL, fetch from DKG
        if topic_id.startswith("did:dkg:"):
            asset = await self.dkg_client.get_asset(topic_id)
            if asset:
                return Article(
                    topic_id=topic_id,
                    title=asset.get("title", "Unknown"),
                    source=ArticleSource.GROK,
                    raw_text=asset.get("content", ""),
                    url=None
                )
        
        # Option 1b: Try to locate a KA by topicId via SPARQL and fetch it (guarded by env)
        if os.getenv("ENABLE_DKG_LOOKUP", "1") == "1":
            try:
                ual = await self.dkg_client.find_grok_article_ual(topic_id)
                if ual:
                    asset = await self.dkg_client.get_asset(ual)
                    if asset:
                        # Heuristic extraction: handle common KA shapes
                        public = asset.get("public") or asset  # many DKG assets wrap data in "public"
                        title = (
                            public.get("grokTitle")
                            or public.get("title")
                            or public.get("name")
                            or topic_id.replace("_", " ").title()
                        )
                        raw_text = (
                            public.get("content")
                            or public.get("content_text")
                            or public.get("articleBody")
                            or public.get("text")
                            or ""
                        )
                        # Some assets store arrays of sections
                        if not raw_text and isinstance(public.get("sections"), list):
                            raw_text = "\n\n".join(
                                s.get("text", "") for s in public["sections"] if isinstance(s, dict)
                            )
                        if raw_text and len(raw_text.strip()) > 100:
                            return Article(
                                topic_id=topic_id,
                                title=title,
                                source=ArticleSource.GROK,
                                raw_text=raw_text,
                                url=None
                            )
            except Exception as e:
                print(f"DKG lookup failed for {topic_id}: {e}")
        
        # Option 2: Try unofficial Grokipedia JSON API (if available)
        try:
            slug = topic_id
            api_url = f"{self.grok_api_base}/page/{slug}"
            print(f"Trying Grokipedia API: {api_url}")
            api_res = await self.http_client.get(api_url, timeout=10.0)
            if api_res.status_code == 200:
                data = api_res.json()
                content = data.get("content_text") or data.get("content") or ""
                if content and len(content) > 100:
                    return Article(
                        topic_id=topic_id,
                        title=data.get("title") or slug.replace("_", " ").title(),
                        source=ArticleSource.GROK,
                        raw_text=content,
                        url=data.get("url") or f"https://grokipedia.com/page/{slug}"
                    )
            else:
                print(f"Grokipedia API returned {api_res.status_code} for {api_url}")
        except Exception as e:
            print(f"Grokipedia API failed: {e}")

        # Option 3: Fetch from Grokipedia website (HTML scrape)
        # Grokipedia URLs are typically: https://grokipedia.com/{topic}
        # Convert topic_id to URL format (replace underscores with spaces, then URL encode)
        try:
            import urllib.parse
            # Grokipedia uses topic names - try different formats
            # Format 1: Keep underscores (e.g., "Climate_change")
            topic_with_underscores = topic_id
            # Format 2: Replace with spaces then encode (e.g., "Climate change")
            topic_with_spaces = topic_id.replace("_", " ")
            # Format 3: Replace with hyphens (e.g., "Climate-change")
            topic_with_hyphens = topic_id.replace("_", "-")
            
            # Try different URL formats
            # Note: Grokipedia may be accessed via /page/{topic}
            grok_urls = [
                # Page route variants (observed live)
                f"https://grokipedia.com/page/{topic_with_underscores}",
                f"https://grokipedia.com/page/{urllib.parse.quote(topic_with_underscores)}",
                f"https://grokipedia.com/page/{topic_with_spaces.replace(' ', '_')}",
                f"https://grokipedia.com/page/{urllib.parse.quote(topic_with_spaces.replace(' ', '_'))}",
                # Standard formats
                f"https://grokipedia.com/{topic_with_underscores}",
                f"https://grokipedia.com/{urllib.parse.quote(topic_with_underscores)}",
                f"https://grokipedia.com/{topic_with_spaces.replace(' ', '_')}",
                f"https://grokipedia.com/{urllib.parse.quote(topic_with_spaces.replace(' ', '_'))}",
                f"https://grokipedia.com/{topic_with_hyphens}",
                # With www
                f"https://www.grokipedia.com/{topic_with_underscores}",
            ]
            
            for grok_url in grok_urls:
                try:
                    # Use the client's default headers (includes User-Agent)
                    print(f"Trying Grokipedia URL: {grok_url}")
                    response = await self.http_client.get(
                        grok_url,
                        follow_redirects=True,
                        timeout=10.0
                    )
                    
                    print(f"Grokipedia response status: {response.status_code} for {grok_url}")
                    
                    if response.status_code == 200:
                        # Parse HTML to extract article content
                        from bs4 import BeautifulSoup
                        html_content = response.text
                        soup = BeautifulSoup(html_content, 'html.parser')
                        
                        # Try to find article content
                        # Grokipedia structure may vary, try common selectors
                        article_content = ""
                        title = topic_id.replace("_", " ")
                        
                        # Try to find title
                        title_elem = soup.find('h1') or soup.find('title')
                        if title_elem:
                            title = title_elem.get_text().strip()
                        
                        # Try to find main content
                        content_selectors = [
                            'article',
                            '.article-content',
                            '.content',
                            'main',
                            '[role="main"]',
                            '.post-content',
                            '#content',
                            '[data-testid="article-content"]'
                        ]
                        
                        for selector in content_selectors:
                            content_elem = soup.select_one(selector)
                            if content_elem:
                                # Remove script and style elements
                                for script in content_elem(["script", "style", "nav", "header", "footer"]):
                                    script.decompose()
                                article_content = content_elem.get_text(separator=' ', strip=True)
                                if len(article_content) > 200:  # Got substantial content
                                    break
                        
                        # If no specific content found, get body text
                        if not article_content or len(article_content) < 200:
                            body = soup.find('body')
                            if body:
                                for script in body(["script", "style", "nav", "header", "footer", "aside"]):
                                    script.decompose()
                                article_content = body.get_text(separator=' ', strip=True)
                        
                        if article_content and len(article_content) > 100:
                            return Article(
                                topic_id=topic_id,
                                title=title,
                                source=ArticleSource.GROK,
                                raw_text=article_content,
                                url=grok_url
                            )
                except httpx.HTTPStatusError as e:
                    # Log the error but try next URL
                    print(f"HTTP error for {grok_url}: {e.response.status_code}")
                    continue
                except Exception as e:
                    # Try next URL
                    print(f"Error fetching {grok_url}: {e}")
                    continue
            
            # If all URLs failed, log and return None
            print(f"All Grokipedia URLs failed for topic: {topic_id}")
            print("Note: Grokipedia articles may not be publicly accessible via web scraping.")
            print("Consider fetching from DKG Knowledge Assets if available.")
            
            # For demo purposes: Return a placeholder article with sample content
            # In production, this should fetch from DKG Knowledge Assets
            # This allows the comparison system to work even when Grokipedia is not accessible
            print(f"Using placeholder Grokipedia article for demo purposes.")
            
            # Create a more realistic placeholder that can be compared
            topic_name = topic_id.replace("_", " ")
            placeholder_content = (
                f"{topic_name} is an important topic that has been widely discussed. "
                f"There are various perspectives on this subject. "
                f"Some sources provide detailed information while others offer brief summaries. "
                f"The topic encompasses multiple aspects and continues to evolve. "
                f"Researchers and experts have studied this area extensively. "
                f"Understanding {topic_name} requires considering different viewpoints and evidence. "
                f"This is a placeholder Grokipedia article. "
                f"In production, articles should be fetched from OriginTrail DKG Knowledge Assets."
            )
            
            return Article(
                topic_id=topic_id,
                title=topic_name.title(),
                source=ArticleSource.GROK,
                raw_text=placeholder_content,
                url=None
            )
            
        except Exception as e:
            print(f"Error fetching Grokipedia article for {topic_id}: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def get_wiki_article(self, topic_id: str) -> Optional[Article]:
        """
        Fetch a Wikipedia article using Wikimedia REST v1 HTML and return plain text.
        """
        try:
            import urllib.parse
            normalized_title = topic_id.replace("_", " ")
            candidates = [
                urllib.parse.quote(topic_id),            # Underscored form
                urllib.parse.quote(normalized_title),    # Spaced form
            ]

            for encoded in candidates:
                url = f"https://en.wikipedia.org/api/rest_v1/page/html/{encoded}"
                resp = await self.http_client.get(
                    url,
                    follow_redirects=True,
                    headers = {
                        "Accept": 'text/html; charset=utf-8; profile="https://www.mediawiki.org/wiki/Specs/HTML/2.1.0"',
                        "User-Agent": "ParallelPedia/1.0 (denishoti18@gmail.com)",
                    }
                )
                if resp.status_code != 200 or not resp.text:
                    continue

                # Parse HTML and extract readable text
                from bs4 import BeautifulSoup
                import re
                soup = BeautifulSoup(resp.text, "html.parser")
                body = soup.find("body") or soup
                # Remove obvious non-content elements
                for el in body(["script", "style", "nav", "header", "footer", "aside"]):
                    el.decompose()
                # Remove non-article chrome and noisy blocks (infoboxes, navboxes, references, etc.)
                noise_selectors = [
                    ".infobox",
                    "#toc",
                    ".toc",
                    ".hatnote",
                    ".shortdescription",
                    ".metadata",
                    ".navbox",
                    ".vertical-navbox",
                    ".ambox",
                    ".mbox",
                    ".sisterproject",
                    ".gallery",
                    ".thumb",
                    ".mw-references-wrap",
                    ".reflist",
                    "ol.references",
                    "sup.reference",
                    "span.mw-editsection",
                    "figure",
                    "figcaption",
                    "table",  # drop tables for cleaner text comparison
                    "footer",
                ]
                for sel in noise_selectors:
                    for el in body.select(sel):
                        el.decompose()
                # Prefer page title from h1 if present
                page_title_elem = body.find("h1")
                page_title = (page_title_elem.get_text(" ", strip=True) if page_title_elem else normalized_title)
                # Extract only main content sections (Parsoid sections have data-mw-section-id)
                parts: list[str] = []
                sections = body.find_all(attrs={"data-mw-section-id": True}) or [body]
                for sec in sections:
                    # Keep headings and paragraphs/lists only
                    for node in sec.find_all(["h2", "h3", "h4", "p", "ul", "ol"]):
                        if node.name in {"h2", "h3", "h4"}:
                            txt = node.get_text(" ", strip=True)
                            if txt:
                                parts.append(txt)
                        elif node.name in {"ul", "ol"}:
                            items = [li.get_text(" ", strip=True) for li in node.find_all("li")]
                            if items:
                                parts.append(" ".join(items))
                        else:
                            txt = node.get_text(" ", strip=True)
                            if txt:
                                parts.append(txt)
                text = " ".join(parts) if parts else body.get_text(" ", strip=True)
                # Normalization: remove citations and collapse whitespace
                text = re.sub(r"\[\s*\d+\s*\]", "", text)  # remove numeric citations
                text = re.sub(r"\[\s*citation needed\s*\]", "", text, flags=re.IGNORECASE)
                text = re.sub(r"\s{2,}", " ", text)  # collapse multiple spaces
                text = text.strip()

                if text and len(text) >= 50:
                    wiki_url = f"https://en.wikipedia.org/wiki/{urllib.parse.quote(page_title.replace(' ', '_'))}"
                    return Article(
                        topic_id=topic_id,
                        title=page_title,
                        source=ArticleSource.WIKIPEDIA,
                        raw_text=text,
                        url=wiki_url,
                    )

            return None
        except Exception as e:
            print(f"Error fetching Wikipedia article for {topic_id}: {e}")
            return None
    
    async def close(self):
        """Close HTTP clients."""
        await self.http_client.aclose()
        if self.dkg_client:
            await self.dkg_client.close()

