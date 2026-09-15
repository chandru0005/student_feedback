import React, { useState, useEffect } from 'react';
import { adminApi, metadataApi } from '../../services/api';
import {
  BookOpen,
  Building2,
  PlusCircle,
  UserCheck,
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function ManageAcademicsPage() {
  const [tab, setTab] = useState('subjects'); // 'departments' or 'subjects'
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Department Form
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');

  // New Subject Form
  const [subjCode, setSubjCode] = useState('');
  const [subjName, setSubjName] = useState('');
  const [subjDept, setSubjDept] = useState('');
  const [subjSem, setSubjSem] = useState(1);

  // Assign Faculty State
  const [assignModal, setAssignModal] = useState(null); // subject object
  const [selectedFacultyId, setSelectedFacultyId] = useState('');

  const refreshData = () => {
    setLoading(true);
    Promise.all([
      adminApi.getDepartments(),
      adminApi.getSubjects(),
      metadataApi.getFaculty()
    ]).then(([dRes, sRes, fRes]) => {
      if (dRes.data?.departments) {
        setDepartments(dRes.data.departments);
        if (dRes.data.departments.length > 0 && !subjDept) {
          setSubjDept(dRes.data.departments[0].id);
        }
      }
      if (sRes.data?.subjects) setSubjects(sRes.data.subjects);
      if (fRes.data?.faculty) setFacultyList(fRes.data.faculty);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    if (!deptCode || !deptName) return;
    try {
      await adminApi.createDepartment({ code: deptCode, name: deptName });
      setDeptCode('');
      setDeptName('');
      refreshData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create department');
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!subjCode || !subjName || !subjDept) return;
    try {
      await adminApi.createSubject({
        code: subjCode,
        name: subjName,
        department_id: Number(subjDept),
        semester: Number(subjSem)
      });
      setSubjCode('');
      setSubjName('');
      refreshData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create subject');
    }
  };

  const handleAssignFaculty = async (e) => {
    e.preventDefault();
    if (!assignModal || !selectedFacultyId) return;
    try {
      await adminApi.assignFaculty({
        subject_id: assignModal.id,
        faculty_id: Number(selectedFacultyId),
        academic_year: '2026-2027'
      });
      setAssignModal(null);
      setSelectedFacultyId('');
      refreshData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign faculty');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-600" />
            <span>Academic Management</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure institutional departments, curriculum subjects, and faculty teaching assignments.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="p-1 bg-white border border-slate-200 rounded-2xl flex items-center gap-1 shadow-2xs">
          <button
            onClick={() => setTab('subjects')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'subjects'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Subjects & Faculty Mapping
          </button>
          <button
            onClick={() => setTab('departments')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'departments'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Departments
          </button>
        </div>
      </div>

      {tab === 'departments' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Department Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" /> Add New Department
            </h2>
            <form onSubmit={handleCreateDept} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI-DS or BIOTECH"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artificial Intelligence and Data Science"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-xs"
              >
                Create Department
              </button>
            </form>
          </div>

          {/* Department List */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Configured Departments ({departments.length})</h2>
            <div className="divide-y divide-slate-100">
              {departments.map((d) => (
                <div key={d.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-100 mr-2">
                      {d.code}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">{d.name}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {d.subjects_count || 0} active subjects
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Subject Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600" /> Add New Subject
            </h2>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Subject Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS601"
                  value={subjCode}
                  onChange={(e) => setSubjCode(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Machine Learning and Neural Networks"
                  value={subjName}
                  onChange={(e) => setSubjName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Department</label>
                  <select
                    value={subjDept}
                    onChange={(e) => setSubjDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Semester</label>
                  <select
                    value={subjSem}
                    onChange={(e) => setSubjSem(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Sem {s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-xs"
              >
                Create Subject
              </button>
            </form>
          </div>

          {/* Subjects and Assigned Faculty Table */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-6 pb-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Subjects & Faculty Assignments ({subjects.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-6">Subject</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Semester</th>
                    <th className="py-3 px-4">Assigned Faculty</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {subjects.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6">
                        <span className="font-bold text-slate-900 block">{s.name}</span>
                        <span className="text-xs font-mono text-purple-700">{s.code}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                        {s.department_code}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        Sem {s.semester}
                      </td>
                      <td className="py-3.5 px-4">
                        {s.faculty_name ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
                            <UserCheck className="w-4 h-4" />
                            <span>Prof. {s.faculty_name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => {
                            setAssignModal(s);
                            setSelectedFacultyId(s.faculty_id || '');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-800 text-xs font-bold transition-colors"
                        >
                          {s.faculty_name ? 'Reassign' : 'Assign Faculty'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Assign Faculty Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Assign Faculty to Course</h3>
            <p className="text-xs text-slate-500">
              Assign teaching instructor for <strong className="text-slate-800">{assignModal.name} ({assignModal.code})</strong>.
            </p>

            <form onSubmit={handleAssignFaculty} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Select Faculty</label>
                <select
                  required
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="">-- Choose Faculty Member --</option>
                  {facultyList.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.department_name || 'Faculty'})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
