const http = require('http');

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:8000';

/**
 * Perform fallback rule-based sentiment analysis if the Python microservice is offline
 */
function fallbackAnalyze(text) {
  const lower = (text || '').toLowerCase();
  const posWords = ['excellent', 'great', 'awesome', 'good', 'helpful', 'patient', 'best', 'clear', 'engaging', 'supportive', 'punctual'];
  const negWords = ['terrible', 'awful', 'bad', 'worst', 'poor', 'boring', 'unclear', 'rude', 'broken', 'unfair', 'slow', 'faulty'];
  
  let posCount = 0;
  let negCount = 0;
  posWords.forEach(w => { if (lower.includes(w)) posCount++; });
  negWords.forEach(w => { if (lower.includes(w)) negCount++; });

  let sentiment = 'Neutral';
  let score = 0.0;
  if (posCount > negCount) {
    sentiment = 'Positive';
    score = Math.min(0.5 + (posCount - negCount) * 0.15, 0.95);
  } else if (negCount > posCount) {
    sentiment = 'Negative';
    score = Math.max(-0.5 - (negCount - posCount) * 0.15, -0.95);
  }

  return {
    sentiment,
    sentiment_score: Number(score.toFixed(3)),
    confidence_score: 0.82,
    subjectivity_score: 0.65,
    keywords: text.split(/\W+/).filter(w => w.length > 4).slice(0, 5),
    detected_topics: ['General Feedback'],
    aspect_breakdown: {
      positive_aspects: posCount > 0 ? [text.slice(0, 80)] : [],
      negative_aspects: negCount > 0 ? [text.slice(0, 80)] : [],
      suggestions: lower.includes('should') || lower.includes('improve') ? [text.slice(0, 80)] : []
    }
  };
}

/**
 * Call Python FastAPI NLP Microservice with graceful fallback
 */
async function analyzeFeedbackText(text, category = null) {
  return new Promise((resolve) => {
    try {
      const url = new URL(`${NLP_SERVICE_URL}/analyze`);
      const payload = JSON.stringify({ text, category });

      const req = http.request(
        {
          hostname: url.hostname,
          port: url.port || 8000,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          },
          timeout: 4000
        },
        (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsed = JSON.parse(data);
                return resolve(parsed);
              } catch (e) {
                console.warn('[NLP Client] Response parse error, using fallback:', e.message);
                return resolve(fallbackAnalyze(text));
              }
            } else {
              console.warn(`[NLP Client] Error response status ${res.statusCode}, using fallback`);
              return resolve(fallbackAnalyze(text));
            }
          });
        }
      );

      req.on('error', (err) => {
        console.warn('[NLP Client] Microservice unavailable, using smart fallback engine:', err.message);
        return resolve(fallbackAnalyze(text));
      });

      req.on('timeout', () => {
        req.destroy();
        console.warn('[NLP Client] Request timed out, using fallback');
        return resolve(fallbackAnalyze(text));
      });

      req.write(payload);
      req.end();
    } catch (err) {
      console.warn('[NLP Client] Unexpected exception, using fallback:', err.message);
      return resolve(fallbackAnalyze(text));
    }
  });
}

module.exports = {
  analyzeFeedbackText,
  fallbackAnalyze
};
