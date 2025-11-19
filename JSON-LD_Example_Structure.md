# Example 1
[DKG publish] JSON-LD structure:
```json
{
  "@context": {
    "@vocab": "https://schema.org/",
    "parallelpedia": "https://parallelpedia.org/schema/"
  },
  "@type": "CommunityNote",
  "topicId": "Elon_Musk",
  "trustScore": 68.76821064058845,
  "summary": "Moderate trust score: Content mostly aligns but has some gaps.",
  "labelsCount": {
    "aligned": 61,
    "missing_context": 207,
    "conflict": 32,
    "unsupported": 0
  },
  "keyExamples": [
    {
      "text": "Fact-checked by Grok\n\n3 hours ago\n\nElon Musk\n\nElon Reeve Musk (born June 28, 1971) is an engineer, entrepreneur, and investor who holds citizenship in South Africa by birth, Canada through his mother,",
      "label": "aligned"
    },
    {
      "text": "Earlier, Musk co-founded X.com in 1999, an online financial services and payments company that merged with Confinity in 2000 to form PayPal, which eBay acquired in 2002 for $1.5 billion.",
      "label": "aligned"
    },
    {
      "text": "As of October 2025, Musk is the world's wealthiest individual, with a net worth exceeding $500 billion, primarily from his ownership stakes in Tesla and SpaceX.\n\nElon Musk joined Tesla in 2004 as lead",
      "label": "aligned"
    },
    {
      "text": "He became CEO in October 2008 and was appointed Technoking in March 2021, directing the development of electric vehicles, battery energy storage, and solar products that have accelerated the transitio",
      "label": "missing_context"
    },
    {
      "text": "He founded SpaceX in 2002 as CEO and chief engineer, pioneering reusable rocket technology to lower launch costs and pursue human settlement on Mars.",
      "label": "aligned"
    }
  ],
  "grokTitle": "Elon Musk",
  "wikiTitle": "Elon Musk",
  "dateCreated": "2025-11-19T20:20:55.208299Z"
}
```


# Example 2
[DKG publish] JSON-LD structure:
```json
{
  "@context": {
    "@vocab": "https://schema.org/",
    "parallelpedia": "https://parallelpedia.org/schema/"
  },
  "@type": "CommunityNote",
  "topicId": "Conservapedia",
  "trustScore": 78.79913480478649,
  "summary": "Moderate trust score: Content mostly aligns but has some gaps.",
  "labelsCount": {
    "aligned": 26,
    "missing_context": 166,
    "conflict": 2,
    "unsupported": 0
  },
  "keyExamples": [
    {
      "text": "Fact-checked by Grok\n\n3 weeks ago\n\nConservapedia\n\nConservapedia is an English-language, wiki-based online encyclopedia founded on November 21, 2006, by attorney and educator Andrew Schlafly, son of co",
      "label": "aligned"
    },
    {
      "text": "It operates as a conservative alternative to Wikipedia, explicitly adopting a viewpoint that credits conservatism and Christianity rather than feigning neutrality, while enforcing family-friendly poli",
      "label": "missing_context"
    },
    {
      "text": "The project's inception stemmed from observations of systemic liberal bias in Wikipedia, corroborated by multiple studies documenting skewed content and editor demographics favoring left-leaning persp",
      "label": "missing_context"
    },
    {
      "text": "Conservapedia's editing principles prioritize empirical conservatism, such as biblical accuracy over atheistic interpretations of science, and include features like a vast collection of articles on at",
      "label": "missing_context"
    },
    {
      "text": "Notable for initiatives like the Conservative Bible Project, which seeks a translation untainted by modern liberal influences, Conservapedia has maintained over 58,000 articles despite a small active ",
      "label": "missing_context"
    }
  ],
  "grokTitle": "Conservapedia",
  "wikiTitle": "Conservapedia",
  "dateCreated": "2025-11-19T21:07:17.174873Z"
}
```
