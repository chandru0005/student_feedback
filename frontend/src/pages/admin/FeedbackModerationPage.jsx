import React, { useState, useEffect } from 'react';
import { adminApi, metadataApi } from '../../services/api';
import SentimentBadge from '../../components/common/SentimentBadge';
import StarRating from '../../components/common/StarRating';
import {
  ShieldCheck,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Calendar,
  Eye,
  Flag,
  RotateCcw
} from 'lucide-react';

export default function FeedbackModerationPage() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchFeedback = () => {
    setLoading(true);
    adminApi.getFeedback({
      status: statusFilter || undefined,
      sentiment: sentimentFilter || undefined,
      category: categoryFilter || undefined,
      search: search || undefined
    })
      .then(res => {
        if (res.data?.success) setFeedbackList(res.data.feedback || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFeedback();
  }, [statusFilter, sentimentFilter, categoryFilter, search]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await adminApi.updateFeedbackStatus(id, newStatus);
      fetchFeedback();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this feedback submission permanently?')) return;
    try {
      await adminApi.deleteFeedback(id);
      fetchFeedback();
    } catch (err) {
      alert('Failed to delete feedback');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            <span>Feedback Moderation & Moderation Queue</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Audit student submissions, address flagged issues, and verify academic standards.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search feedback text, faculty, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
            <option value="flagged">Flagged / Problematic</option>
          </select>

          {/* Sentiment Filter */}
          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            {['Teaching', 'Faculty', 'Subject', 'Laboratory', 'Infrastructure', 'Library', 'Hostel', 'Transport', 'Internet', 'Other'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Moderation List */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading moderation records...</p>
        </div>
      ) : feedbackList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm text-slate-400">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
          <h3 className="text-base font-bold text-slate-700">Moderation Queue Clean</h3>
          <p className="text-xs text-slate-500 mt-1">No feedback submissions match the current filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbackList.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-3xl p-6 border shadow-sm transition-all space-y-4 ${
                item.status === 'flagged' ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200/80'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                    ID #{item.id}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    {item.subject_code ? `${item.subject_code} - ${item.subject_name}` : 'General / Facility'}
                  </span>
                  {item.faculty_name && (
                    <span className="text-xs text-slate-500">
                      • Prof. {item.faculty_name}
                    </span>
                  )}
                  <span className="text-xs font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">
                    {item.feedback_category}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <SentimentBadge
                    sentiment={item.sentiment}
                    score={item.sentiment_score}
                    confidence={item.confidence_score}
                  />
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                      item.status === 'reviewed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : item.status === 'flagged'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Student Identity (Visible to Administrator) */}
              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="font-bold text-slate-800">Author: </span>
                  <span>{item.student_name || 'Unknown'} </span>
                  <span className="text-slate-400 font-mono">({item.student_email || item.student_reg}) </span>
                  {item.is_anonymous ? (
                    <span className="text-purple-700 font-semibold ml-1.5 bg-purple-100/70 px-2 py-0.5 rounded">
                      🛡️ Marked Anonymous to Faculty
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-slate-400">Average Rating:</span>
                  <StarRating value={item.average_rating || 0} readOnly size="sm" />
                </div>
              </div>

              {/* Feedback Text */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 italic leading-relaxed">
                "{item.written_feedback}"
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Submitted {new Date(item.created_at).toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.status !== 'reviewed' && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'reviewed')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Reviewed
                    </button>
                  )}

                  {item.status !== 'flagged' && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'flagged')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
                    >
                      <Flag className="w-3.5 h-3.5" /> Flag Problematic
                    </button>
                  )}

                  {item.status !== 'submitted' && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'submitted')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset Status
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-2"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
