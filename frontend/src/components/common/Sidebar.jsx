import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  MessageSquarePlus,
  History,
  BookOpen,
  User,
  Users,
  Settings,
  FileBarChart,
  ShieldCheck,
  LogOut,
  Sliders
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const studentLinks = [
    { name: 'Dashboard', to: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Give Feedback', to: '/student/submit', icon: MessageSquarePlus },
    { name: 'My Feedback', to: '/student/history', icon: History },
    { name: 'Subjects', to: '/student/subjects', icon: BookOpen },
    { name: 'Profile', to: '/student/profile', icon: User }
  ];

  const facultyLinks = [
    { name: 'Dashboard', to: '/faculty/dashboard', icon: LayoutDashboard },
    { name: 'Feedback Review', to: '/faculty/feedback', icon: MessageSquarePlus },
    { name: 'Assigned Subjects', to: '/faculty/subjects', icon: BookOpen }
  ];

  const adminLinks = [
    { name: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Manage Users', to: '/admin/users', icon: Users },
    { name: 'Academics & Subjects', to: '/admin/academics', icon: BookOpen },
    { name: 'Feedback Moderation', to: '/admin/feedback', icon: ShieldCheck },
    { name: 'System Settings', to: '/admin/settings', icon: Sliders },
    { name: 'Reports & Export', to: '/admin/reports', icon: FileBarChart }
  ];

  let links = [];
  if (user.role === 'student') links = studentLinks;
  else if (user.role === 'faculty') links = facultyLinks;
  else if (user.role === 'admin') links = adminLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 flex-1">
        <div className="mb-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {user.role} Navigation
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-slate-500" />
                <span>{link.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
