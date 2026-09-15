import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Sliders, Shield, Edit3, Calendar, Tag, Check, Save } from 'lucide-react';

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState({
    allow_anonymous_feedback: 'true',
    allow_student_edit: 'true',
    academic_year: '2026-2027',
    categories: 'Teaching,Faculty,Subject,Laboratory,Infrastructure,Library,Hostel,Transport,Internet,Other'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    adminApi.getSettings()
      .then(res => {
        if (res.data?.settings) {
          setSettings(prev => ({ ...prev, ...res.data.settings }));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await adminApi.updateSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert('Failed to update system settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Sliders className="w-6 h-6 text-purple-600" />
          <span>System Governance & Policies</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Global controls governing anonymity, evaluation periods, and feedback taxonomy.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 font-semibold">
          <Check className="w-5 h-5 text-emerald-600" />
          <span>Settings saved and updated successfully across the institution!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        {/* Setting 1: Anonymous Feedback Toggle */}
        <div className="flex items-start justify-between pb-6 border-b border-slate-100 gap-4">
          <div className="space-y-1">
            <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" /> Anonymous Feedback Submission
            </span>
            <p className="text-xs text-slate-500 leading-relaxed">
              When enabled, students can submit feedback without disclosing their identity to faculty members.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSettings(prev => ({
              ...prev,
              allow_anonymous_feedback: prev.allow_anonymous_feedback === 'true' ? 'false' : 'true'
            }))}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
              settings.allow_anonymous_feedback === 'true' ? 'bg-purple-600' : 'bg-slate-200'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                settings.allow_anonymous_feedback === 'true' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Setting 2: Student Edit/Delete Toggle */}
        <div className="flex items-start justify-between pb-6 border-b border-slate-100 gap-4">
          <div className="space-y-1">
            <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-purple-600" /> Student Feedback Edit & Delete Permissions
            </span>
            <p className="text-xs text-slate-500 leading-relaxed">
              Allow students to modify or withdraw their submitted feedback records prior to administrative closure.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSettings(prev => ({
              ...prev,
              allow_student_edit: prev.allow_student_edit === 'true' ? 'false' : 'true'
            }))}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
              settings.allow_student_edit === 'true' ? 'bg-purple-600' : 'bg-slate-200'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                settings.allow_student_edit === 'true' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Setting 3: Academic Year */}
        <div className="pb-6 border-b border-slate-100 space-y-2">
          <label className="block text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600" /> Active Academic Cycle
          </label>
          <input
            type="text"
            value={settings.academic_year}
            onChange={(e) => setSettings(prev => ({ ...prev, academic_year: e.target.value }))}
            className="w-full sm:w-64 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            placeholder="2026-2027"
          />
        </div>

        {/* Setting 4: Feedback Categories */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-4 h-4 text-purple-600" /> Feedback Categories Taxonomy
          </label>
          <p className="text-xs text-slate-500">Comma-separated categories available for students to select.</p>
          <textarea
            rows={3}
            value={settings.categories}
            onChange={(e) => setSettings(prev => ({ ...prev, categories: e.target.value }))}
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
