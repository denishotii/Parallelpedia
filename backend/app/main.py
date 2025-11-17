"""Main FastAPI application for Parallelpedia."""
import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Optional

# Load environment variables from .env file
from dotenv import load_dotenv

# Load .env file from backend directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

from app.models import Article, TopicAnalysis, CommunityNote
from app.services.articles import ArticleService
from app.services.comparison import ComparisonService
from app.services.dkg_client import DKGClient
from app.services.llm_client import LLMClient


# Global services
article_service: Optional[ArticleService] = None
comparison_service: Optional[ComparisonService] = None
dkg_client: Optional[DKGClient] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan."""
    global article_service, comparison_service, dkg_client
    
    # Check if OpenAI API key is loaded
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        # Mask the key for security (show first 7 and last 4 chars)
        masked_key = f"{openai_key[:7]}...{openai_key[-4:]}" if len(openai_key) > 11 else "***"
        print(f"✅ OpenAI API key loaded: {masked_key}")
    else:
        print("⚠️  Warning: OPENAI_API_KEY not found in environment variables.")
        print("   The app will use sentence-transformers for embeddings (still good quality).")
        print("   To enable GPT-4 classification, set OPENAI_API_KEY in your .env file.")
    
    # Initialize services
    llm_client = LLMClient()
    if llm_client.is_available():
        print("✅ LLM client initialized and ready (OpenAI embeddings + GPT-4 classification enabled)")
        print("   GPT will be used for topic relevance checking and intelligent classification")
    else:
        print("ℹ️  LLM client using fallback mode (sentence-transformers for embeddings)")
        print("   Set OPENAI_API_KEY in .env to enable GPT-4 topic relevance checking")
    
    dkg_client = DKGClient()
    article_service = ArticleService(dkg_client=dkg_client)
    comparison_service = ComparisonService(llm_client=llm_client)
    
    yield
    
    # Cleanup
    await article_service.close()


app = FastAPI(
    title="Parallelpedia API",
    description="API for comparing Grokipedia and Wikipedia articles",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Parallelpedia API",
        "version": "1.0.0",
        "description": "Auditing AI encyclopedias, one article at a time."
    }


@app.get("/api/topics/{topic_id}/grok", response_model=Article)
async def get_grok_article(topic_id: str):
    """Fetch Grokipedia article for a topic."""
    if not article_service:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    article = await article_service.get_grok_article(topic_id)
    if not article:
        raise HTTPException(status_code=404, detail="Grokipedia article not found")
    
    return article


@app.get("/api/topics/{topic_id}/wikipedia", response_model=Article)
async def get_wikipedia_article(topic_id: str):
    """Fetch Wikipedia article for a topic."""
    if not article_service:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    article = await article_service.get_wiki_article(topic_id)
    if not article:
        raise HTTPException(status_code=404, detail="Wikipedia article not found")
    
    return article


@app.post("/api/topics/{topic_id}/compare", response_model=TopicAnalysis)
async def compare_topic(topic_id: str):
    """Compare Grokipedia and Wikipedia articles for a topic."""
    if not article_service or not comparison_service:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    # Fetch both articles
    grok_article = await article_service.get_grok_article(topic_id)
    wiki_article = await article_service.get_wiki_article(topic_id)
    
    # Provide helpful error messages
    # Note: get_grok_article now returns a placeholder if scraping fails,
    # so this check should rarely trigger unless there's a different error
    if not grok_article:
        raise HTTPException(
            status_code=404, 
            detail=f"Grokipedia article not found for '{topic_id}'. "
                   f"This could mean:\n"
                   f"1. The article doesn't exist on Grokipedia\n"
                   f"2. Grokipedia is not publicly accessible via web scraping\n"
                   f"3. The article may be available in DKG Knowledge Assets (check with UAL)\n"
                   f"Please try a different topic or check if the article exists on Grokipedia."
        )
    if not wiki_article:
        raise HTTPException(
            status_code=404, 
            detail=f"Wikipedia article not found for '{topic_id}'. "
                   f"Please check the topic name (use underscores, e.g., 'Climate_change')."
        )
    
    # Validate articles have content
    if not grok_article.raw_text or len(grok_article.raw_text.strip()) < 50:
        raise HTTPException(
            status_code=422,
            detail=f"Grokipedia article for '{topic_id}' has insufficient content to compare."
        )
    if not wiki_article.raw_text or len(wiki_article.raw_text.strip()) < 50:
        raise HTTPException(
            status_code=422,
            detail=f"Wikipedia article for '{topic_id}' has insufficient content to compare."
        )
    
    # Compare
    try:
        analysis = comparison_service.compare_articles(grok_article, wiki_article)
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error during comparison: {str(e)}"
        )


@app.post("/api/topics/{topic_id}/community-note", response_model=dict)
async def publish_community_note(topic_id: str):
    """Publish a Community Note for a topic to DKG."""
    if not article_service or not comparison_service or not dkg_client:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    # Get analysis first
    grok_article = await article_service.get_grok_article(topic_id)
    wiki_article = await article_service.get_wiki_article(topic_id)
    
    if not grok_article or not wiki_article:
        raise HTTPException(status_code=404, detail="Articles not found")
    
    analysis = comparison_service.compare_articles(grok_article, wiki_article)
    
    # Create Community Note
    community_note = CommunityNote(
        topic_id=topic_id,
        trust_score=analysis.trust_score,
        summary=analysis.summary,
        labels_count=analysis.labels_count,
        key_examples=[
            {
                "text": comp.text[:200],
                "label": comp.label.value
            }
            for comp in analysis.segment_comparisons[:5]  # Top 5 examples
        ],
        grok_title=analysis.grok_title,
        wiki_title=analysis.wiki_title
    )
    
    # Build provenance with simple input hash
    try:
        import hashlib
        payload_for_hash = {
            "topic_id": topic_id,
            "grok_title": analysis.grok_title,
            "wiki_title": analysis.wiki_title,
            "labels_count": analysis.labels_count,
            "trust_score": analysis.trust_score,
        }
        input_hash = hashlib.sha256(
            str(payload_for_hash).encode("utf-8")
        ).hexdigest()
    except Exception:
        input_hash = None
    
    provenance = {
        "createdBy": "Parallelpedia",
        "version": "1.0.0",
        "inputHash": input_hash,
        "sources": {
            "grokUrl": grok_article.url,
            "wikiUrl": wiki_article.url,
        },
    }
    
    # Publish to DKG
    print(f"\n{'='*80}")
    print(f"🚀 [Backend] Publishing Community Note for topic: {topic_id}")
    print(f"{'='*80}\n")
    
    asset_id = await dkg_client.publish_community_note(community_note, provenance=provenance)
    
    if not asset_id:
        raise HTTPException(status_code=500, detail="Failed to publish to DKG")
    
    print(f"\n{'='*80}")
    print(f"✅ [Backend] Community Note published successfully!")
    print(f"📋 [Backend] UAL (Unique Asset Locator): {asset_id}")
    print(f"🔗 [Backend] Verify asset: GET http://localhost:9200/api/dkg/assets?ual={asset_id}")
    print(f"{'='*80}\n")
    
    return {
        "success": True,
        "ual": asset_id,  # Also include as 'ual' for consistency
        "asset_id": asset_id,
        "community_note": community_note.model_dump(),
        "verification_url": f"http://localhost:9200/api/dkg/assets?ual={asset_id}"
    }


@app.get("/api/topics/{topic_id}/community-note", response_model=CommunityNote)
async def get_community_note(topic_id: str):
    """Get Community Note for a topic (MCP endpoint)."""
    if not dkg_client:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    note = await dkg_client.get_community_note(topic_id)
    
    if not note:
        raise HTTPException(status_code=404, detail="Community note not found")
    
    return note


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "services": {
            "article_service": article_service is not None,
            "comparison_service": comparison_service is not None,
            "dkg_client": dkg_client is not None
        }
    }

