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
      return;
    }

    if (!rawText.trim()) {
      setErrorMsg('Please upload an answer key file or paste text first.');
      return;
    }

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
      <div className="bg-ground border border-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-surface flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-light text-accent flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-ink leading-tight">
                Upload Answer Key
              </h3>
              <p className="text-xs text-ink-muted">
                Extract answers and rationales with Gemini AI or standard parser
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-ink-muted hover:text-ink hover:bg-ground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Target Quiz Selector */}
          <div>
            <label className="block text-xs font-medium text-ink mb-1.5">
              Target Mock Exam *
            </label>
            {quizzes.length === 0 ? (
              <p className="text-xs text-ink-muted p-3 bg-surface rounded-xl border border-border">
                No mock exams created yet. Please upload an exam first.
              </p>
            ) : (
              <select
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-accent bg-surface"
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
          <div className="flex items-center justify-between border-b border-rule pb-2">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setInputMode('file')}
                className={`px-3 py-1.5 rounded-control text-xs font-medium transition-all ${
                  inputMode === 'file'
                    ? 'bg-ink text-white'
                    : 'bg-surface text-ink-muted border border-border'
                }`}
              >
                File (.docx / .pdf)
              </button>
              <button
                type="button"
                onClick={() => setInputMode('text')}
                className={`px-3 py-1.5 rounded-control text-xs font-medium transition-all ${
                  inputMode === 'text'
                    ? 'bg-ink text-white'
                    : 'bg-surface text-ink-muted border border-border'
                }`}
              >
                Paste Text
              </button>
            </div>

            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs text-accent hover:underline flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Sample Key</span>
            </button>
          </div>

          {inputMode === 'file' ? (
            <div>
              <label className="border-2 border-dashed border-border hover:border-accent/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-surface hover:bg-accent-light/10 text-center">
                <UploadCloud className="w-8 h-8 text-accent mb-2" />
                <p className="text-xs font-semibold text-ink">
                  {selectedFile ? selectedFile.name : 'Choose Answer Key file (.docx or .pdf)'}
                </p>
                <p className="text-[11px] text-ink-muted mt-0.5">
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
                <p className="text-xs text-accent mt-2 animate-pulse">
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
                className="w-full p-3 rounded-xl border border-border text-xs focus:outline-none focus:border-accent font-mono bg-surface"
              />
            </div>
          )}

          {/* AI Mapping & Parse Action Bar */}
          <div className="p-3.5 rounded-xl bg-accent-light/30 border border-accent/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-accent flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-ink">
                  AI Key Correlator ({geminiConfig.model})
                </p>
                <p className="text-[10px] text-ink-muted">
                  Matches answers & explanations directly to questions.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {!geminiConfig.isConfigured && (
                <button
                  type="button"
                  onClick={() => setIsGeminiModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-control border border-border bg-ground text-ink text-[11px] font-medium"
                >
                  <Settings className="w-3 h-3 inline mr-1 text-accent" />
                  Key
                </button>
              )}

              <button
                type="button"
                disabled={isAiMapping || !rawText.trim()}
                onClick={handleAiMap}
                className={`px-3 py-1.5 rounded-control text-xs font-medium transition-all shadow-sm flex items-center space-x-1.5 ${
                  !rawText.trim() || isAiMapping
                    ? 'bg-control text-ink-muted cursor-not-allowed opacity-60'
                    : 'bg-accent hover:bg-accent-hover text-white active:scale-95'
                }`}
              >
                {isAiMapping ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Mapping...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>AI Auto-Map</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleParseText}
                disabled={!rawText.trim()}
                className="px-2.5 py-1.5 rounded-control bg-ground border border-border text-ink text-[11px] font-medium hover:bg-surface"
              >
                Regex Parse
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-negative-bg/50 border border-negative/30 rounded-xl text-negative-ink text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-positive-bg/50 border border-positive/30 rounded-xl text-positive-ink text-xs flex items-center space-x-2">
              <Check className="w-4 h-4 flex-shrink-0 text-positive" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Parsed Keys Preview List */}
          {parsedKeys.size > 0 && currentQuiz && (
            <div className="space-y-2 border-t border-rule pt-3">
              <div className="flex items-center justify-between text-xs font-semibold text-ink">
                <span>Detected Keys Mapping ({parsedKeys.size} items)</span>
                <span className="text-[11px] text-ink-muted">
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
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                        keyData
                          ? 'bg-positive-bg/30 border-positive/40 text-ink'
                          : 'bg-surface border-border text-ink-muted'
                      }`}
                    >
                      <span className="truncate max-w-[280px]">
                        <strong>{qNum}.</strong> {q.questionText}
                      </span>
                      {keyData ? (
                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          <span className="text-[11px] font-bold text-positive bg-white px-2 py-0.5 rounded border border-positive/40">
                            Key: {keyData.answer}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-ink-muted">No key provided</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-control border border-border text-xs font-medium text-ink hover:bg-ground"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={parsedKeys.size === 0 || !selectedQuizId}
            onClick={handleApplyKeys}
            className={`px-5 py-2 rounded-control text-xs font-medium transition-colors shadow-sm flex items-center space-x-1.5 ${
              parsedKeys.size > 0 && selectedQuizId
                ? 'bg-accent hover:bg-accent-hover text-white'
                : 'bg-control text-ink-muted cursor-not-allowed'
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
