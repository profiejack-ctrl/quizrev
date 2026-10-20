import { ParseExamResult, ParsedQuestionResult, Question } from '../types/quiz';

export interface GeminiConfig {
  apiKey: string;
  model: string;
  isConfigured: boolean;
}

export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';

export const getGeminiConfig = (): GeminiConfig => {
  const storedKey = localStorage.getItem('quizrev_gemini_api_key');
  const storedModel = localStorage.getItem('quizrev_gemini_model');

  const apiKey = (storedKey || import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  const model = (storedModel || import.meta.env.VITE_GEMINI_MODEL || DEFAULT_GEMINI_MODEL).trim();

  return {
    apiKey,
    model: model || DEFAULT_GEMINI_MODEL,
    isConfigured: Boolean(apiKey && apiKey.length > 10),
  };
};

export const saveGeminiConfig = (apiKey: string, model: string) => {
  if (apiKey) {
    localStorage.setItem('quizrev_gemini_api_key', apiKey.trim());
  } else {
    localStorage.removeItem('quizrev_gemini_api_key');
  }

  if (model) {
    localStorage.setItem('quizrev_gemini_model', model.trim());
  } else {
    localStorage.removeItem('quizrev_gemini_model');
  }
};

function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }
  return cleaned;
}

/**
 * Pings the Gemini API to verify credentials
 */
export async function testGeminiConnection(
  apiKey?: string,
  model?: string
): Promise<{ success: boolean; message: string }> {
  const key = (apiKey || getGeminiConfig().apiKey).trim();
  const mod = (model || getGeminiConfig().model).trim() || DEFAULT_GEMINI_MODEL;

  if (!key) {
    return { success: false, message: 'Please enter a Gemini API Key.' };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(mod)}:generateContent?key=${encodeURIComponent(key)}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: 'Respond with JSON: {"status": "ok", "agent": "QuizRev"}' }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      const errMsg = errJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, message: errMsg };
    }

    const data = await response.json();
    const outputText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (outputText) {
      return { success: true, message: `Successfully connected to ${mod}!` };
    }
    return { success: false, message: 'Received empty response from Gemini.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection failed.' };
  }
}

/**
 * AI Agent for Analyzing Exam & Mapping Answer Key using gemini-3.5-flash
 */
