import re
import math
from typing import Dict, List, Any

# Domain-specific sentiment lexicons tailored for college/university feedback
POSITIVE_WORDS = {
    "excellent": 3.0, "great": 2.5, "awesome": 2.8, "amazing": 3.0, "good": 1.5,
    "superb": 3.0, "clear": 2.0, "clarity": 2.0, "helpful": 2.0, "supportive": 2.2,
    "friendly": 1.8, "interactive": 2.0, "engaging": 2.2, "inspiring": 2.5, "inspirational": 2.5,
    "knowledgeable": 2.2, "expert": 2.0, "punctual": 2.0, "organized": 1.8, "dedicated": 2.0,
    "patient": 2.0, "approachable": 2.0, "practical": 1.8, "best": 2.8, "informative": 1.8,
    "enjoyed": 2.0, "enjoyable": 2.0, "clean": 1.5, "modern": 1.5, "well": 1.2,
    "appreciate": 2.0, "loved": 2.5, "recommend": 2.0, "interesting": 1.8, "effective": 2.0,
    "wonderful": 2.5, "outstanding": 3.0, "satisfied": 2.0, "satisfaction": 2.0, "smooth": 1.5,
    "encouraging": 2.0, "fair": 1.8, "transparent": 1.8, "thorough": 1.8, "detailed": 1.5
}

NEGATIVE_WORDS = {
    "terrible": -3.0, "awful": -3.0, "horrible": -3.0, "poor": -2.2, "bad": -2.0,
    "worst": -3.2, "boring": -2.2, "unclear": -2.2, "confusing": -2.0, "confused": -1.8,
    "harsh": -2.2, "rude": -2.8, "strict": -1.5, "unpunctual": -2.2, "late": -1.8,
    "disorganized": -2.0, "slow": -1.5, "fast": -1.2, "rushed": -1.8, "unhelpful": -2.2,
    "arrogant": -2.8, "monotonous": -2.0, "useless": -2.8, "waste": -2.8, "difficult": -1.5,
    "broken": -2.5, "dirty": -2.2, "noisy": -1.8, "incompetent": -3.0, "biased": -2.5,
    "unfair": -2.5, "ignored": -2.0, "unresponsive": -2.2, "disappointed": -2.5, "disappointing": -2.5,
    "frustrating": -2.5, "frustrated": -2.5, "uncomfortable": -2.0, "cramped": -1.8,
    "insufficient": -2.0, "faulty": -2.2, "lacking": -1.8, "stuck": -1.5, "delay": -1.8
}

NEGATION_WORDS = {
    "not", "no", "never", "neither", "nor", "hardly", "barely", "scarcely",
    "nothing", "none", "nobody", "nowhere",
    "doesn't", "doesnt", "don't", "dont", "didn't", "didnt", "isn't", "isnt",
    "aren't", "arent", "wasn't", "wasnt", "weren't", "werent", "haven't", "havent",
    "without", "cannot", "cant", "can't", "hardly"
}

NEUTRAL_WORDS = {
    "okay": 0.0, "ok": 0.0, "average": 0.0, "moderate": 0.0, "decent": 0.3,
    "fine": 0.2, "standard": 0.0, "expected": 0.0, "normal": 0.0, "neutral": 0.0
}

INTENSIFIERS = {
    "very": 1.4, "extremely": 1.8, "really": 1.3, "so": 1.3, "too": 1.3,
    "highly": 1.5, "completely": 1.5, "absolutely": 1.6, "exceptionally": 1.7,
    "quite": 1.2, "truly": 1.4
}

TOPIC_KEYWORDS = {
    "Teaching & Delivery": ["explain", "explaining", "lecture", "teach", "teaching", "slide", "presentation", "concept", "clarity", "pace", "voice", "audio", "accent"],
    "Subject & Content": ["subject", "syllabus", "course", "curriculum", "topic", "material", "book", "notes", "assignment", "homework"],
    "Faculty Behavior": ["punctual", "punctuality", "attitude", "friendly", "approachable", "patient", "rude", "strict", "respect", "attendance", "behavior"],
    "Doubt & Interaction": ["doubt", "doubts", "question", "interactive", "interaction", "ask", "clarification", "clarify", "discussion"],
    "Laboratory & Practical": ["lab", "laboratory", "experiment", "equipment", "hardware", "software", "practical", "computer", "system", "setup", "pc"],
    "Infrastructure & Facilities": ["classroom", "projector", "bench", "ac", "air conditioning", "fan", "board", "wifi", "internet", "canteen", "library", "hostel", "transport", "bus", "washroom", "toilet"]
}

SUGGESTION_TRIGGERS = [
    "should", "could", "would be better", "need to", "needs to", "please",
    "hope", "recommend", "suggest", "improvement", "improve", "ought to"
]

def preprocess_text(text: str) -> str:
    if not text:
        return ""
    # Normalize whitespaces
    cleaned = re.sub(r'\s+', ' ', text.strip())
    return cleaned

