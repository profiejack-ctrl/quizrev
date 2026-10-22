import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Quiz } from '../../types/quiz';
import { 
  extractDocxText, 
  extractPdfText, 
  parseAnswerKeyText 
} from '../../lib/parser';
import { 
  getGeminiConfig, 
  mapAnswerKeyWithGemini 
} from '../../lib/geminiAgent';
import { GeminiConfigModal } from './GeminiConfigModal';
import { SAMPLE_ANSWER_KEY_TEXT } from '../../lib/mockData';
import { 
  Key, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles, 
  Check, 
  FileText,
  Loader2,
  Settings
} from 'lucide-react';

interface AnswerKeyUploaderModalProps {
  initialQuizId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AnswerKeyUploaderModal: React.FC<AnswerKeyUploaderModalProps> = ({
  initialQuizId,
  isOpen,
  onClose,
}) => {
  const { quizzes, updateQuizAnswerKeys } = useApp();

  const [selectedQuizId, setSelectedQuizId] = useState<string>(
    initialQuizId || (quizzes[0]?.id || '')
  );
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isAiMapping, setIsAiMapping] = useState(false);
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [geminiConfig, setGeminiConfig] = useState(getGeminiConfig());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Parsed Key Map: QuestionNumber -> { answer, explanation }
  const [parsedKeys, setParsedKeys] = useState<Map<number, { answer: string; explanation?: string }>>(new Map());

  if (!isOpen) return null;

  const currentQuiz = quizzes.find(q => q.id === selectedQuizId);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsParsing(true);
    setErrorMsg(null);

    try {
      let text = '';
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.docx')) {
        text = await extractDocxText(file);
      } else if (lower.endsWith('.pdf')) {
        text = await extractPdfText(file);
      } else {
        text = await file.text();
      }

      setRawText(text);

      const cfg = getGeminiConfig();
      // If Gemini configured and quiz is selected, run AI auto-mapping automatically!
      if (cfg.isConfigured && currentQuiz && currentQuiz.questions.length > 0) {
        setIsAiMapping(true);
        try {
          const aiMap = await mapAnswerKeyWithGemini(currentQuiz.questions, text);
          setParsedKeys(aiMap);
          setSuccessMsg(`Gemini ${cfg.model} correlated keys for ${aiMap.size} questions!`);
          return;
        } catch (aiErr: any) {
          console.warn('AI mapping fallback to regex:', aiErr);
        } finally {
          setIsAiMapping(false);
        }
      }

