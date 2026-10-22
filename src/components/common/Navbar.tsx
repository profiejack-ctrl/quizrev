import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ChevronDown, 
  BookOpen, 
  BarChart2, 
  History, 
  UploadCloud, 
  Users, 
  ClipboardList,
  LogOut
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    logout,
    currentView,
    setCurrentView,
    isExamInProgress,
  } = useApp();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser || isExamInProgress) {
    return null;
  }

  const isTeacher = currentUser.role === 'teacher';

  return (
    <header className="sticky top-2 z-40 max-w-7xl mx-auto px-3 sm:px-6 transition-all mb-4">
      <div className="clay-surface px-4 sm:px-6 py-2.5 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setCurrentView('home')}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 text-white flex items-center justify-center font-serif text-2xl font-bold shadow-[4px_4px_10px_rgba(13,148,136,0.35),-2px_-2px_6px_rgba(255,255,255,0.8),inset_1.5px_1.5px_2px_rgba(255,255,255,0.6),inset_-1.5px_-1.5px_2px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform">
            Q
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif text-2xl font-semibold tracking-tight text-ink">QuizRev</span>
              <span className={`text-[10px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full ${
                isTeacher 
                  ? 'clay-inset-sm text-amber-700 font-extrabold' 
                  : 'clay-inset-sm text-accent font-extrabold'
              }`}>
                {isTeacher ? 'Teacher Mode' : 'Student Mode'}
              </span>
            </div>
            <p className="text-[11px] text-ink-muted hidden sm:block -mt-1 font-medium">
              Tactile Mock Exam Revision
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1.5 p-1 clay-inset rounded-2xl">
          {isTeacher ? (
            <>
              <button
                onClick={() => setCurrentView('home')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  currentView === 'home'
                    ? 'clay-surface-sm text-accent shadow-clay-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-white/40'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('upload')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  currentView === 'upload'
                    ? 'clay-surface-sm text-accent shadow-clay-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-white/40'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Exam</span>
              </button>
              <button
                onClick={() => setCurrentView('attempts')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  currentView === 'attempts'
                    ? 'clay-surface-sm text-accent shadow-clay-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-white/40'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Scores</span>
              </button>
              <button
                onClick={() => setCurrentView('students')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  currentView === 'students'
                    ? 'clay-surface-sm text-accent shadow-clay-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-white/40'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Students</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setCurrentView('home')}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  currentView === 'home'
                    ? 'clay-surface-sm text-accent shadow-clay-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-white/40'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Mock Exams</span>
              </button>
              <button
                onClick={() => setCurrentView('history')}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  currentView === 'history'
                    ? 'clay-surface-sm text-accent shadow-clay-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-white/40'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>My History</span>
              </button>
              <button
                onClick={() => setCurrentView('analytics')}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  currentView === 'analytics'
                    ? 'clay-surface-sm text-accent shadow-clay-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-white/40'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Analytics</span>
              </button>
            </>
          )}
        </nav>

        {/* Right Action Bar (User Profile & Sign Out) */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* User Profile & Sign Out */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="clay-surface-sm px-2.5 py-1.5 flex items-center space-x-2 cursor-pointer active:scale-95 transition-all"
              title="View account details"
            >
              <img
                src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=QR'}
                alt={currentUser.fullName}
                className="w-7 h-7 rounded-full object-cover shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),2px_2px_5px_rgba(166,178,198,0.4)]"
              />
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-ink leading-tight">
                  {currentUser.fullName}
                </p>
                <p className="text-[10px] text-ink-muted capitalize font-medium">
                  {currentUser.role}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 clay-surface p-2 shadow-clay-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3 clay-inset rounded-xl space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isTeacher ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                    }`}>
                      {isTeacher ? 'Teacher Account' : 'Student Account'}
                    </span>
                    {currentUser.studentId && (
                      <span className="text-[11px] text-ink-muted tabular-nums font-mono font-medium">
                        {currentUser.studentId}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-ink leading-tight">
                    {currentUser.fullName}
                  </p>
                  <p className="text-xs text-ink-muted truncate">
                    {currentUser.email}
                  </p>
                </div>

                <div className="pt-2 px-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-negative hover:bg-rose-100/50 rounded-xl transition-colors flex items-center space-x-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
