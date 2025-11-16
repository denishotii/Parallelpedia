# Parallelpedia Comparison Logic

## What Makes Our Comparison Unique

Parallelpedia uses a **multi-layered comparison approach** that goes beyond simple text similarity to detect nuanced differences between Grokipedia (AI-generated) and Wikipedia (human-curated) content.

### 1. **Semantic Similarity Analysis (TF-IDF + Cosine Similarity)**

**What it does:**
- Breaks articles into sentence-level segments
- Uses TF-IDF (Term Frequency-Inverse Document Frequency) vectorization to identify important terms
- Calculates cosine similarity between corresponding segments
- Identifies which segments align, diverge, or conflict

**Why it's unique:**
- Not just word matching - understands semantic importance
- Handles synonyms and paraphrasing
- Detects when same concepts are expressed differently

### 2. **Four-Tier Classification System**

Each segment is classified into one of four categories:

#### ✅ **ALIGNED** (High Trust)
- Similarity score ≥ 0.7
- Content matches Wikipedia closely
- Same facts, similar presentation
- **Trust Weight: +1.0**

#### ⚠️ **MISSING_CONTEXT** (Moderate Trust)
- Similarity score 0.3 - 0.7
- Related content but missing important details
- Partial information or simplified explanations
- **Trust Weight: +0.6**

#### ✗ **CONFLICT** (Low Trust)
- Similarity score 0.1 - 0.3
- Contradictory facts or different interpretations
- Detected through:
  - Different numbers/dates for same topic
  - Conflicting claims with high word overlap
  - Opposing viewpoints
- **Trust Weight: -0.5**

#### ? **UNSUPPORTED** (Very Low Trust)
- Similarity score < 0.1
- Content not found in Wikipedia
- Potential hallucinations or unsourced claims
- **Trust Weight: +0.3**

### 3. **Factual Conflict Detection**

**Unique Heuristic:**
- Extracts numbers, dates, and statistics from both sources
- Compares numerical claims about the same topic
- Detects when high semantic overlap exists but facts differ
- Flags potential misinformation or bias

**Example:**
- Grokipedia: "Climate change affects 50% of the population"
- Wikipedia: "Climate change affects billions of people globally"
- **Detection:** Both mention "climate change" and "population" but numbers differ significantly

### 4. **Weighted Trust Score Calculation**

**Formula:**
```
Trust Score = Σ(Label Weight × Similarity Adjustment) / Total Weight × 100
```

**Features:**
- Adjusts weights based on similarity scores
- Penalizes conflicts more than missing context
- Rewards high alignment
- Normalizes to 0-100 scale

**Why it matters:**
- Not just counting differences - **quantifies trust**
- Accounts for severity of discrepancies
- Provides actionable trust metrics for AI systems

### 5. **Segment-Level Granularity**

**Unlike simple document comparison:**
- Analyzes at sentence/paragraph level
- Identifies specific problematic segments
- Provides examples of discrepancies
- Enables targeted fact-checking

### 6. **Bias Detection Indicators**

**Detects:**
- **Tone differences:** Neutral vs. opinionated language
- **Omission patterns:** What Grokipedia leaves out
- **Emphasis shifts:** What gets highlighted vs. downplayed
- **Source attribution:** Missing citations in Grokipedia

### 7. **Context-Aware Matching**

**Smart Matching:**
- Doesn't require exact word matches
- Understands that "global warming" ≈ "climate change"
- Matches concepts even when wording differs
- Handles technical vs. layperson language

## Comparison Workflow

1. **Fetch Articles**
   - Wikipedia: Full article text via MediaWiki API
   - Grokipedia: Scraped from website or fetched from DKG

2. **Preprocessing**
   - Clean and normalize text
   - Split into meaningful segments (sentences/paragraphs)
   - Remove noise (headers, footers, navigation)

3. **Vectorization**
   - Convert text to TF-IDF vectors
   - Identify important terms
   - Create semantic representations

4. **Similarity Calculation**
   - Compare each Grokipedia segment with all Wikipedia segments
   - Find best matches
   - Calculate similarity scores

5. **Classification**
   - Apply thresholds to classify segments
   - Detect conflicts using heuristics
   - Identify unsupported claims

6. **Trust Score Calculation**
   - Weight each segment by its classification
   - Aggregate into overall trust score
   - Generate summary

7. **Community Note Generation**
   - Extract key examples of discrepancies
   - Create structured summary
   - Prepare for DKG publishing

## Advantages Over Simple Text Comparison

1. **Semantic Understanding:** Not fooled by paraphrasing
2. **Granular Analysis:** Identifies specific problematic areas
3. **Trust Quantification:** Provides actionable trust scores
4. **Bias Detection:** Flags potential bias patterns
5. **Conflict Identification:** Detects factual contradictions
6. **Context Preservation:** Maintains meaning across different phrasings

## Future Enhancements

- **LLM-Based Analysis:** Use embeddings for deeper semantic understanding
- **Citation Verification:** Check if Grokipedia claims are cited
- **Historical Tracking:** Monitor how trust scores change over time
- **Bias Scoring:** Quantify political/social bias
- **Fact Verification:** Cross-reference with external fact-checking databases

## Use Cases

1. **AI Alignment:** Help AI systems identify unreliable sources
2. **Content Moderation:** Flag potentially misleading AI-generated content
3. **Research:** Study differences between AI and human-curated knowledge
4. **Education:** Teach critical thinking about AI-generated content
5. **Transparency:** Provide verifiable trust metrics for AI systems

