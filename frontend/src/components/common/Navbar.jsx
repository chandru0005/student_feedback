import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, GraduationCap, User, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();

  const roleColors = {
    student: 'bg-sky-100 text-sky-800 border-sky-200',
    faculty: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    admin: 'bg-purple-100 text-purple-800 border-purple-200'
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg text-slate-900 tracking-tight">EduPulse</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-600 border border-sky-100">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 -mt-0.5">Sentiment Feedback System</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-semibold text-slate-800">{user.name}</span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>{user.department_code || user.department_name || 'Campus'}</span>
                    {user.year ? <span>• Year {user.year}</span> : null}
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                    roleColors[user.role] || 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {user.role}
                </span>

                <button
                  onClick={logout}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-sky-600 hover:text-sky-700"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
