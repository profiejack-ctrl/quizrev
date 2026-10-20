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
    <div className="w-full overflow-x-auto no-scrollbar py-1">
      <div className="flex items-center space-x-2 min-w-max pb-1">
        {/* All Subjects Pill */}
        <button
          onClick={() => onSelectSubject(null)}
          className={`px-4 py-2 rounded-control text-xs font-medium transition-all flex items-center space-x-1.5 ${
            selectedSubjectId === null
              ? 'bg-ink text-white shadow-sm'
              : 'bg-surface text-ink-muted hover:text-ink hover:bg-[#efefed] border border-border'
          }`}
        >
          <span>All Subjects</span>
          <span
            className={`text-[11px] px-1.5 py-0.2 rounded-full ${
              selectedSubjectId === null ? 'bg-white/20 text-white' : 'bg-ground text-ink-muted'
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
              className={`px-4 py-2 rounded-control text-xs font-medium transition-all flex items-center space-x-2 ${
                isSelected
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-surface text-ink hover:text-ink hover:bg-[#efefed] border border-border'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: isSelected ? '#ffffff' : sub.color }}
              />
              <span>{sub.name}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-ground text-ink-muted'
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
