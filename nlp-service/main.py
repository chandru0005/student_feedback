import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from analyzer import analyze_sentiment

app = FastAPI(
    title="Student Feedback Sentiment Analysis NLP Service",
    description="NLP microservice providing sentiment classification, confidence scores, keyword extraction, and topic categorization for university student feedback.",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FeedbackAnalysisRequest(BaseModel):
    text: str = Field(..., description="Student feedback text to analyze", min_length=1)
    category: Optional[str] = Field(None, description="Optional feedback category context")

class BatchFeedbackRequest(BaseModel):
    items: List[FeedbackAnalysisRequest]

class AspectBreakdown(BaseModel):
    positive_aspects: List[str]
    negative_aspects: List[str]
    suggestions: List[str]

class SentimentAnalysisResponse(BaseModel):
    sentiment: str
    sentiment_score: float
    confidence_score: float
    subjectivity_score: float
    keywords: List[str]
    detected_topics: List[str]
    aspect_breakdown: AspectBreakdown

@app.get("/")
def root():
    return {
        "service": "Student Feedback Sentiment NLP Service",
        "status": "healthy",
        "version": "1.0.0",
        "endpoints": ["/health", "/analyze", "/batch-analyze"]
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "nlp-sentiment-analyzer"}

@app.post("/analyze", response_model=SentimentAnalysisResponse)
def analyze_single_feedback(request: FeedbackAnalysisRequest):
    try:
        result = analyze_sentiment(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/batch-analyze")
def analyze_batch_feedback(request: BatchFeedbackRequest):
    try:
        results = []
        for item in request.items:
            res = analyze_sentiment(item.text)
            results.append(res)
        return {"count": len(results), "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
