import React, { useState, useEffect } from 'react';
import { facultyApi, metadataApi } from '../../services/api';
import SentimentBadge from '../../components/common/SentimentBadge';
import StarRating from '../../components/common/StarRating';
import {
  MessageSquare,
  Filter,
  Shield,
  Calendar,
  Sparkles,
  Search,
  BookOpen
} from 'lucide-react';

export default function FacultyFeedbackPage() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState('');
  const [minRating, setMinRating] = useState('');

  const fetchFeedback = () => {
    setLoading(true);
    facultyApi.getFeedback({
      subject_id: selectedSubject || undefined,
      sentiment: selectedSentiment || undefined,
      min_rating: minRating || undefined
    })
      .then(res => {
        if (res.data?.success) {
          setFeedbackList(res.data.feedback || []);
        }
      })
      .catch(err => console.error('Failed to load faculty feedback', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // Load subjects assigned to this faculty via dashboard
    facultyApi.getDashboard().then(res => {
      if (res.data?.assignedSubjects) {
        setSubjects(res.data.assignedSubjects);
      }
    });
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [selectedSubject, selectedSentiment, minRating]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
            <span>Student Feedback Review</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Detailed evaluation submissions for your subjects with strict student anonymity protection.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="">All Assigned Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
            ))}
          </select>

          {/* Sentiment Filter */}
          <select
            value={selectedSentiment}
            onChange={(e) => setSelectedSentiment(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="">All Sentiments</option>
            <option value="Positive">Positive Only</option>
            <option value="Neutral">Neutral Only</option>
            <option value="Negative">Negative Only</option>
          </select>

          {/* Min Rating */}
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="">All Star Ratings</option>
            <option value="4">4.0+ Stars</option>
            <option value="3">3.0+ Stars</option>
            <option value="2">2.0+ Stars</option>
          </select>
        </div>
      </div>

      {/* Feedback Feed */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading feedback evaluations...</p>
        </div>
      ) : feedbackList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm text-slate-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-base font-bold text-slate-700">No Feedback Matches</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting the subject or sentiment filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbackList.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
                    {item.subject_code || 'General'}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    {item.subject_name}
                  </span>
                  <span className="text-xs text-slate-400">• Category: {item.feedback_category}</span>
                </div>

                <div className="flex items-center gap-3">
                  <SentimentBadge
                    sentiment={item.sentiment.label}
                    score={item.sentiment.score}
                    confidence={item.sentiment.confidence}
                  />
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Student Identity Privacy Display */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  {item.is_anonymous ? (
                    <div className="flex items-center gap-1.5 text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full font-semibold">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Anonymous Student</span>
                      <span className="text-[10px] text-purple-400 font-normal">(Identity Masked by Policy)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                      <span>Submitted by: <strong>{item.student_name}</strong></span>
                      {item.student_reg && <span className="text-slate-400">({item.student_reg})</span>}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">Average Rating:</span>
                  <StarRating value={item.ratings.average_rating || 0} readOnly size="sm" />
                </div>
              </div>

              {/* Written Feedback Text */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 text-sm text-slate-800 leading-relaxed italic">
                "{item.written_feedback}"
              </div>

              {/* 6 Criteria Rating Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs pt-1">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 block">Teaching</span>
                  <span className="font-bold text-slate-800">{item.ratings.teaching_quality} ⭐</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 block">Knowledge</span>
                  <span className="font-bold text-slate-800">{item.ratings.subject_knowledge} ⭐</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 block">Communication</span>
                  <span className="font-bold text-slate-800">{item.ratings.communication} ⭐</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 block">Doubts</span>
                  <span className="font-bold text-slate-800">{item.ratings.doubt_clarification} ⭐</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 block">Interaction</span>
                  <span className="font-bold text-slate-800">{item.ratings.classroom_interaction} ⭐</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                  <span className="text-[10px] text-slate-400 block">Punctuality</span>
                  <span className="font-bold text-slate-800">{item.ratings.punctuality} ⭐</span>
                </div>
              </div>

              {/* Detected Topics and Keywords */}
              {((item.sentiment.detected_topics && item.sentiment.detected_topics.length > 0) ||
                (item.sentiment.keywords && item.sentiment.keywords.length > 0)) && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400 text-[11px] font-semibold">Topics:</span>
                  {item.sentiment.detected_topics?.map((topic, i) => (
                    <span key={i} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-medium">
                      {topic}
                    </span>
                  ))}
                  <span className="text-slate-400 text-[11px] font-semibold ml-2">Keywords:</span>
                  {item.sentiment.keywords?.map((kw, i) => (
                    <span key={i} className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md text-[11px] font-medium">
                      #{kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
