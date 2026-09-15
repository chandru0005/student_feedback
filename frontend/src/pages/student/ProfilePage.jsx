import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Hash, Building2, Calendar, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Your registered institutional credentials and academic department.</p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-extrabold text-xl shadow-inner">
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
            <span className="inline-block mt-0.5 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full uppercase">
              {user?.role} Account
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1">
              <Hash className="w-3.5 h-3.5" /> Register Number
            </span>
            <span className="font-semibold text-slate-800">{user?.register_number || 'N/A'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1">
              <Mail className="w-3.5 h-3.5" /> College Email
            </span>
            <span className="font-semibold text-slate-800">{user?.email}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1">
              <Building2 className="w-3.5 h-3.5" /> Department
            </span>
            <span className="font-semibold text-slate-800">{user?.department_name || user?.department_code || 'General'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5" /> Academic Year
            </span>
            <span className="font-semibold text-slate-800">Year {user?.year || 1} (Semester 5)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
