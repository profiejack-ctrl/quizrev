import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, 
  UserPlus, 
  Search, 
  Award, 
  CheckCircle2, 
  X, 
  ExternalLink, 
  Check, 
  RefreshCw, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

export const StudentManager: React.FC = () => {
  const { allUsers, attempts, createStudentAccount, switchUser, refreshFromSupabase, isSyncingWithSupabase } = useApp();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [tempPassword, setTempPassword] = useState('QuizRev@2026');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Auto-refresh when opening Student Directory
  useEffect(() => {
    refreshFromSupabase();
  }, []);

  const students = allUsers.filter((u) => u.role === 'student');

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.studentId && s.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setIsCreating(true);
    setCreateError(null);

    const res = await createStudentAccount({
      fullName: fullName.trim(),
      email: email.trim(),
      studentId: studentId.trim() || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
      password: tempPassword || 'QuizRev@2026',
    });

    setIsCreating(false);

    if (!res.success && res.error) {
      setCreateError(res.error);
      return;
    }

    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setIsCreateModalOpen(false);
      setFullName('');
      setEmail('');
      setStudentId('');
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 pb-24 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="font-sans text-2xl font-bold text-ink">
              Student Account Directory
            </h2>
            <button
              onClick={() => refreshFromSupabase()}
              disabled={isSyncingWithSupabase}
              title="Refresh students from cloud database"
              className="clay-btn-neutral p-1.5 rounded-xl text-slate-600 hover:text-slate-900 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingWithSupabase ? 'animate-spin text-accent' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Manage enrolled students, create accounts, and monitor individual revision activity.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="clay-btn-teal px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create Student Account</span>
        </button>
      </div>

      {/* Inset Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by student name, ID, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="clay-inset w-full pl-11 pr-4 py-3 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent transition-all font-medium"
        />
      </div>

      {/* Students List */}
      <div className="space-y-3.5">
        {filteredStudents.length === 0 ? (
          <div className="clay-surface p-10 text-center rounded-3xl text-xs text-slate-500 font-medium">
            No students found matching "{searchTerm}".
          </div>
        ) : (
          filteredStudents.map((student) => {
            const studentAttempts = attempts.filter((a) => a.studentId === student.id);
            const totalAttempts = studentAttempts.length;
            const avgScore =
              totalAttempts > 0
                ? Math.round(
                    (studentAttempts.reduce((a, b) => a + b.percentage, 0) / totalAttempts) * 10
                  ) / 10
                : null;

            return (
              <div
                key={student.id}
                className="clay-surface p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:scale-[1.008] transition-all"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-full p-0.5 clay-inset flex items-center justify-center flex-shrink-0">
                    <img
                      src={student.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=ST'}
                      alt={student.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-sans text-base font-bold text-ink leading-tight">
                      {student.fullName}
                    </h4>
                    <p className="text-xs text-ink-muted font-medium mt-0.5">
                      <span className="text-accent font-semibold">{student.studentId || 'No ID'}</span> • {student.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200/60">
                  <div className="text-left sm:text-right">
                    <p className="text-[11px] font-medium text-slate-400">Mock Exams Taken</p>
                    <p className="text-xs font-bold text-slate-800 tabular-nums mt-0.5">
                      {totalAttempts} {totalAttempts === 1 ? 'exam' : 'exams'}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-[11px] font-medium text-slate-400">Average Score</p>
                    <p className="text-xs font-bold text-slate-800 tabular-nums mt-0.5">
                      {avgScore !== null ? `${avgScore}%` : '—'}
                    </p>
                  </div>

                  <button
                    onClick={() => switchUser(student.id)}
                    className="clay-btn-neutral px-3.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-700 flex items-center space-x-1"
                    title="Simulate student session"
                  >
                    <span>View As</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Student Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="clay-surface rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-clay-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/15 flex items-center justify-center text-accent shadow-clay-sm">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-sans text-lg font-bold text-ink">
                  Create Student Account
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="clay-btn-neutral p-1.5 rounded-xl text-ink-muted hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gabriel Mendoza"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="clay-inset w-full px-3.5 py-2.5 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Student Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. gabriel.mendoza@student.quizrev.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="clay-inset w-full px-3.5 py-2.5 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Student ID Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. STU-2026-0245"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="clay-inset w-full px-3.5 py-2.5 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Temporary Password
                </label>
                <input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="clay-inset w-full px-3.5 py-2.5 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent font-mono"
                />
              </div>

              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="clay-btn-neutral px-4 py-2 rounded-xl text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="clay-btn-teal px-5 py-2 rounded-xl text-white text-xs font-bold flex items-center space-x-1.5 disabled:opacity-60"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Cloud...</span>
                    </>
                  ) : successMsg ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Created!</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