def extract_keywords(tokens: List[str], max_keywords: int = 6) -> List[str]:
    stopwords = {
        "the", "a", "an", "is", "are", "was", "were", "and", "or", "but",
        "in", "on", "at", "to", "for", "with", "about", "against", "between",
        "into", "through", "during", "before", "after", "above", "below", "from",
        "up", "down", "in", "out", "over", "under", "again", "further", "then",
        "once", "here", "there", "when", "where", "why", "how", "all", "any",
        "both", "each", "few", "more", "most", "other", "some", "such", "no",
        "nor", "not", "only", "own", "same", "so", "than", "too", "very", "can",
        "will", "just", "don", "should", "now", "it", "its", "this", "that",
        "these", "those", "am", "have", "has", "had", "having", "do", "does",
        "did", "doing", "would", "shall", "could", "ought", "i", "we", "they",
        "he", "she", "you", "me", "my", "our", "us", "his", "her", "their", "your"
    }
    meaningful = [w.lower() for w in tokens if len(w) > 3 and w.lower() not in stopwords and w.isalpha()]
    freq: Dict[str, int] = {}
    for w in meaningful:
        freq[w] = freq.get(w, 0) + 1
    sorted_words = sorted(freq.keys(), key=lambda w: freq[w], reverse=True)
    return sorted_words[:max_keywords]

def detect_topics(text: str) -> List[str]:
    lower_text = text.lower()
    matched_topics = []
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(re.search(r'\b' + re.escape(kw) + r'\b', lower_text) for kw in keywords):
            matched_topics.append(topic)
    if not matched_topics:
        matched_topics.append("General Feedback")
    return matched_topics

def extract_aspect_breakdown(text: str) -> Dict[str, List[str]]:
    sentences = re.split(r'[.!?;\n]+', text)
    positive_aspects = []
    negative_aspects = []
    suggestions = []

    for s in sentences:
        s_clean = s.strip()
        if len(s_clean) < 4:
            continue
        lower_s = s_clean.lower()
        
        # Check suggestions
        if any(trig in lower_s for trig in SUGGESTION_TRIGGERS):
            suggestions.append(s_clean)
            continue
        
        # Check sentiment of this sentence
        words = re.findall(r'\b\w+\b', lower_s)
        pos_hit = any(w in POSITIVE_WORDS for w in words)
        neg_hit = any(w in NEGATIVE_WORDS for w in words)
        
        if pos_hit and not neg_hit:
            positive_aspects.append(s_clean)
        elif neg_hit and not pos_hit:
            negative_aspects.append(s_clean)
        elif pos_hit and neg_hit:
            suggestions.append(s_clean)
            
    return {
        "positive_aspects": positive_aspects[:4],
        "negative_aspects": negative_aspects[:4],
        "suggestions": suggestions[:4]
    }

def analyze_sentiment(raw_text: str) -> Dict[str, Any]:
    text = preprocess_text(raw_text)
    if not text:
        return {
            "sentiment": "Neutral",
            "sentiment_score": 0.0,
            "confidence_score": 0.5,
            "subjectivity_score": 0.0,
            "keywords": [],
            "detected_topics": ["General"],
            "aspect_breakdown": {
                "positive_aspects": [],
                "negative_aspects": [],
                "suggestions": []
            }
        }

    # Tokenize
    tokens = re.findall(r'\b[\w\']+\b', text)
    lower_tokens = [t.lower() for t in tokens]
    
    total_score = 0.0
    matched_count = 0
    negate_window = 0
    intensifier_multiplier = 1.0

    for i, token in enumerate(lower_tokens):
        raw_token = tokens[i]
        
        if token in INTENSIFIERS:
            intensifier_multiplier = INTENSIFIERS[token]
            continue
            
        if token in NEGATION_WORDS:
            negate_window = 5
            continue

        token_weight = 0.0
        if token in POSITIVE_WORDS:
            token_weight = POSITIVE_WORDS[token]
        elif token in NEGATIVE_WORDS:
            token_weight = NEGATIVE_WORDS[token]
        elif token in NEUTRAL_WORDS:
            token_weight = NEUTRAL_WORDS[token]
            matched_count += 1

        if token_weight != 0.0:
            matched_count += 1
            if raw_token.isupper() and len(raw_token) > 1:
                token_weight *= 1.3
                
            token_weight *= intensifier_multiplier
            intensifier_multiplier = 1.0

            if negate_window > 0:
                # If negating a negative (e.g. "not bad"), it means acceptable/neutral, not overwhelmingly enthusiastic
                if token_weight < 0:
                    token_weight = 0.4
                else:
                    token_weight = -token_weight * 0.9
                
            total_score += token_weight

        if negate_window > 0:
            negate_window -= 1

    exclamations = text.count('!')
    if exclamations > 0:
        if total_score > 0:
            total_score += min(exclamations * 0.3, 1.0)
        elif total_score < 0:
            total_score -= min(exclamations * 0.3, 1.0)

    if matched_count > 0:
        normalized_score = math.tanh(total_score / (matched_count * 1.5))
    else:
        normalized_score = 0.0

    if normalized_score >= 0.15:
        sentiment = "Positive"
        confidence = min(0.60 + abs(normalized_score) * 0.38, 0.99)
    elif normalized_score <= -0.15:
        sentiment = "Negative"
        confidence = min(0.60 + abs(normalized_score) * 0.38, 0.99)
    else:
        sentiment = "Neutral"
        confidence = max(0.55, 0.85 - abs(normalized_score) * 2.0)

    subjectivity = min(1.0, (matched_count * 2 + exclamations) / max(len(tokens), 1))
    keywords = extract_keywords(tokens)
    detected_topics = detect_topics(text)
    aspect_breakdown = extract_aspect_breakdown(text)

    return {
        "sentiment": sentiment,
        "sentiment_score": round(normalized_score, 3),
        "confidence_score": round(confidence, 3),
        "subjectivity_score": round(subjectivity, 3),
        "keywords": keywords,
        "detected_topics": detected_topics,
        "aspect_breakdown": aspect_breakdown
    }
