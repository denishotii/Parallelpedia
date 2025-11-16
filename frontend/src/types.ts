export enum ArticleSource {
  GROK = "grok",
  WIKIPEDIA = "wikipedia",
}

export enum SegmentLabel {
  ALIGNED = "aligned",
  MISSING_CONTEXT = "missing_context",
  CONFLICT = "conflict",
  UNSUPPORTED = "unsupported",
}

export interface Article {
  topic_id: string;
  title: string;
  source: ArticleSource;
  raw_text: string;
  url?: string;
}

export interface SegmentComparison {
  segment_id: string;
  text: string;
  label: SegmentLabel;
  similarity_score: number;
  matched_wiki_sentences?: string[];
}

export interface TopicAnalysis {
  topic_id: string;
  grok_title: string;
  wiki_title: string;
  trust_score: number;
  summary: string;
  segment_comparisons: SegmentComparison[];
  labels_count: Record<string, number>;
}

export interface CommunityNote {
  topic_id: string;
  trust_score: number;
  summary: string;
  labels_count: Record<string, number>;
  key_examples: Array<{ text: string; label: string }>;
  grok_title: string;
  wiki_title: string;
}

