"""Service for fetching articles from Grokipedia (DKG) and Wikipedia."""
import httpx
import os
from typing import Optional
from app.models import Article, ArticleSource
from app.services.dkg_client import DKGClient


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
        # Optional unofficial Grokipedia API base (e.g., https://grokipedia-api.com)
        # If set, we'll try it first before scraping HTML
        self.grok_api_base = os.getenv("GROKIPEDIA_API_BASE", "https://grokipedia-api.com")
    
    async def get_grok_article(self, topic_id: str) -> Optional[Article]:
        """
        Fetch a Grokipedia article from Grokipedia website.
        
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
        Fetch a Wikipedia article with full content.
        
        Args:
            topic_id: Topic identifier (Wikipedia article title)
            
        Returns:
            Article object or None if not found
        """
        try:
            # Normalize title
            title = topic_id.replace("_", " ")
            import urllib.parse
            encoded_title = urllib.parse.quote(title)

            # 0) Force full article via Wikimedia Core REST API (HTML)
            # https://api.wikimedia.org/core/v1/wikipedia/en/page/{title}/html
            core_html = await self.http_client.get(
                f"https://api.wikimedia.org/core/v1/wikipedia/en/page/{encoded_title}/html",
                follow_redirects=True
            )
            if core_html.status_code == 200 and core_html.text:
                try:
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(core_html.text, "html.parser")
                    # Remove non-content elements
                    for el in soup(["script", "style", "nav", "header", "footer", "aside", "figure", "figcaption"]):
                        el.decompose()

                    parts: list[str] = []
                    for node in soup.find_all(["h1","h2","h3","h4","p","ul","ol","table"]):
                        name = node.name or ""
                        if name in {"h1","h2","h3","h4"}:
                            txt = node.get_text(" ", strip=True)
                            if txt:
                                parts.append(f"\n\n{txt}\n")
                        elif name in {"ul","ol"}:
                            items = [li.get_text(" ", strip=True) for li in node.find_all("li")]
                            if items:
                                parts.append("\n" + "\n".join(f"• {it}" for it in items))
                        elif name == "table":
                            cells = [c.get_text(" ", strip=True) for c in node.find_all(["th","td"])][:60]
                            if cells:
                                parts.append("\n" + " | ".join(cells))
                        else:
                            txt = node.get_text(" ", strip=True)
                            if txt:
                                parts.append(txt)

                    text = "\n".join(parts).strip()
                    if text and len(text) > 500:
                        wiki_url = f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}"
                        return Article(
                            topic_id=topic_id,
                            title=title,
                            source=ArticleSource.WIKIPEDIA,
                            raw_text=text,
                            url=wiki_url
                        )
                except Exception:
                    pass

            # 1) Preferred: REST mobile-html → extract rich full text (headings, paragraphs, lists, table text)
            mobile_html = await self.http_client.get(
                f"{self.wikipedia_api_base}/page/mobile-html/{encoded_title}",
                follow_redirects=True
            )
            if mobile_html.status_code == 200 and mobile_html.text:
                try:
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(mobile_html.text, "html.parser")
                    # Remove non-content elements
                    for el in soup(["script", "style", "nav", "header", "footer", "aside", "figure", "figcaption"]):
                        el.decompose()

                    parts: list[str] = []
                    # Collect content in reading order: headings, paragraphs, lists, simple table text
                    for node in soup.find_all(["h1","h2","h3","h4","p","ul","ol","table"]):
                        name = node.name or ""
                        if name in {"h1","h2","h3","h4"}:
                            txt = node.get_text(" ", strip=True)
                            if txt:
                                parts.append(f"\n\n{txt}\n")
                        elif name in {"ul","ol"}:
                            items = [li.get_text(" ", strip=True) for li in node.find_all("li")]
                            if items:
                                parts.append("\n" + "\n".join(f"• {it}" for it in items))
                        elif name == "table":
                            # Extract simple cell texts to avoid losing key facts
                            cells = [c.get_text(" ", strip=True) for c in node.find_all(["th","td"])][:60]
                            if cells:
                                parts.append("\n" + " | ".join(cells))
                        else:  # paragraph or other
                            txt = node.get_text(" ", strip=True)
                            if txt:
                                parts.append(txt)

                    text = "\n".join(parts).strip()
                    if text and len(text) > 500:
                        wiki_url = f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}"
                        return Article(
                            topic_id=topic_id,
                            title=title,
                            source=ArticleSource.WIKIPEDIA,
                            raw_text=text,
                            url=wiki_url
                        )
                except Exception as _:
                    pass

            # 2) Fallback: REST plain text (entire article in plain text)
            plain_resp = await self.http_client.get(
                f"{self.wikipedia_api_base}/page/plain/{encoded_title}",
                follow_redirects=True
            )
            if plain_resp.status_code == 200 and plain_resp.text and len(plain_resp.text.strip()) > 200:
                wiki_url = f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}"
                return Article(
                    topic_id=topic_id,
                    title=title,
                    source=ArticleSource.WIKIPEDIA,
                    raw_text=plain_resp.text,
                    url=wiki_url
                )

            # 3) Last resort: MediaWiki extracts API (plaintext)
            mediawiki_url = "https://en.wikipedia.org/w/api.php"
            params = {
                "action": "query",
                "format": "json",
                "titles": title,
                "prop": "extracts",
                "explaintext": "true",
                "exintro": "false",
                "exsectionformat": "plain",
            }
            wiki_response = await self.http_client.get(mediawiki_url, params=params)
            wiki_response.raise_for_status()
            wiki_data = wiki_response.json()

            pages = wiki_data.get("query", {}).get("pages", {})
            page_content = ""
            page_title = title
            for page_id, page_data in pages.items():
                if int(page_id) < 0:
                    return None
                page_content = page_data.get("extract", "")
                page_title = page_data.get("title", title)
                break

            if not page_content or len(page_content.strip()) < 50:
                return None

            wiki_url = f"https://en.wikipedia.org/wiki/{urllib.parse.quote(page_title.replace(' ', '_'))}"
            return Article(
                topic_id=topic_id,
                title=page_title,
                source=ArticleSource.WIKIPEDIA,
                raw_text=page_content,
                url=wiki_url
            )
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            raise
        except Exception as e:
            print(f"Error fetching Wikipedia article for {topic_id}: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def close(self):
        """Close HTTP clients."""
        await self.http_client.aclose()
        if self.dkg_client:
            await self.dkg_client.close()

