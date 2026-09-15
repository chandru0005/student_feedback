import React, { useState, useEffect } from 'react';
import { studentApi } from '../../services/api';
import SentimentBadge from '../../components/common/SentimentBadge';
import StarRating from '../../components/common/StarRating';
import {
  History,
  Calendar,
  Trash2,
  Edit3,
  Shield,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function FeedbackHistoryPage() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [allowEdit, setAllowEdit] = useState(true);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSentiment, setFilterSentiment] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const [editModalItem, setEditModalItem] = useState(null);
  const [editText, setEditText] = useState('');
  const [isAnon, setIsAnon] = useState(false);

  const fetchHistory = () => {
    setLoading(true);
    studentApi.getHistory()
      .then(res => {
        if (res.data?.success) {
          setFeedbackList(res.data.feedback || []);
          setAllowEdit(res.data.allowEdit);
        }
      })
      .catch(err => console.error('Failed to fetch history', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback submission?')) return;
    try {
      await studentApi.deleteFeedback(id);
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete feedback');
    }
  };

  const openEdit = (item) => {
    setEditModalItem(item);
    setEditText(item.written_feedback);
    setIsAnon(Boolean(item.is_anonymous));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editModalItem) return;
    try {
      await studentApi.updateFeedback(editModalItem.id, {
        written_feedback: editText,
        is_anonymous: isAnon
      });
      setEditModalItem(null);
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update feedback');
    }
  };

  const filtered = feedbackList.filter(item => {
    if (filterCategory && item.feedback_category !== filterCategory) return false;
    if (filterSentiment && item.sentiment !== filterSentiment) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-sky-600" />
            <span>My Submitted Feedback History</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track evaluation status, sentiment analysis insights, and manage previous submissions.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            {['Teaching', 'Faculty', 'Subject', 'Laboratory', 'Infrastructure', 'Library', 'Hostel', 'Transport', 'Internet', 'Other'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={filterSentiment}
            onChange={(e) => setFilterSentiment(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <option value="">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500">Loading feedback history...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm text-slate-400">
          <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-base font-bold text-slate-700">No Feedback Records Found</h3>
          <p className="text-xs text-slate-500 mt-1">You haven't submitted any feedback matching these filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
                    {item.subject_code || 'General'}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    {item.subject_name || 'Campus Infrastructure / Service'}
                  </span>
                  {item.faculty_name && (
                    <span className="text-xs text-slate-500">• Prof. {item.faculty_name}</span>
                  )}
                  {item.is_anonymous ? (
                    <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Anonymous
                    </span>
                  ) : null}
                </div>

                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 italic">
                  "{item.written_feedback}"
                </p>

                {/* Rating Criteria Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 block">Teaching</span>
                    <span className="font-bold text-slate-800">{item.teaching_quality} ⭐</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 block">Knowledge</span>
                    <span className="font-bold text-slate-800">{item.subject_knowledge} ⭐</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 block">Communication</span>
                    <span className="font-bold text-slate-800">{item.communication} ⭐</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 block">Doubts</span>
                    <span className="font-bold text-slate-800">{item.doubt_clarification} ⭐</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 block">Interaction</span>
                    <span className="font-bold text-slate-800">{item.classroom_interaction} ⭐</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 block">Punctuality</span>
                    <span className="font-bold text-slate-800">{item.punctuality} ⭐</span>
                  </div>
                </div>
              </div>

              {/* Status and Action Sidebar */}
              <div className="flex md:flex-col justify-between items-end md:w-56 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                <div className="space-y-2 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <SentimentBadge
                      sentiment={item.sentiment}
                      score={item.sentiment_score}
                      confidence={item.confidence_score}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                        item.status === 'reviewed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'flagged'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      Status: {item.status}
                    </span>
                  </div>
                </div>

                {allowEdit && (
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => openEdit(item)}
                      className="p-2 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors flex items-center gap-1"
                      title="Edit written feedback"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-1"
                      title="Delete submission"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Edit Feedback Submission</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Written Feedback
                </label>
                <textarea
                  rows={4}
                  required
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="modal_anon"
                  checked={isAnon}
                  onChange={(e) => setIsAnon(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 border-slate-300"
                />
                <label htmlFor="modal_anon" className="text-xs font-semibold text-slate-700">
                  Keep this feedback anonymous
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalItem(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs"
                >
                  Save Changes & Re-Analyze
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
