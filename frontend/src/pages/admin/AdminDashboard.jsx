import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import SentimentPieChart from '../../components/charts/SentimentPieChart';
import DepartmentBarChart from '../../components/charts/DepartmentBarChart';
import SentimentBadge from '../../components/common/SentimentBadge';
import StarRating from '../../components/common/StarRating';
import {
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  MessageSquare,
  AlertOctagon,
  Sparkles,
  TrendingUp,
  Download,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [data, setData] = useState({
    kpis: {
      totalStudents: 0,
      totalFaculty: 0,
      totalDepartments: 0,
      totalSubjects: 0,
      totalFeedback: 0,
      flaggedFeedback: 0
    },
    sentimentDistribution: [],
    departmentStats: [],
    categoryStats: [],
    recentSubmissions: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard()
      .then(res => {
        if (res.data?.success) {
          setData(res.data);
        }
      })
      .catch(err => console.error('Admin dashboard failed', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
            Executive Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
            Institutional Feedback Intelligence
          </h1>
          <p className="text-purple-200 text-sm mt-1 max-w-xl">
            Campus-wide sentiment telemetry, faculty evaluation trends, and quality assurance control.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/reports"
            className="inline-flex items-center gap-2 bg-white text-purple-900 hover:bg-purple-50 font-bold px-4 py-2.5 rounded-xl shadow-md text-xs transition-all hover:scale-105"
          >
            <Download className="w-4 h-4" />
            <span>Reports & Exports</span>
          </Link>
          <Link
            to="/admin/feedback"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md text-xs transition-all"
          >
            <span>Moderate Feedback</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Students"
          value={data.kpis.totalStudents}
          subtitle="Enrolled active"
          icon={GraduationCap}
          color="blue"
        />
        <StatCard
          title="Faculty"
          value={data.kpis.totalFaculty}
          subtitle="Teaching staff"
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Departments"
          value={data.kpis.totalDepartments}
          subtitle="Academic depts"
          icon={Building2}
          color="purple"
        />
        <StatCard
          title="Subjects"
          value={data.kpis.totalSubjects}
          subtitle="Curriculum courses"
          icon={BookOpen}
          color="amber"
        />
        <StatCard
          title="Total Feedback"
          value={data.kpis.totalFeedback}
          subtitle="Submissions"
          icon={MessageSquare}
          color="blue"
        />
        <StatCard
          title="Flagged"
          value={data.kpis.flaggedFeedback}
          subtitle="Requires attention"
          icon={AlertOctagon}
          color="rose"
        />
      </div>

      {/* Charts Section: Sentiment Donut & Department Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Campus Sentiment Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" /> Campus Sentiment Pulse
            </h2>
            <p className="text-xs text-slate-500 mb-4">NLP categorization of all university submissions</p>
          </div>
          <SentimentPieChart data={data.sentimentDistribution} />
          <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
            {data.sentimentDistribution.map(s => (
              <div key={s.name} className="p-2 rounded-xl bg-slate-50">
                <span className="text-[10px] uppercase font-bold text-slate-500">{s.name}</span>
                <span className="block font-extrabold text-slate-800 text-sm">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Department-wise Sentiment Comparison */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-600" /> Department Performance & Sentiment Volume
            </h2>
            <p className="text-xs text-slate-500 mb-2">Comparative breakdown across engineering & science branches</p>
          </div>
          <DepartmentBarChart data={data.departmentStats} />
        </div>
      </div>

      {/* Categories & Recent Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Feedback Categories Distribution */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-1">Feedback by Category</h2>
          <p className="text-xs text-slate-500 mb-4">Volume and average satisfaction per area</p>

          <div className="space-y-3">
            {data.categoryStats.map((cat, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800">{cat.feedback_category}</span>
                  <p className="text-[11px] text-slate-400">{cat.count} submissions</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700">
                  {cat.avg_rating ? Number(cat.avg_rating).toFixed(1) : 0.0} ⭐
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Submissions Feed */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Campus Activity</h2>
              <p className="text-xs text-slate-500">Live incoming feedback submissions</p>
            </div>
            <Link to="/admin/feedback" className="text-xs font-semibold text-purple-600 hover:text-purple-700">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {data.recentSubmissions.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {item.student_name ? item.student_name : 'Student'}
                    </span>
                    {item.is_anonymous ? (
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                        Anonymous to Faculty
                      </span>
                    ) : null}
                    <span className="text-xs text-slate-400">
                      → {item.faculty_name ? `Prof. ${item.faculty_name}` : 'General'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1 italic">
                    "{item.written_feedback}"
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <SentimentBadge sentiment={item.sentiment} size="sm" />
                  <StarRating value={item.average_rating || 0} readOnly size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
