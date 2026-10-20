import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  BookOpen, 
  History, 
  BarChart2, 
  UploadCloud, 
  Users, 
  ClipboardList, 
  LayoutDashboard,
  LogOut 
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { currentUser, currentView, setCurrentView, isExamInProgress, logout } = useApp();

  if (!currentUser || isExamInProgress) return null;

  const isTeacher = currentUser.role === 'teacher';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-ground/95 backdrop-blur-md border-t border-border safe-pb shadow-lg">
      <nav className="flex items-center justify-around px-2 py-2">
        {isTeacher ? (
          <>
            <button
              onClick={() => setCurrentView('home')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                currentView === 'home'
                  ? 'text-accent font-semibold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">Overview</span>
            </button>

            <button
              onClick={() => setCurrentView('upload')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                currentView === 'upload'
                  ? 'text-accent font-semibold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <UploadCloud className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">Upload</span>
            </button>

            <button
              onClick={() => setCurrentView('attempts')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                currentView === 'attempts'
                  ? 'text-accent font-semibold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <ClipboardList className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">Scores</span>
            </button>

            <button
              onClick={() => setCurrentView('students')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                currentView === 'students'
                  ? 'text-accent font-semibold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Users className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">Students</span>
            </button>

            <button
              onClick={logout}
              className="flex flex-col items-center py-1 px-3 rounded-xl text-negative/80 hover:text-negative transition-all"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">Logout</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setCurrentView('home')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                currentView === 'home'
                  ? 'text-accent font-semibold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <BookOpen className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">Exams</span>
            </button>

            <button
              onClick={() => setCurrentView('history')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                currentView === 'history'
                  ? 'text-accent font-semibold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <History className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">History</span>
            </button>

            <button
              onClick={() => setCurrentView('analytics')}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                currentView === 'analytics'
                  ? 'text-accent font-semibold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <BarChart2 className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">Analytics</span>
            </button>

            <button
              onClick={logout}
              className="flex flex-col items-center py-1 px-3 rounded-xl text-negative/80 hover:text-negative transition-all"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">Logout</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
};
