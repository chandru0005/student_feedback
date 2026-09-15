import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { facultyApi } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import SentimentPieChart from '../../components/charts/SentimentPieChart';
import RatingBarChart from '../../components/charts/RatingBarChart';
import {
  MessageSquare,
  Star,
  Smile,
  BookOpen,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({
    stats: {
      totalFeedback: 0,
      assignedSubjectsCount: 0,
      averageRatings: { overall: 0 },
      sentimentCounts: { Positive: 0, Neutral: 0, Negative: 0 }
    },
    sentimentDistribution: [],
    assignedSubjects: [],
    insights: {
      positiveHighlights: [],
      commonComplaints: [],
      suggestions: []
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    facultyApi.getDashboard()
      .then(res => {
        if (res.data?.success) {
          setData(res.data);
        }
      })
      .catch(err => console.error('Faculty dashboard load failed', err))
      .finally(() => setLoading(false));
  }, []);

  const positivePct = data.stats.totalFeedback > 0
    ? Math.round((data.stats.sentimentCounts.Positive / data.stats.totalFeedback) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
            Faculty Analytics Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
            Welcome, {user?.name}!
          </h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-xl">
            Real-time student feedback intelligence, NLP sentiment distribution, and constructive teaching performance insights.
          </p>
        </div>

        <Link
          to="/faculty/feedback"
          className="inline-flex items-center gap-2 bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-5 py-3 rounded-2xl shadow-md transition-all hover:scale-105 text-sm"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Review All Feedback</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Student Feedback"
          value={data.stats.totalFeedback}
          subtitle="Across your assigned courses"
          icon={MessageSquare}
          color="blue"
        />
        <StatCard
          title="Average Rating"
          value={`${data.stats.averageRatings.overall || 0} ⭐`}
          subtitle="Out of 5.0 rating scale"
          icon={Star}
          color="amber"
        />
        <StatCard
          title="Positive Sentiment"
          value={`${positivePct}%`}
          subtitle={`${data.stats.sentimentCounts.Positive || 0} positive submissions`}
          icon={Smile}
          color="emerald"
        />
        <StatCard
          title="Assigned Subjects"
          value={data.stats.assignedSubjectsCount}
          subtitle="Current academic semester"
          icon={BookOpen}
          color="purple"
        />
      </div>

      {/* Charts Section: Sentiment Donut & Criteria Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sentiment Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" /> Sentiment Distribution
              </h2>
              <p className="text-xs text-slate-500">NLP classification of student written comments</p>
            </div>
          </div>
          <SentimentPieChart data={data.sentimentDistribution} />
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center text-xs">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
              <span className="block text-[10px] uppercase font-bold text-emerald-600">Positive</span>
              <span className="font-extrabold text-sm">{data.stats.sentimentCounts.Positive || 0}</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-800">
              <span className="block text-[10px] uppercase font-bold text-amber-600">Neutral</span>
              <span className="font-extrabold text-sm">{data.stats.sentimentCounts.Neutral || 0}</span>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-800">
              <span className="block text-[10px] uppercase font-bold text-rose-600">Negative</span>
              <span className="font-extrabold text-sm">{data.stats.sentimentCounts.Negative || 0}</span>
            </div>
          </div>
        </div>

        {/* Multi-Criteria Ratings Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-600" /> Teaching Criteria Breakdown
              </h2>
              <p className="text-xs text-slate-500">Average student score per evaluation parameter (1-5 ⭐)</p>
            </div>
          </div>
          <RatingBarChart ratings={data.stats.averageRatings} />
        </div>
      </div>

      {/* Qualitative NLP Insights (Positive highlights, common complaints, suggestions) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Positive Comments */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-600">
            <Smile className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-sm">Positive Highlights</h3>
          </div>
          <p className="text-xs text-slate-500">Key strengths extracted from student feedback:</p>
          <div className="space-y-2">
            {data.insights.positiveHighlights.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No highlights recorded yet.</p>
            ) : (
              data.insights.positiveHighlights.map((pos, idx) => (
                <div key={idx} className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-900">
                  "{pos}"
                </div>
              ))
            )}
          </div>
        </div>

        {/* Common Complaints */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-sm">Common Complaints</h3>
          </div>
          <p className="text-xs text-slate-500">Frequent points of friction needing attention:</p>
          <div className="space-y-2">
            {data.insights.commonComplaints.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No critical complaints found.</p>
            ) : (
              data.insights.commonComplaints.map((comp, idx) => (
                <div key={idx} className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl text-xs text-rose-900">
                  "{comp}"
                </div>
              ))
            )}
          </div>
        </div>

        {/* Improvement Suggestions */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-600">
            <Lightbulb className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-sm">Actionable Suggestions</h3>
          </div>
          <p className="text-xs text-slate-500">Constructive recommendations from learners:</p>
          <div className="space-y-2">
            {data.insights.suggestions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No specific suggestions submitted.</p>
            ) : (
              data.insights.suggestions.map((sug, idx) => (
                <div key={idx} className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-xs text-amber-900">
                  "{sug}"
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
