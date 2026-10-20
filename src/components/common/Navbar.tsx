import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ChevronDown, 
  UserCheck, 
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
    allUsers,
    switchUser,
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
    <header className="sticky top-0 z-40 bg-ground/90 backdrop-blur-md border-b border-border transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView('home')}>
          <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center font-serif text-xl font-bold shadow-sm">
            Q
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif text-2xl font-semibold tracking-tight text-ink">QuizRev</span>
              <span className={`text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full ${
                isTeacher 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-accent-light text-accent border border-accent-border'
              }`}>
                {isTeacher ? 'Teacher Mode' : 'Student Mode'}
              </span>
            </div>
            <p className="text-[11px] text-ink-muted hidden sm:block -mt-1">
              Mobile-First Mock Exam & Revision
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {isTeacher ? (
            <>
              <button
                onClick={() => setCurrentView('home')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'home'
                    ? 'bg-surface text-ink font-semibold'
                    : 'text-ink-muted hover:text-ink hover:bg-surface/60'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('upload')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  currentView === 'upload'
                    ? 'bg-surface text-ink font-semibold'
                    : 'text-ink-muted hover:text-ink hover:bg-surface/60'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Exam</span>
              </button>
              <button
                onClick={() => setCurrentView('attempts')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  currentView === 'attempts'
                    ? 'bg-surface text-ink font-semibold'
                    : 'text-ink-muted hover:text-ink hover:bg-surface/60'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Student Scores</span>
              </button>
              <button
                onClick={() => setCurrentView('students')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  currentView === 'students'
                    ? 'bg-surface text-ink font-semibold'
                    : 'text-ink-muted hover:text-ink hover:bg-surface/60'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Students</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setCurrentView('home')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'home'
                    ? 'bg-surface text-ink font-semibold'
                    : 'text-ink-muted hover:text-ink hover:bg-surface/60'
                }`}
              >
                Mock Exams
              </button>
              <button
                onClick={() => setCurrentView('history')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  currentView === 'history'
                    ? 'bg-surface text-ink font-semibold'
                    : 'text-ink-muted hover:text-ink hover:bg-surface/60'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Attempt History</span>
              </button>
              <button
                onClick={() => setCurrentView('analytics')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  currentView === 'analytics'
                    ? 'bg-surface text-ink font-semibold'
                    : 'text-ink-muted hover:text-ink hover:bg-surface/60'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                <span>Analytics & Rating</span>
              </button>
            </>
          )}
        </nav>

        {/* Right Action Bar (User Profile & Sign Out) */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* User Selector Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-control border border-border hover:border-control transition-all bg-ground"
            >
              <img
                src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=QR'}
                alt={currentUser.fullName}
                className="w-7 h-7 rounded-full object-cover bg-surface border border-border"
              />
              <div className="text-left hidden sm:block">
                <p className="text-xs font-medium text-ink leading-tight">
                  {currentUser.fullName}
                </p>
                <p className="text-[11px] text-ink-muted capitalize">
                  {currentUser.role}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-ground rounded-2xl shadow-lg border border-border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-rule">
                  <p className="text-xs font-semibold text-ink">
                    {currentUser.fullName}
                  </p>
                  <p className="text-[11px] text-ink-muted">
                    {currentUser.email}
                  </p>
                </div>

                <div className="py-1 max-h-48 overflow-y-auto">
                  <p className="px-3 py-1 text-[10px] uppercase font-bold text-ink-muted tracking-wider">
                    Accounts
                  </p>
                  {allUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        switchUser(user.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-surface transition-colors ${
                        user.id === currentUser.id ? 'bg-accent-light' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="w-6 h-6 rounded-full object-cover border border-border"
                        />
                        <div>
                          <p className="text-xs font-medium text-ink leading-tight">
                            {user.fullName}
                          </p>
                          <p className="text-[10px] text-ink-muted capitalize">
                            {user.role}
                          </p>
                        </div>
                      </div>
                      {user.id === currentUser.id && (
                        <UserCheck className="w-3.5 h-3.5 text-accent" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="border-t border-rule pt-1 mt-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-negative hover:bg-negative-bg/50 transition-colors flex items-center space-x-2"
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
