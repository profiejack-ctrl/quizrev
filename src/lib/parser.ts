import { ParseExamResult, ParsedQuestionResult } from '../types/quiz';

/**
 * Parses raw text from a DOCX, PDF, or pasted file into structured quiz questions
 */
export function parseExamText(rawText: string, filenameHint = ''): ParseExamResult {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const errors: string[] = [];
  
  if (lines.length === 0) {
    return {
      title: filenameHint.replace(/\.[^/.]+$/, '') || 'Untitled Mock Exam',
      questions: [],
      errors: ['File or text is empty.'],
      rawText,
    };
  }

  // 1. Determine Title and Subject Hint from header lines
  let title = filenameHint.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Mock Exam';
  let subjectHint = '';

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    if (/(subject|course|category):\s*(.*)/i.test(line)) {
      const match = line.match(/(subject|course|category):\s*(.*)/i);
      if (match && match[2]) subjectHint = match[2].trim();
    } else if (/(exam|quiz|test|assessment|mock)/i.test(line) && !line.match(/^[0-9]+[.)]/)) {
      title = line.replace(/^[#* \-_]+/, '').replace(/[#* \-_]+$/, '').trim();
    }
  }

  // 2. Check for separate Answer Key block at bottom
  // e.g. "Answer Key:", "Answers:", "Keys:"
  const answerKeyMap = new Map<number, string>();
  let mainTextLines: string[] = [];
  let isAnswerKeySection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^(answer\s*keys?|answers?|key\s*answers?):?$/i.test(line)) {
      isAnswerKeySection = true;
      continue;
    }

    if (isAnswerKeySection) {
      // Matches: "1. A", "1) B", "1 - C", "1: D", or space separated "1. A 2. B 3. C"
      const pairRegex = /(\d+)\s*[:.\-)]\s*([A-F])/gi;
      let match;
      let foundAny = false;
      while ((match = pairRegex.exec(line)) !== null) {
        const qNum = parseInt(match[1], 10);
        const ans = match[2].toUpperCase();
        answerKeyMap.set(qNum, ans);
        foundAny = true;
      }
      if (!foundAny) {
        // Maybe single line like "A, B, C, D"
        const lettersOnly = line.split(/[,\s]+/).filter(token => /^[A-F]$/i.test(token));
        if (lettersOnly.length > 0) {
          lettersOnly.forEach((letter, idx) => {
            const qNum = answerKeyMap.size + idx + 1;
            answerKeyMap.set(qNum, letter.toUpperCase());
          });
        }
      }
    } else {
      mainTextLines.push(line);
    }
  }

  // 3. Parse Questions and Choices
  // Question start pattern: "1. ", "1) ", "Question 1:", "Q1."
  const questionRegex = /^(?:Question\s+|Q)?(\d+)[\.\)]\s*(.*)$/i;
  // Choice pattern: "A. ", "A) ", "(A) ", "*A. " (asterisk indicates correct)
  const choiceRegex = /^(?:\*|\(?[xX]\)?\s*)?\(?([A-Fa-f])\)?[.\-\)]\s*(.*)$/;
  // Embedded Answer pattern: "Answer: B", "Ans: A", "Correct: C"
  const embeddedAnswerRegex = /^(?:Answer|Ans|Correct\s*Answer|Key):\s*\(?([A-Fa-f])\)?/i;
  // Explanation pattern: "Explanation: ...", "Rationale: ..."
  const explanationRegex = /^(?:Explanation|Rationale|Note):\s*(.*)$/i;

  interface RawQuestionBlock {
    number: number;
    textParts: string[];
    choices: { label: string; text: string; isMarkedCorrect: boolean }[];
    answerKey?: string;
    explanationParts: string[];
  }

  const rawBlocks: RawQuestionBlock[] = [];
  let currentBlock: RawQuestionBlock | null = null;
  let currentChoice: { label: string; text: string; isMarkedCorrect: boolean } | null = null;
  let isInExplanation = false;

  for (const line of mainTextLines) {
    const qMatch = line.match(questionRegex);
    if (qMatch) {
      // New question found
      if (currentBlock) {
        rawBlocks.push(currentBlock);
      }
      currentBlock = {
        number: parseInt(qMatch[1], 10),
        textParts: [qMatch[2]],
        choices: [],
        explanationParts: [],
      };
      currentChoice = null;
      isInExplanation = false;
      continue;
    }

    if (!currentBlock) {
      // Header fluff before first question
      continue;
    }

    // Check for explanation
    const expMatch = line.match(explanationRegex);
    if (expMatch) {
      isInExplanation = true;
      currentBlock.explanationParts.push(expMatch[1]);
      currentChoice = null;
      continue;
    }

    if (isInExplanation) {
      currentBlock.explanationParts.push(line);
      continue;
    }

    // Check for embedded answer line
    const ansMatch = line.match(embeddedAnswerRegex);
    if (ansMatch) {
      currentBlock.answerKey = ansMatch[1].toUpperCase();
      currentChoice = null;
      continue;
    }

    // Check for choice line
    const cMatch = line.match(choiceRegex);
    if (cMatch) {
      const isMarked = line.startsWith('*') || /^\(?\[?[xX]\]?\)?/.test(line);
      currentChoice = {
        label: cMatch[1].toUpperCase(),
        text: cMatch[2].trim(),
        isMarkedCorrect: isMarked,
      };
      currentBlock.choices.push(currentChoice);
      continue;
    }

    // Continuation line
    if (currentChoice) {
      currentChoice.text += ' ' + line;
    } else if (currentBlock.choices.length === 0) {
      currentBlock.textParts.push(line);
    }
  }

  if (currentBlock) {
    rawBlocks.push(currentBlock);
  }

  // 4. Construct parsed question results
  const parsedQuestions: ParsedQuestionResult[] = [];

  rawBlocks.forEach((block, idx) => {
    const questionNumber = block.number || (idx + 1);
    const questionText = block.textParts.join(' ').trim();
    
    // Resolve correct answer:
    // Priority: 1) Separate Answer Key block, 2) Embedded Answer line, 3) Marked choice asterisk
    let targetAnswer = answerKeyMap.get(questionNumber) || block.answerKey;

    if (!targetAnswer) {
      const marked = block.choices.find(c => c.isMarkedCorrect);
      if (marked) {
        targetAnswer = marked.label;
      }
    }

    // If still no answer specified, fallback to 'A' and record a warning
    if (!targetAnswer && block.choices.length > 0) {
      targetAnswer = block.choices[0].label;
      errors.push(`Question ${questionNumber}: No correct answer found, defaulted to (${targetAnswer}).`);
    }

    const choices = block.choices.map(c => ({
      label: c.label,
      text: c.text,
      isCorrect: c.label === targetAnswer,
    }));

    if (choices.length < 2) {
      errors.push(`Question ${questionNumber} has fewer than 2 choices.`);
    }

    parsedQuestions.push({
      questionText,
      choices,
      explanation: block.explanationParts.join(' ').trim() || undefined,
      detectedAnswer: targetAnswer,
    });
  });

  return {
    title,
    subjectHint,
    questions: parsedQuestions,
    errors,
    rawText,
  };
}

