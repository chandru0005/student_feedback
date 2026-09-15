import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { FileBarChart, Download, FileText, CheckCircle2, Table } from 'lucide-react';

export default function ReportsPage() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getFeedback()
      .then(res => {
        if (res.data?.success) setFeedback(res.data.feedback || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadCSV = () => {
    window.open(adminApi.exportReportUrl('csv'), '_blank');
  };

  const handleDownloadJSON = () => {
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(feedback, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `student_feedback_report_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-purple-600" />
            <span>Audit Reports & Data Export</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Export comprehensive institutional evaluation reports for accreditation and academic audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md text-xs transition-all hover:scale-105"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV (Excel)</span>
          </button>
          <button
            onClick={handleDownloadJSON}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl shadow-md text-xs transition-all hover:scale-105"
          >
            <FileText className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Table className="w-5 h-5 text-purple-600" /> Dataset Preview ({feedback.length} records)
          </h2>
          <span className="text-xs text-slate-400">Showing all records ready for export</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Faculty</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Sentiment</th>
                <th className="py-3 px-4">Student</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {feedback.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 text-slate-500">{new Date(f.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4 font-semibold">{f.subject_code || 'General'}</td>
                  <td className="py-3 px-4">{f.faculty_name ? `Prof. ${f.faculty_name}` : 'Facility'}</td>
                  <td className="py-3 px-4">{f.feedback_category}</td>
                  <td className="py-3 px-4 font-bold">{f.average_rating} ⭐</td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                        f.sentiment === 'Positive'
                          ? 'bg-emerald-50 text-emerald-700'
                          : f.sentiment === 'Negative'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {f.sentiment}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {f.is_anonymous ? (
                      <span className="text-purple-600 font-medium">Anonymous ({f.student_name})</span>
                    ) : (
                      <span>{f.student_name}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
