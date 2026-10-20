import { Question, QuestionChoice } from '../types/quiz';

/**
 * Fisher-Yates array shuffle algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Shuffles questions and/or choices for a mock exam session
 * Re-indexes choices labels (A, B, C, D) while maintaining correct answer pointers.
 */
export function prepareExamSession(
  questions: Question[],
  options: {
    shuffleQuestions?: boolean;
    shuffleChoices?: boolean;
  } = { shuffleQuestions: true, shuffleChoices: true }
): Question[] {
  let processedQuestions = options.shuffleQuestions ? shuffleArray(questions) : [...questions];

  return processedQuestions.map((q, qIndex) => {
    let choices: QuestionChoice[] = options.shuffleChoices
      ? shuffleArray(q.choices)
      : [...q.choices];

    // Re-assign clean standard labels A, B, C, D to the choices
    const standardLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
    const labeledChoices = choices.map((choice, cIndex) => ({
      ...choice,
      label: standardLabels[cIndex] || String.fromCharCode(65 + cIndex),
    }));

    return {
      ...q,
      orderIndex: qIndex + 1,
      choices: labeledChoices,
    };
  });
}
