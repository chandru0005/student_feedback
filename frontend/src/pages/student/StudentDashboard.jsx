import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentApi } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import SentimentBadge from '../../components/common/SentimentBadge';
import StarRating from '../../components/common/StarRating';
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Star,
  PlusCircle,
  BookOpen,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalFeedback: 0,
    completedFeedback: 0,
    pendingFeedback: 0,
    averageRating: 0.0
  });
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getDashboard()
      .then((res) => {
        if (res.data?.success) {
          setStats(res.data.stats);
          setRecentSubmissions(res.data.recentSubmissions || []);
          setAvailableSubjects(res.data.availableSubjects || []);
        }
      })
      .catch((err) => console.error('Dashboard load failed', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
            Student Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-sky-100 text-sm mt-1 max-w-xl">
            Your voice shapes academic excellence. Submit constructive feedback, rate your courses, and help faculty improve curriculum delivery.
          </p>
        </div>

        <Link
          to="/student/submit"
          className="inline-flex items-center gap-2 bg-white text-sky-700 hover:bg-sky-50 font-bold px-5 py-3 rounded-2xl shadow-md transition-all hover:scale-105"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Give Feedback</span>
        </Link>
      </div>

      {/* KPI Cards as requested in prompt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Feedback"
          value={stats.totalFeedback}
          subtitle="All feedback submitted"
          icon={MessageSquare}
          color="blue"
        />
        <StatCard
          title="Completed"
          value={stats.completedFeedback}
          subtitle="Reviewed by faculty/admin"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Pending"
          value={stats.pendingFeedback}
          subtitle="Under evaluation"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Average Rating"
          value={`${stats.averageRating} ⭐`}
          subtitle="Across your submissions"
          icon={Star}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Submissions */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Submissions</h2>
              <p className="text-xs text-slate-500">Your latest submitted course feedback</p>
            </div>
            <Link
              to="/student/history"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              View all history <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentSubmissions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No feedback submitted yet.</p>
              <Link
                to="/student/submit"
                className="mt-3 inline-block text-xs font-semibold text-sky-600 underline"
              >
                Submit your first feedback now
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Subject / Faculty</th>
                    <th className="pb-3 font-semibold">Category</th>
                    <th className="pb-3 font-semibold">Rating</th>
                    <th className="pb-3 font-semibold">Sentiment</th>
                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {recentSubmissions.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 pr-4">
                        <div className="font-semibold text-slate-800">
                          {item.subject_name || 'General Campus'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.faculty_name ? `Prof. ${item.faculty_name}` : 'Facility / Service'}
                          {item.is_anonymous ? (
                            <span className="ml-2 text-[10px] text-purple-600 font-medium bg-purple-50 px-1.5 py-0.5 rounded">
                              Anonymous
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {item.feedback_category}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <StarRating value={item.average_rating || 0} readOnly size="sm" />
                      </td>
                      <td className="py-3.5 pr-4">
                        <SentimentBadge
                          sentiment={item.sentiment}
                          score={item.sentiment_score}
                          confidence={item.confidence_score}
                          size="sm"
                        />
                      </td>
                      <td className="py-3.5 text-right">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                            item.status === 'reviewed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : item.status === 'flagged'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Available Subjects for Feedback */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">Available Feedback Forms</h2>
            <p className="text-xs text-slate-500">Curriculum subjects open for evaluation</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] pr-1">
            {availableSubjects.map((sub) => (
              <div
                key={sub.id}
                className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-sky-50/50 hover:border-sky-100 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-100/70 px-1.5 py-0.5 rounded">
                    {sub.code} • Sem {sub.semester}
                  </span>
                  <p className="text-xs font-semibold text-slate-800 mt-1">{sub.name}</p>
                </div>
                <Link
                  to={`/student/submit?subject_id=${sub.id}`}
                  className="p-2 rounded-xl bg-white hover:bg-sky-600 hover:text-white text-slate-600 border border-slate-200 shadow-2xs transition-all"
                  title="Submit Feedback"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Anonymous feedback enabled by default.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
