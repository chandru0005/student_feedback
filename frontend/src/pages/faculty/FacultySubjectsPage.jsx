import React, { useState, useEffect } from 'react';
import { facultyApi } from '../../services/api';
import { BookOpen, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FacultySubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    facultyApi.getDashboard().then(res => {
      if (res.data?.assignedSubjects) setSubjects(res.data.assignedSubjects);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-emerald-600" />
          <span>Assigned Courses & Subjects</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">Subjects allocated to you for student evaluations this semester.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjects.map((sub) => (
          <div
            key={sub.id}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
                  {sub.code}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  Semester {sub.semester}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">{sub.name}</h3>
              <p className="text-xs text-slate-500">Active Course Offering</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-emerald-600 font-semibold">Active Review Period</span>
              <Link
                to={`/faculty/feedback?subject_id=${sub.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 text-xs font-bold transition-all"
              >
                <span>View Student Feedback</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
