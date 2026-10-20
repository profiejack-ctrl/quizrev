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
  ArrowRight 
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, registerStudent, allUsers } = useApp();

  const [activeRole, setActiveRole] = useState<'student' | 'teacher'>('student');
  const [isRegistering, setIsRegistering] = useState(false);

  // Form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (isRegistering) {
      if (!fullName.trim() || !identifier.trim()) {
        setErrorMsg('Please enter your full name and email.');
        return;
      }
      try {
        const student = registerStudent({
          fullName: fullName.trim(),
          email: identifier.trim(),
          studentId: studentId.trim(),
          password: password.trim() || 'student123',
        });
        login(student.email, password.trim() || 'student123');
      } catch (err: any) {
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
          <div className="w-12 h-12 rounded-2xl bg-accent text-white flex items-center justify-center font-serif text-2xl font-bold shadow-sm mx-auto">
            Q
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-ink tracking-tight">
              QuizRev
            </h1>
            <p className="text-xs text-ink-muted">
              Mobile-First Mock Exam & Revision Platform
            </p>
          </div>
        </div>

        {/* Card Body */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
          
          {/* Role Tabs */}
          {!isRegistering && (
            <div className="grid grid-cols-2 p-1 bg-ground rounded-xl border border-border">
              <button
                type="button"
                onClick={() => {
                  setActiveRole('student');
                  setErrorMsg(null);
                }}
                className={`py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  activeRole === 'student'
                    ? 'bg-surface text-ink font-semibold shadow-xs'
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
                className={`py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  activeRole === 'teacher'
                    ? 'bg-surface text-ink font-semibold shadow-xs'
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
                <label className="block text-xs font-medium text-ink mb-1.5 flex items-center space-x-1">
                  <User className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-accent bg-ground"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-ink mb-1.5 flex items-center space-x-1">
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-accent bg-ground"
              />
            </div>

            {isRegistering && (
              <div>
                <label className="block text-xs font-medium text-ink mb-1.5">
                  Student ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. STU-2026-0105"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-accent bg-ground"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-ink mb-1.5 flex items-center space-x-1">
                <Key className="w-3.5 h-3.5 text-ink-muted" />
                <span>Password</span>
              </label>
              <input
                type="password"
                placeholder={isRegistering ? 'Choose a password' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-accent bg-ground font-mono"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-negative-bg/50 border border-negative/30 rounded-xl text-negative-ink text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-positive-bg/50 border border-positive/30 rounded-xl text-positive-ink text-xs flex items-center space-x-2">
                <Check className="w-4 h-4 flex-shrink-0 text-positive" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-control bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors shadow-sm flex items-center justify-center space-x-1.5 active:scale-98"
            >
              <span>{isRegistering ? 'Complete Registration' : 'Sign In to QuizRev'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Registration toggle */}
          <div className="border-t border-rule pt-4 text-center">
            {isRegistering ? (
              <p className="text-xs text-ink-muted">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setErrorMsg(null);
                  }}
                  className="text-accent font-semibold hover:underline"
                >
                  Sign in here
                </button>
              </p>
            ) : (
              <p className="text-xs text-ink-muted">
                Student without an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setErrorMsg(null);
                  }}
                  className="text-accent font-semibold hover:underline"
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
