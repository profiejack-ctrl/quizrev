import React from 'react';
import { Subject } from '../../types/quiz';

interface SubjectSelectorProps {
  subjects: Subject[];
  selectedSubjectId: string | null;
  onSelectSubject: (id: string | null) => void;
  quizCountsBySubject: Record<string, number>;
}

export const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  subjects,
  selectedSubjectId,
  onSelectSubject,
  quizCountsBySubject,
}) => {
  const totalQuizzes = Object.values(quizCountsBySubject).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div className="flex items-center space-x-2.5 min-w-max pb-1 px-1">
        {/* All Subjects Pill */}
        <button
          onClick={() => onSelectSubject(null)}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 active:scale-95 ${
            selectedSubjectId === null
              ? 'clay-inset-sm text-accent ring-2 ring-accent/30 bg-teal-50/50'
              : 'clay-surface-sm text-ink-muted hover:text-ink shadow-clay-sm'
          }`}
        >
          <span>All Subjects</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
              selectedSubjectId === null ? 'bg-accent text-white shadow-xs' : 'clay-inset-sm text-ink-muted'
            }`}
          >
            {totalQuizzes}
          </span>
        </button>

        {/* Individual Subject Pills */}
        {subjects.map((sub) => {
          const count = quizCountsBySubject[sub.id] || 0;
          const isSelected = selectedSubjectId === sub.id;

          return (
            <button
              key={sub.id}
              onClick={() => onSelectSubject(sub.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 active:scale-95 ${
                isSelected
                  ? 'clay-inset-sm text-accent ring-2 ring-accent/30 bg-teal-50/50'
                  : 'clay-surface-sm text-ink hover:text-ink shadow-clay-sm'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-inner"
                style={{ backgroundColor: sub.color || '#0d9488' }}
              />
              <span>{sub.name}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  isSelected ? 'bg-accent text-white shadow-xs' : 'clay-inset-sm text-ink-muted'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
