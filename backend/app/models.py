"""Data models for Parallelpedia."""
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class ArticleSource(str, Enum):
    """Article source types."""
    GROK = "grok"
    WIKIPEDIA = "wikipedia"


class Article(BaseModel):
    """Represents an article from either Grokipedia or Wikipedia."""
    topic_id: str
    title: str
    source: ArticleSource
    raw_text: str
    url: Optional[str] = None


class SegmentLabel(str, Enum):
    """Labels for segment comparison."""
    ALIGNED = "aligned"
    MISSING_CONTEXT = "missing_context"
    CONFLICT = "conflict"
    UNSUPPORTED = "unsupported"


class SegmentComparison(BaseModel):
    """Represents a comparison between a Grokipedia segment and Wikipedia."""
    segment_id: str
    text: str
    label: SegmentLabel
    similarity_score: float = Field(ge=0.0, le=1.0)
    matched_wiki_sentences: Optional[List[str]] = None


class TopicAnalysis(BaseModel):
    """Complete analysis of a topic comparing Grokipedia vs Wikipedia."""
    topic_id: str
    grok_title: str
    wiki_title: str
    trust_score: float = Field(ge=0.0, le=100.0)
    summary: str
    segment_comparisons: List[SegmentComparison]
    labels_count: dict[str, int] = Field(default_factory=dict)


class CommunityNote(BaseModel):
    """Community Note to be published as a Knowledge Asset."""
    topic_id: str
    trust_score: float = Field(ge=0.0, le=100.0)
    summary: str
    labels_count: dict[str, int]
    key_examples: List[dict[str, str]] = Field(default_factory=list)
    grok_title: str
    wiki_title: str

