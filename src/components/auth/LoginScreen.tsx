import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LogIn, 
  Key, 
  Mail, 
  User, 
  GraduationCap, 
  ShieldCheck, 
  AlertCircle, 
  Check, 
  ArrowRight,
  Loader2 
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, registerStudent, allUsers } = useApp();

  const [activeRole, setActiveRole] = useState<'student' | 'teacher'>('student');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isRegistering) {
      if (!fullName.trim() || !identifier.trim()) {
        setErrorMsg('Please enter your full name and email.');
        return;
      }
      setIsSubmitting(true);
      try {
        const res = await registerStudent({
          fullName: fullName.trim(),
          email: identifier.trim(),
          studentId: studentId.trim(),
          password: password.trim() || 'student123',
        });
        setIsSubmitting(false);

        if (!res.success && res.error) {
          setErrorMsg(res.error);
        }
      } catch (err: any) {
        setIsSubmitting(false);
        setErrorMsg(err.message || 'Registration failed.');
      }
      return;
    }

    const result = login(identifier, password);
    if (!result.success) {
      setErrorMsg(result.message || 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-ground flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-sm sm:max-w-md space-y-6">
        
        {/* Monogram Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-teal-400 to-teal-600 text-white flex items-center justify-center font-serif text-3xl font-bold shadow-[6px_6px_16px_rgba(13,148,136,0.35),-4px_-4px_12px_rgba(255,255,255,0.9),inset_2px_2px_3px_rgba(255,255,255,0.6),inset_-2px_-2px_3px_rgba(0,0,0,0.15)] mx-auto transform hover:scale-105 transition-transform">
            Q
          </div>
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-ink tracking-tight">
              QuizRev
            </h1>
            <p className="text-xs text-ink-muted font-medium">
              Tactile Mock Exam Revision Platform
            </p>
          </div>
        </div>

        {/* Card Body */}
        <div className="clay-surface p-6 sm:p-8 shadow-clay-lg space-y-5">
          
          {/* Role Tabs */}
          {!isRegistering && (
            <div className="grid grid-cols-2 p-1.5 clay-inset rounded-2xl gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveRole('student');
                  setErrorMsg(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                  activeRole === 'student'
                    ? 'clay-surface-sm text-accent shadow-clay-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-accent" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveRole('teacher');
                  setErrorMsg(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                  activeRole === 'teacher'
                    ? 'clay-surface-sm text-amber-700 shadow-clay-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Teacher</span>
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5 flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl clay-inset text-xs text-ink placeholder:text-ink-subtle/70 focus:outline-none focus:ring-2 focus:ring-accent/40 font-medium transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5 flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5 text-ink-muted" />
                <span>
                  {activeRole === 'student' ? 'Email or Student ID *' : 'Teacher Email Address *'}
                </span>
              </label>
              <input
                type="text"
                required
                placeholder={
                  activeRole === 'student'
                    ? 'student@quizrev.edu or STU-2026-0041'
                    : 'teacher@quizrev.edu'
                }
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl clay-inset text-xs text-ink placeholder:text-ink-subtle/70 focus:outline-none focus:ring-2 focus:ring-accent/40 font-medium transition-all"
              />
            </div>

            {isRegistering && (
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  Student ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. STU-2026-0105"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl clay-inset text-xs text-ink placeholder:text-ink-subtle/70 focus:outline-none focus:ring-2 focus:ring-accent/40 font-medium transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5 flex items-center space-x-1">
                <Key className="w-3.5 h-3.5 text-ink-muted" />
                <span>Password</span>
              </label>
              <input
                type="password"
                placeholder={isRegistering ? 'Choose a password' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl clay-inset text-xs text-ink placeholder:text-ink-subtle/70 focus:outline-none focus:ring-2 focus:ring-accent/40 font-mono transition-all"
              />
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-negative text-xs font-semibold flex items-center space-x-2 shadow-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-positive text-xs font-semibold flex items-center space-x-2 shadow-sm">
                <Check className="w-4 h-4 flex-shrink-0 text-positive" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl clay-btn clay-btn-teal text-xs font-bold transition-all shadow-clay-btn flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isRegistering ? 'Creating Account & Syncing...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  <span>{isRegistering ? 'Complete Registration' : 'Sign In to QuizRev'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration toggle */}
          <div className="border-t border-rule pt-4 text-center">
            {isRegistering ? (
              <p className="text-xs text-ink-muted font-medium">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setErrorMsg(null);
                  }}
                  className="text-accent font-bold hover:underline"
                >
                  Sign in here
                </button>
              </p>
            ) : (
              <p className="text-xs text-ink-muted font-medium">
                Student without an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setErrorMsg(null);
                  }}
                  className="text-accent font-bold hover:underline"
                >
                  Register student profile
                </button>
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
