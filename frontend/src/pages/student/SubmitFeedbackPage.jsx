import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { metadataApi, studentApi } from '../../services/api';
import StarRating from '../../components/common/StarRating';
import SentimentBadge from '../../components/common/SentimentBadge';
import {
  Sparkles,
  Send,
  Shield,
  CheckCircle2,
  AlertCircle,
  Building2,
  BookOpen,
  UserCheck,
  Calendar,
  Layers,
  HelpCircle
} from 'lucide-react';

export default function SubmitFeedbackPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [categories, setCategories] = useState([
    'Teaching', 'Faculty', 'Subject', 'Laboratory', 'Infrastructure',
    'Library', 'Hostel', 'Transport', 'Internet', 'Other'
  ]);
  const [allowAnonymousSetting, setAllowAnonymousSetting] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    department_id: user?.department_id || '',
    year: user?.year || 1,
    semester: 5,
    subject_id: searchParams.get('subject_id') || '',
    faculty_id: '',
    feedback_category: 'Teaching',
    written_feedback: '',
    is_anonymous: false
  });

  // 6 Criteria Ratings (1-5 stars)
  const [ratings, setRatings] = useState({
    teaching_quality: 5,
    subject_knowledge: 5,
    communication: 5,
    doubt_clarification: 4,
    classroom_interaction: 4,
    punctuality: 5
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Fetch metadata
  useEffect(() => {
    metadataApi.getDepartments().then(res => {
      if (res.data?.departments) setDepartments(res.data.departments);
    });

    metadataApi.getSettings().then(res => {
      if (res.data?.settings) {
        if (res.data.settings.categories) setCategories(res.data.settings.categories);
        setAllowAnonymousSetting(res.data.settings.allow_anonymous_feedback);
      }
    });
  }, []);

  // Fetch subjects when department changes
  useEffect(() => {
    if (formData.department_id) {
      metadataApi.getSubjects({ department_id: formData.department_id, semester: formData.semester })
        .then(res => {
          if (res.data?.subjects) {
            setSubjects(res.data.subjects);
            // If URL parameter subject exists
            const paramSub = searchParams.get('subject_id');
            if (paramSub && res.data.subjects.some(s => String(s.id) === String(paramSub))) {
              setFormData(prev => ({ ...prev, subject_id: paramSub }));
            } else if (res.data.subjects.length > 0 && !formData.subject_id) {
              setFormData(prev => ({ ...prev, subject_id: res.data.subjects[0].id }));
            }
          }
        });
    }
  }, [formData.department_id, formData.semester]);

  // Fetch faculty assigned to subject
  useEffect(() => {
    if (formData.subject_id) {
      metadataApi.getFaculty({ subject_id: formData.subject_id })
        .then(res => {
          if (res.data?.faculty) {
            setFacultyList(res.data.faculty);
            if (res.data.faculty.length > 0) {
              setFormData(prev => ({ ...prev, faculty_id: res.data.faculty[0].id }));
            } else {
              setFormData(prev => ({ ...prev, faculty_id: '' }));
            }
          }
        });
    }
  }, [formData.subject_id]);

  const handleRatingChange = (key, val) => {
    setRatings(prev => ({ ...prev, [key]: val }));
  };

  const calculateOverallRating = () => {
    const vals = Object.values(ratings);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return avg.toFixed(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.written_feedback.trim().length < 5) {
      setError('Please write at least 5 characters of feedback.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        ...ratings,
        department_id: Number(formData.department_id),
        semester: Number(formData.semester),
        subject_id: formData.subject_id ? Number(formData.subject_id) : null,
        faculty_id: formData.faculty_id ? Number(formData.faculty_id) : null,
        is_anonymous: Boolean(formData.is_anonymous)
      };

      const res = await studentApi.submitFeedback(payload);

      if (res.data?.success) {
        setAnalysisResult(res.data.sentiment);
        setShowSuccessModal(true);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Course & Faculty Feedback Form</span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> AI NLP Powered
          </span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Provide your honest ratings and written opinion. Feedback will be automatically classified by our sentiment analysis engine.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Academic Information */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-sky-600" />
            <h2 className="text-base font-bold text-slate-900">1. Academic Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Department */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Department
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData(prev => ({ ...prev, department_id: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Semester
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData(prev => ({ ...prev, semester: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Feedback Category
              </label>
              <select
                value={formData.feedback_category}
                onChange={(e) => setFormData(prev => ({ ...prev, feedback_category: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold text-sky-900"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Subject */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Subject
              </label>
              <select
                value={formData.subject_id}
                onChange={(e) => setFormData(prev => ({ ...prev, subject_id: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">-- General / Non-Subject Specific --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>

            {/* Faculty */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Faculty Instructor
              </label>
              <select
                value={formData.faculty_id}
                onChange={(e) => setFormData(prev => ({ ...prev, faculty_id: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">-- General Facility / No Specific Faculty --</option>
                {facultyList.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.email})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Card 2: 6 Criteria Ratings (1-5 Stars) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">2. Performance Evaluation</h2>
            </div>
            <div className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
              Overall Score: {calculateOverallRating()} / 5.0 ⭐
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Teaching Quality */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-800">Teaching Quality</span>
                  <span className="text-xs font-semibold text-slate-500">{ratings.teaching_quality} / 5</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">Clarity of lectures, depth of coverage, and delivery technique.</p>
              </div>
              <StarRating
                value={ratings.teaching_quality}
                onChange={(v) => handleRatingChange('teaching_quality', v)}
                showLabel
              />
            </div>

            {/* 2. Subject Knowledge */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-800">Subject Knowledge</span>
                  <span className="text-xs font-semibold text-slate-500">{ratings.subject_knowledge} / 5</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">Mastery over curriculum, practical insights, and latest trends.</p>
              </div>
              <StarRating
                value={ratings.subject_knowledge}
                onChange={(v) => handleRatingChange('subject_knowledge', v)}
                showLabel
              />
            </div>

            {/* 3. Communication */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-800">Communication</span>
                  <span className="text-xs font-semibold text-slate-500">{ratings.communication} / 5</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">Audibility, expressive clarity, and articulation.</p>
              </div>
              <StarRating
                value={ratings.communication}
                onChange={(v) => handleRatingChange('communication', v)}
                showLabel
              />
            </div>

            {/* 4. Doubt Clarification */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-800">Doubt Clarification</span>
                  <span className="text-xs font-semibold text-slate-500">{ratings.doubt_clarification} / 5</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">Patience, responsiveness, and availability for questions.</p>
              </div>
              <StarRating
                value={ratings.doubt_clarification}
                onChange={(v) => handleRatingChange('doubt_clarification', v)}
                showLabel
              />
            </div>

            {/* 5. Classroom Interaction */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-800">Classroom Interaction</span>
                  <span className="text-xs font-semibold text-slate-500">{ratings.classroom_interaction} / 5</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">Student engagement, group discussions, and active learning.</p>
              </div>
              <StarRating
                value={ratings.classroom_interaction}
                onChange={(v) => handleRatingChange('classroom_interaction', v)}
                showLabel
              />
            </div>

            {/* 6. Punctuality */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-slate-800">Punctuality</span>
                  <span className="text-xs font-semibold text-slate-500">{ratings.punctuality} / 5</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">Timely arrival, regular class attendance, and syllabus pacing.</p>
              </div>
              <StarRating
                value={ratings.punctuality}
                onChange={(v) => handleRatingChange('punctuality', v)}
                showLabel
              />
            </div>
          </div>
        </div>

        {/* Card 3: Written Feedback & Anonymity */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">3. Detailed Written Feedback</h2>
            <span className="text-xs font-medium text-slate-400">
              {formData.written_feedback.length} characters
            </span>
          </div>

          <div>
            <textarea
              required
              rows={5}
              value={formData.written_feedback}
              onChange={(e) => setFormData(prev => ({ ...prev, written_feedback: e.target.value }))}
              placeholder="Write your feedback here... Be specific about what went well, areas of improvement, or any suggestions you have for the faculty or course."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all placeholder-slate-400 resize-y"
            />
          </div>

          {/* Anonymous Option */}
          {allowAnonymousSetting && (
            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 flex items-start gap-3">
              <input
                type="checkbox"
                id="is_anonymous"
                checked={formData.is_anonymous}
                onChange={(e) => setFormData(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                className="mt-1 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 cursor-pointer"
              />
              <label htmlFor="is_anonymous" className="cursor-pointer">
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-sky-600" /> Submit this feedback anonymously
                </span>
                <p className="text-xs text-slate-600 mt-0.5">
                  When enabled, your name and register number will be completely hidden from the faculty instructor. Only system administrators can moderate for conduct.
                </p>
              </label>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-sky-500/25 transition-all hover:scale-102 cursor-pointer disabled:opacity-50 text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Feedback & Analyze</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success & NLP Results Modal */}
      {showSuccessModal && analysisResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in fade-in zoom-in-95">
            <div className="text-center">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Feedback Submitted Successfully!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your response has been analyzed by our NLP Sentiment Classifier.
              </p>
            </div>

            {/* AI Analysis Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Detected Sentiment</span>
                <SentimentBadge
                  sentiment={analysisResult.sentiment}
                  score={analysisResult.sentiment_score}
                  confidence={analysisResult.confidence_score}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Confidence</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {Math.round((analysisResult.confidence_score || 0.8) * 100)}%
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Polarity Score</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {analysisResult.sentiment_score > 0 ? `+${analysisResult.sentiment_score}` : analysisResult.sentiment_score}
                  </span>
                </div>
              </div>

              {analysisResult.keywords && analysisResult.keywords.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">Extracted Keywords:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.keywords.map((kw, i) => (
                      <span key={i} className="text-xs bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md font-medium">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/student/history')}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 text-sm transition-colors"
              >
                View in History
              </button>
              <button
                onClick={() => navigate('/student/dashboard')}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-sky-600 hover:bg-sky-700 text-sm transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
