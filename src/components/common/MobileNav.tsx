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
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 max-w-lg mx-auto clay-surface p-1.5 shadow-clay-lg safe-pb">
      <nav className="flex items-center justify-around">
        {isTeacher ? (
          <>
            <button
              onClick={() => setCurrentView('home')}
              className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all ${
                currentView === 'home'
                  ? 'clay-inset-sm text-accent font-bold'
                  : 'text-ink-muted hover:text-ink active:scale-95'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Overview</span>
            </button>

            <button
              onClick={() => setCurrentView('upload')}
              className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all ${
                currentView === 'upload'
                  ? 'clay-inset-sm text-accent font-bold'
                  : 'text-ink-muted hover:text-ink active:scale-95'
              }`}
            >
              <UploadCloud className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Upload</span>
            </button>

            <button
              onClick={() => setCurrentView('attempts')}
              className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all ${
                currentView === 'attempts'
                  ? 'clay-inset-sm text-accent font-bold'
                  : 'text-ink-muted hover:text-ink active:scale-95'
              }`}
            >
              <ClipboardList className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Scores</span>
            </button>

            <button
              onClick={() => setCurrentView('students')}
              className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all ${
                currentView === 'students'
                  ? 'clay-inset-sm text-accent font-bold'
                  : 'text-ink-muted hover:text-ink active:scale-95'
              }`}
            >
              <Users className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Students</span>
            </button>

            <button
              onClick={logout}
              className="flex flex-col items-center py-1.5 px-3 rounded-2xl text-negative/80 hover:text-negative active:scale-95 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Logout</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setCurrentView('home')}
              className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all ${
                currentView === 'home'
                  ? 'clay-inset-sm text-accent font-bold'
                  : 'text-ink-muted hover:text-ink active:scale-95'
              }`}
            >
              <BookOpen className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Exams</span>
            </button>

            <button
              onClick={() => setCurrentView('history')}
              className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all ${
                currentView === 'history'
                  ? 'clay-inset-sm text-accent font-bold'
                  : 'text-ink-muted hover:text-ink active:scale-95'
              }`}
            >
              <History className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">History</span>
            </button>

            <button
              onClick={() => setCurrentView('analytics')}
              className={`flex flex-col items-center py-1.5 px-3 rounded-2xl transition-all ${
                currentView === 'analytics'
                  ? 'clay-inset-sm text-accent font-bold'
                  : 'text-ink-muted hover:text-ink active:scale-95'
              }`}
            >
              <BarChart2 className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Analytics</span>
            </button>

            <button
              onClick={logout}
              className="flex flex-col items-center py-1.5 px-3 rounded-2xl text-negative/80 hover:text-negative active:scale-95 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Logout</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
};