export async function analyzeExamWithGemini(
  examText: string,
  answerKeyText?: string,
  filenameHint = ''
): Promise<ParseExamResult> {
  const config = getGeminiConfig();
  if (!config.isConfigured) {
    throw new Error('Gemini API Key is not configured. Please add your API key in the AI Agent Settings.');
  }

  const systemPrompt = `You are an expert academic assessment analyzer and parsing agent for QuizRev.
Your task is to analyze the provided examination document text (and optional answer key text), segment all multiple-choice questions, identify all choices, detect the correct answer for each question, and generate a clear rationale/explanation for each question.

CRITICAL PARSING RULES:
1. Extract ALL questions without skipping any item.
2. For each question:
   - questionText: Clean, full question statement. Preserve mathematical formulas, chemical symbols, quotes, and code blocks.
   - choices: Array of at least 2 to 6 options. Each choice must have "label" ('A', 'B', 'C', 'D'...) and "text" (clean text of the choice).
   - isCorrect: Boolean. Mark true ONLY on the choice that corresponds to the correct answer. Determine this from:
     * The provided answer key section/file
     * Embedded markers (e.g. "Answer: B", "*A", "[x] C", "(Correct)")
     * If no key was found in text, deduce the logically and scientifically correct answer and mark it.
   - explanation: Clear educational explanation/rationale describing why the correct answer is right and why distractors are wrong.
   - detectedAnswer: Single letter corresponding to the correct choice ('A', 'B', etc.).
3. Detect the overall Exam Title and the Subject Category (e.g. 'General Science', 'Mathematics', 'Professional Education', 'English & Literature', 'History').
4. Return ONLY a valid JSON object matching the requested schema. No conversational preamble.`;

  const userPrompt = `EXAM DOCUMENT TEXT:
${examText}

${answerKeyText ? `SEPARATE ANSWER KEY TEXT:\n${answerKeyText}` : ''}

${filenameHint ? `FILENAME HINT: ${filenameHint}` : ''}

Parse this into JSON with the following structure:
{
  "title": "string",
  "subjectHint": "string",
  "questions": [
    {
      "questionText": "string",
      "choices": [
        { "label": "A", "text": "string", "isCorrect": boolean }
      ],
      "explanation": "string",
      "detectedAnswer": "A"
    }
  ],
  "errors": ["string"]
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => null);
    throw new Error(errJson?.error?.message || `Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawJson) {
    throw new Error('Gemini returned an empty response.');
  }

  try {
    const cleaned = cleanJsonString(rawJson);
    const parsed = JSON.parse(cleaned);

    const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
    const questions: ParsedQuestionResult[] = rawQuestions.map((q: any, idx: number) => {
      const detectedAns = (q.detectedAnswer || '').toString().toUpperCase().trim();
      
      const rawChoices = Array.isArray(q.choices) ? q.choices : [];
      let choices: { label: string; text: string; isCorrect: boolean }[] = rawChoices.map((c: any, cIdx: number) => {
        const lbl = (c.label || String.fromCharCode(65 + cIdx)).toString().toUpperCase().trim();
        const isCorr = Boolean(c.isCorrect) || (detectedAns.length > 0 && lbl === detectedAns);
        return {
          label: lbl,
          text: String(c.text || '').trim(),
          isCorrect: isCorr,
        };
      });

      // If no choice was marked correct, check if detectedAns matches any label
      if (!choices.some((c: { isCorrect: boolean }) => c.isCorrect) && detectedAns) {
        const found = choices.find((c: { label: string }) => c.label === detectedAns);
        if (found) {
          found.isCorrect = true;
        } else if (choices.length > 0) {
          // Default to first choice if completely unmarked
          choices[0].isCorrect = true;
        }
      } else if (!choices.some((c: { isCorrect: boolean }) => c.isCorrect) && choices.length > 0) {
        choices[0].isCorrect = true;
      }

      const activeCorrect = choices.find((c: { isCorrect: boolean }) => c.isCorrect)?.label || 'A';

      return {
        questionText: String(q.questionText || `Question ${idx + 1}`).trim(),
        choices,
        explanation: q.explanation ? String(q.explanation).trim() : undefined,
        detectedAnswer: activeCorrect,
      };
    });

    return {
      title: parsed.title || filenameHint.replace(/\.[^/.]+$/, '') || 'Mock Exam',
      subjectHint: parsed.subjectHint || '',
      questions,
      errors: Array.isArray(parsed.errors) ? parsed.errors : [],
      rawText: examText,
    };
  } catch (err: any) {
    console.error('Failed to parse Gemini JSON output:', rawJson);
    throw new Error('Failed to parse structured JSON from Gemini: ' + err.message);
  }
}

/**
 * AI Agent to map a standalone answer key to an existing list of questions
 */
export async function mapAnswerKeyWithGemini(
  examQuestions: Question[],
  answerKeyText: string
): Promise<Map<number, { answer: string; explanation?: string }>> {
  const config = getGeminiConfig();
  if (!config.isConfigured) {
    throw new Error('Gemini API Key is not configured. Please add your API key in the AI Agent Settings.');
  }

  const questionsSummary = examQuestions.map((q, idx) => ({
    number: q.orderIndex || idx + 1,
    questionText: q.questionText,
    choices: q.choices.map(c => `${c.label}: ${c.text}`).join(' | '),
  }));

  const systemPrompt = `You are an expert examination answer key mapper for QuizRev.
Given an exam's questions and the raw text from an answer key document, correlate and map each question number to its correct answer choice label ('A', 'B', 'C', 'D'...) and extract/synthesize any explanation provided.

Return ONLY a JSON object formatted as:
{
  "mappings": [
    {
      "questionNumber": 1,
      "answer": "B",
      "explanation": "Rationale text..."
    }
  ]
}`;

  const userPrompt = `EXAM QUESTIONS:
${JSON.stringify(questionsSummary, null, 2)}

RAW ANSWER KEY TEXT:
${answerKeyText}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => null);
    throw new Error(errJson?.error?.message || `Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  const map = new Map<number, { answer: string; explanation?: string }>();

  try {
    const cleaned = cleanJsonString(rawJson);
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed.mappings)) {
      parsed.mappings.forEach((m: any) => {
        const qNum = parseInt(m.questionNumber, 10);
        if (qNum && m.answer) {
          map.set(qNum, {
            answer: String(m.answer).trim().toUpperCase(),
            explanation: m.explanation ? String(m.explanation).trim() : undefined,
          });
        }
      });
    }
    return map;
  } catch (err: any) {
    throw new Error('Failed to parse Gemini answer key mappings: ' + err.message);
  }
}
