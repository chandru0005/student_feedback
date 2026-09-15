import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { metadataApi } from '../../services/api';
import { BookOpen, PlusCircle, ArrowRight } from 'lucide-react';

export default function StudentSubjectsPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.department_id) {
      metadataApi.getSubjects({ department_id: user.department_id })
        .then(res => {
          if (res.data?.subjects) setSubjects(res.data.subjects);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-sky-600" />
          <span>Curriculum Subjects</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">Available subjects under your department open for evaluation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjects.map((sub) => (
          <div
            key={sub.id}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
                  {sub.code}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  Semester {sub.semester}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">{sub.name}</h3>
              <p className="text-xs text-slate-500">{sub.department_name}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">Feedback Open</span>
              <Link
                to={`/student/submit?subject_id=${sub.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 text-xs font-bold transition-all"
              >
                <span>Give Feedback</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