      const keys = parseAnswerKeyText(text);
      if (keys.size === 0) {
        setErrorMsg('Could not detect any numbered answer keys (e.g. 1. A, 2. B). Try using AI mapping.');
      } else {
        setParsedKeys(keys);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to read answer key file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleParseText = () => {
    if (!rawText.trim()) return;
    const keys = parseAnswerKeyText(rawText);
    if (keys.size === 0) {
      setErrorMsg('Could not detect any numbered answer keys (e.g. 1. A, 2. B).');
    } else {
      setErrorMsg(null);
      setParsedKeys(keys);
    }
  };

  const handleAiMap = async () => {
    const cfg = getGeminiConfig();
    if (!cfg.isConfigured) {
      setIsGeminiModalOpen(true);
      return;
    }

    if (!currentQuiz || currentQuiz.questions.length === 0) {
      setErrorMsg('Selected exam has no questions to map.');
    } else if (!rawText.trim()) {
      setErrorMsg('Please upload an answer key file or paste text first.');
      return;
    }

    if (!currentQuiz || currentQuiz.questions.length === 0 || !rawText.trim()) return;

    setIsAiMapping(true);
    setErrorMsg(null);
    try {
      const aiMap = await mapAnswerKeyWithGemini(currentQuiz.questions, rawText);
      if (aiMap.size === 0) {
        throw new Error('Gemini could not detect matching answer keys in this text.');
      }
      setParsedKeys(aiMap);
      setSuccessMsg(`Gemini ${cfg.model} matched ${aiMap.size} of ${currentQuiz.questions.length} questions!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'AI answer key mapping failed.');
    } finally {
      setIsAiMapping(false);
    }
  };

  const handleLoadSample = () => {
    setInputMode('text');
    setRawText(SAMPLE_ANSWER_KEY_TEXT);
    const keys = parseAnswerKeyText(SAMPLE_ANSWER_KEY_TEXT);
    setParsedKeys(keys);
    setErrorMsg(null);
  };

  const handleApplyKeys = () => {
    if (!selectedQuizId) {
      setErrorMsg('Please select an exam to apply this answer key.');
      return;
    }

    if (parsedKeys.size === 0) {
      setErrorMsg('No parsed answer keys to apply.');
      return;
    }

    const res = updateQuizAnswerKeys(selectedQuizId, parsedKeys);
    setSuccessMsg(`Successfully updated answer keys for ${res.updatedCount} questions!`);

    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="clay-surface rounded-3xl w-full max-w-lg shadow-clay-lg flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/60 bg-white/40 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-accent flex items-center justify-center shadow-clay-sm">
              <Key className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="font-sans text-base font-bold text-ink leading-tight">
                Upload Answer Key
              </h3>
              <p className="text-xs text-ink-muted">
                Extract answers and rationales with Gemini AI or standard parser
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="clay-btn-neutral p-1.5 rounded-xl text-ink-muted hover:text-ink"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Target Quiz Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Target Mock Exam *
            </label>
            {quizzes.length === 0 ? (
              <p className="text-xs text-slate-500 p-3 clay-inset rounded-xl">
                No mock exams created yet. Please upload an exam first.
              </p>
            ) : (
              <select
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                className="clay-inset w-full px-3.5 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent font-medium bg-[#eaf0f7]"
              >
                {quizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title} ({quiz.questions.length} questions • {quiz.subjectName})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Input Mode Selector */}
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setInputMode('file')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  inputMode === 'file'
                    ? 'clay-inset-sm text-accent bg-teal-50 border border-teal-200/50 shadow-clay-inset'
                    : 'clay-surface-sm text-slate-600 hover:text-slate-900'
                }`}
              >
                File (.docx / .pdf)
              </button>
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  inputMode === 'text'
                    ? 'clay-inset-sm text-accent bg-teal-50 border border-teal-200/50 shadow-clay-inset'
                    : 'clay-surface-sm text-slate-600 hover:text-slate-900'
                }`}
              >
                Paste Text
              </button>
            </div>

            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs font-bold text-accent hover:underline flex items-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sample Key</span>
            </button>
          </div>

          {inputMode === 'file' ? (
            <div>
              <label className="clay-inset rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-teal-50/20 text-center border-dashed border-2 border-slate-300">
                <UploadCloud className="w-8 h-8 text-accent mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Choose Answer Key file (.docx or .pdf)'}
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Reads numbered keys like: 1. A, 2. B, 3. C...
                </p>
                <input
                  type="file"
                  accept=".docx,.pdf,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {isParsing && (
                <p className="text-xs font-bold text-accent mt-2 animate-pulse text-center">
                  Extracting text from answer key file...
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                rows={5}
                placeholder="1. A - Explanation&#10;2. B&#10;3. C&#10;4. D"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="clay-inset w-full p-3.5 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent font-mono"
              />
            </div>
          )}

          {/* AI Mapping & Parse Action Bar */}
          <div className="clay-surface-sm p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-clay-sm">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-4 h-4 text-accent flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  AI Key Correlator ({geminiConfig.model})
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Matches answers & explanations directly to questions.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {!geminiConfig.isConfigured && (
                <button
                  type="button"
                  onClick={() => setIsGeminiModalOpen(true)}
                  className="clay-btn-neutral px-2.5 py-1.5 rounded-xl text-slate-700 text-[11px] font-bold"
                >
                  <Settings className="w-3 h-3 inline mr-1 text-accent" />
                  Key
                </button>
              )}

              <button
                type="button"
                disabled={isAiMapping || !rawText.trim()}
                onClick={handleAiMap}
                className={`clay-btn-teal px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 ${
                  !rawText.trim() || isAiMapping
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {isAiMapping ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mapping...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Auto-Map</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleParseText}
                disabled={!rawText.trim()}
                className="clay-btn-neutral px-2.5 py-1.5 rounded-xl text-slate-700 text-[11px] font-bold"
              >
                Regex Parse
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs flex items-center space-x-2 font-medium shadow-clay-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs flex items-center space-x-2 font-medium shadow-clay-sm">
              <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Parsed Keys Preview List */}
          {parsedKeys.size > 0 && currentQuiz && (
            <div className="space-y-2.5 border-t border-slate-200/60 pt-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Detected Keys Mapping ({parsedKeys.size} items)</span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Exam has {currentQuiz.questions.length} questions
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {currentQuiz.questions.map((q, idx) => {
                  const qNum = q.orderIndex || idx + 1;
                  const keyData = parsedKeys.get(qNum);

                  return (
                    <div
                      key={q.id}
                      className={`clay-surface-sm p-2.5 rounded-xl text-xs flex items-center justify-between ${
                        keyData
                          ? 'border-emerald-300/60 bg-emerald-50/30'
                          : 'text-slate-500'
                      }`}
                    >
                      <span className="truncate max-w-[280px] font-medium text-slate-800">
                        <strong className="text-accent">{qNum}.</strong> {q.questionText}
                      </span>
                      {keyData ? (
                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          <span className="clay-surface-pill px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 shadow-xs">
                            Key: {keyData.answer}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">No key provided</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200/60 bg-white/40 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="clay-btn-neutral px-4 py-2 rounded-xl text-xs font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={parsedKeys.size === 0 || !selectedQuizId}
            onClick={handleApplyKeys}
            className={`clay-btn-teal px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 ${
              parsedKeys.size > 0 && selectedQuizId
                ? ''
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Apply Answer Keys to Exam</span>
          </button>
        </div>

      </div>

      <GeminiConfigModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        onConfigUpdated={() => setGeminiConfig(getGeminiConfig())}
      />
    </div>
  );
};
