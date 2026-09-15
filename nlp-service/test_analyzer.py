import json
from analyzer import analyze_sentiment

def test_samples():
    samples = [
        "Professor Sharma is an excellent teacher! Her explanations are clear and she is very helpful and supportive during doubt sessions.",
        "The course structure is okay. Lectures follow the syllabus as expected, nothing particularly special or bad.",
        "Terrible experience in the lab. The computers are broken, equipment is faulty and the faculty was very rude and unpunctual.",
        "The professor knows the subject very well, but speaks too fast. It would be better if we could have more practical examples."
    ]

    for i, s in enumerate(samples, 1):
        res = analyze_sentiment(s)
        print(f"\n--- Sample {i} ---")
        print(f"Text: {s}")
        print(f"Sentiment: {res['sentiment']} (score: {res['sentiment_score']}, confidence: {res['confidence_score']})")
        print(f"Keywords: {res['keywords']}")
        print(f"Topics: {res['detected_topics']}")
        print(f"Aspects: {res['aspect_breakdown']}")

if __name__ == "__main__":
    test_samples()