/**
 * Parses a standalone Answer Key text or document
 * Returns a map of Question Number -> { answer, explanation }
 */
export function parseAnswerKeyText(rawText: string): Map<number, { answer: string; explanation?: string }> {
  const map = new Map<number, { answer: string; explanation?: string }>();
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // Line format: "1. B - Explanation..." or "1) A" or "1: C" or "Q1. D"
  const lineRegex = /^(?:Question\s+|Q)?(\d+)[\.\)\:\-]\s*\(?([A-Fa-f])\)?(?:\s*[\:\-\–]\s*(.*))?$/i;
  // Compact format on a line: "1. A, 2. B, 3. C"
  const pairRegex = /(\d+)\s*[\.\)\:\-]\s*\(?([A-Fa-f])\)?/gi;

  for (const line of lines) {
    if (/^(answer\s*keys?|answers?|key\s*answers?|solutions?):?$/i.test(line)) {
      continue;
    }

    const singleMatch = line.match(lineRegex);
    if (singleMatch) {
      const qNum = parseInt(singleMatch[1], 10);
      const answer = singleMatch[2].toUpperCase();
      const explanation = singleMatch[3] ? singleMatch[3].trim() : undefined;
      map.set(qNum, { answer, explanation });
      continue;
    }

    // Check compact pair matches on the same line
    let match;
    let foundPairs = false;
    while ((match = pairRegex.exec(line)) !== null) {
      const qNum = parseInt(match[1], 10);
      const answer = match[2].toUpperCase();
      map.set(qNum, { answer });
      foundPairs = true;
    }

    // If still no pair, check if line is just comma/space separated letters e.g. "A B C D"
    if (!foundPairs) {
      const tokens = line.split(/[\s,]+/).filter(t => /^[A-Fa-f]$/.test(t));
      if (tokens.length > 0) {
        tokens.forEach((token) => {
          const qNum = map.size + 1;
          map.set(qNum, { answer: token.toUpperCase() });
        });
      }
    }
  }

  return map;
}

/**
 * Extracts plain text from a DOCX file using mammoth
 */
export async function extractDocxText(file: File): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (err: any) {
    console.error('Error extracting text from DOCX:', err);
    throw new Error('Could not parse DOCX file: ' + (err.message || 'Unknown error'));
  }
}

/**
 * Extracts plain text from a PDF file using pdfjs-dist
 */
export async function extractPdfText(file: File): Promise<string> {
  try {
    const pdfjs = await import('pdfjs-dist');
    // Set worker source
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      fullText += pageStrings + '\n\n';
    }

    return fullText;
  } catch (err: any) {
    console.error('Error extracting text from PDF:', err);
    throw new Error('Could not parse PDF file: ' + (err.message || 'Unknown error'));
  }
}
