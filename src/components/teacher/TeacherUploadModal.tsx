import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  extractDocxText, 
  extractPdfText, 
  parseExamText,
  parseAnswerKeyText 
} from '../../lib/parser';
import { 
  getGeminiConfig, 
  analyzeExamWithGemini 
} from '../../lib/geminiAgent';
import { GeminiConfigModal } from './GeminiConfigModal';
import { generateUuid } from '../../lib/uuid';
import { SAMPLE_EXAM_TEXT } from '../../lib/mockData';
import { ParsedQuestionResult, Question } from '../../types/quiz';
import { 
  UploadCloud, 
  FileText, 
  FileCheck, 
  AlertCircle, 
  Check, 
  Shuffle, 
  Clock, 
  Award, 
  X, 
  Sparkles, 
  BookOpen, 
  Plus,
  Key,
  Trash2,
  Loader2,
  CheckCircle2,
  Settings
} from 'lucide-react';

export const TeacherUploadModal: React.FC = () => {
  const { 
    subjects, 
    addQuiz, 
    addSubject, 
    setCurrentView,
    setIsSupabaseModalOpen,
    supabaseConfig 
  } = useApp();

  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [isKeyParsing, setIsKeyParsing] = useState(false);
  const [appliedKeyCount, setAppliedKeyCount] = useState<number | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [rawKeyText, setRawKeyText] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [geminiConfig, setGeminiConfig] = useState(getGeminiConfig());
  const [parseError, setParseError] = useState<string | null>(null);
  const [isSavingExam, setIsSavingExam] = useState(false);
  const [cloudSaveError, setCloudSaveError] = useState<string | null>(null);

  // Form Fields
  const [quizTitle, setQuizTitle] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [passingPercentage, setPassingPercentage] = useState(70);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleChoices, setShuffleChoices] = useState(true);

  // Parsed Questions Preview
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestionResult[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [hasParsed, setHasParsed] = useState(false);

  // Handle File Upload (.docx or .pdf)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsParsing(true);
    setParseError(null);
    setAiSuccessMessage(null);

    try {
      let text = '';
      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith('.docx')) {
        text = await extractDocxText(file);
      } else if (lowerName.endsWith('.pdf')) {
        text = await extractPdfText(file);
      } else {
        text = await file.text();
      }

      setRawText(text);

      const currentConfig = getGeminiConfig();
      // If Gemini AI is configured, run deep AI analysis for highest fidelity!
      if (currentConfig.isConfigured) {
        setIsAiAnalyzing(true);
        try {
          const result = await analyzeExamWithGemini(text, rawKeyText || undefined, file.name);
          setQuizTitle(result.title);
          setParsedQuestions(result.questions);
          setParseWarnings(result.errors);
          setHasParsed(true);
          setAiSuccessMessage(`Gemini ${currentConfig.model} analyzed ${result.questions.length} questions and mapped answer keys!`);

          if (result.subjectHint) {
            const matched = subjects.find(
              (s) =>
                s.name.toLowerCase().includes(result.subjectHint!.toLowerCase()) ||
                result.subjectHint!.toLowerCase().includes(s.name.toLowerCase())
            );
            if (matched) setSelectedSubjectId(matched.id);
          }
          return;
        } catch (aiErr: any) {
          console.warn('AI parsing fallback to regex:', aiErr);
          processExtractedText(text, file.name);
          setParseError(`AI analysis note: ${aiErr.message}. Fallback to local parsing.`);
          return;
        } finally {
          setIsAiAnalyzing(false);
        }
      }

      // Offline / Local Regex Parsing
      processExtractedText(text, file.name);
    } catch (err: any) {
      console.error(err);
      setParseError(err.message || 'Failed to read file.');
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Separate Answer Key File (.docx or .pdf)
  const handleAnswerKeyFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setKeyFile(file);
    setIsKeyParsing(true);
    setParseError(null);
    setAiSuccessMessage(null);

    try {
      let text = '';
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.docx')) text = await extractDocxText(file);
      else if (lower.endsWith('.pdf')) text = await extractPdfText(file);
      else text = await file.text();

      setRawKeyText(text);

      const currentConfig = getGeminiConfig();
      // If Gemini configured and we have exam questions or raw exam text, re-analyze with AI!
      if (currentConfig.isConfigured && rawText.trim()) {
        setIsAiAnalyzing(true);
        try {
          const result = await analyzeExamWithGemini(rawText, text, selectedFile?.name);
          setQuizTitle(result.title || quizTitle);
          setParsedQuestions(result.questions);
          setHasParsed(true);
          setAppliedKeyCount(result.questions.filter((q) => q.detectedAnswer).length);
          setAiSuccessMessage(`Gemini ${currentConfig.model} successfully mapped answer keys to ${result.questions.length} questions!`);
          return;
        } catch (aiErr: any) {
          console.warn('AI key mapping error, falling back to local regex:', aiErr);
        } finally {
          setIsAiAnalyzing(false);
        }
      }

      // Local Regex Fallback
      const keys = parseAnswerKeyText(text);
      if (keys.size === 0) {
        setParseError('No numbered answer keys found in the answer key file.');
        return;
      }

      // Merge into parsed questions
      if (parsedQuestions.length > 0) {
        let count = 0;
        const merged = parsedQuestions.map((q, idx) => {
          const keyEntry = keys.get(idx + 1);
          if (keyEntry) {
            count++;
            return {
              ...q,
              detectedAnswer: keyEntry.answer,
              explanation: keyEntry.explanation || q.explanation,
              choices: q.choices.map(c => ({
                ...c,
                isCorrect: c.label.toUpperCase() === keyEntry.answer.toUpperCase(),
              })),
            };
          }
          return q;
        });
        setParsedQuestions(merged);
        setAppliedKeyCount(count);
      } else {
        setParseError('Please upload the exam questions first before applying the answer key.');
      }
    } catch (err: any) {
      setParseError(err.message || 'Failed to read answer key file.');
    } finally {
      setIsKeyParsing(false);
    }
  };

  const handleAnalyzeWithGemini = async () => {
    const config = getGeminiConfig();
    if (!config.isConfigured) {
      setIsGeminiModalOpen(true);
      return;
    }

    if (!rawText.trim()) {
      setParseError('Please upload an exam file or paste exam text first.');
      return;
    }

    setIsAiAnalyzing(true);
    setParseError(null);
    setAiSuccessMessage(null);

    try {
      const result = await analyzeExamWithGemini(
        rawText,
        rawKeyText.trim() ? rawKeyText : undefined,
        selectedFile?.name
      );

      if (result.questions.length === 0) {
        throw new Error('Gemini could not identify any multiple-choice questions in this document. Please check the content format.');
      }

      setQuizTitle(result.title || quizTitle || 'Mock Examination');
      setParsedQuestions(result.questions);
      setParseWarnings(result.errors);
      setHasParsed(true);
      setAiSuccessMessage(`Gemini ${config.model} successfully parsed ${result.questions.length} questions and mapped answer keys!`);

      if (result.subjectHint) {
        const matched = subjects.find(
          (s) =>
            s.name.toLowerCase().includes(result.subjectHint!.toLowerCase()) ||
            result.subjectHint!.toLowerCase().includes(s.name.toLowerCase())
        );
        if (matched) {
          setSelectedSubjectId(matched.id);
        }
      }
    } catch (err: any) {
      console.error('Gemini parsing error:', err);
      setParseError(err.message || 'AI analysis failed.');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleToggleChoiceCorrect = (qIdx: number, cIdx: number) => {
    setParsedQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIdx) return q;
        const updatedChoices = q.choices.map((c, i) => ({
          ...c,
          isCorrect: i === cIdx,
        }));
        const newCorrect = updatedChoices.find((c) => c.isCorrect);
        return {
          ...q,
          choices: updatedChoices,
          detectedAnswer: newCorrect?.label,
        };
      })
    );
  };

  const handleDeleteQuestion = (qIdx: number) => {
    setParsedQuestions((prev) => prev.filter((_, idx) => idx !== qIdx));
  };

  const processExtractedText = (text: string, filenameHint = '') => {
    const result = parseExamText(text, filenameHint);
    setQuizTitle(result.title);
    setParsedQuestions(result.questions);
    setParseWarnings(result.errors);
    setHasParsed(true);

    // Try to auto-match subject
    if (result.subjectHint) {
      const matched = subjects.find(
        (s) =>
          s.name.toLowerCase().includes(result.subjectHint!.toLowerCase()) ||
          result.subjectHint!.toLowerCase().includes(s.name.toLowerCase())
      );
      if (matched) {
        setSelectedSubjectId(matched.id);
      }
    }
  };

  const handleParseRawText = () => {
    if (!rawText.trim()) return;
    processExtractedText(rawText, 'Custom Mock Exam');
  };

  const handleLoadSample = () => {
    setRawText(SAMPLE_EXAM_TEXT);
    processExtractedText(SAMPLE_EXAM_TEXT, 'Environmental Science Mock Exam');
    setInputMode('text');
  };

  const handleCreateSubject = () => {
    if (!newSubjectName.trim() || !newSubjectCode.trim()) return;
    const newSub = addSubject(
      newSubjectName.trim(),
      newSubjectCode.trim(),
      `${newSubjectName.trim()} Mock Exam Series`
    );
    setSelectedSubjectId(newSub.id);
    setIsCreatingSubject(false);
    setNewSubjectName('');
    setNewSubjectCode('');
  };

  const handlePublishQuiz = async () => {
    if (parsedQuestions.length === 0) {
      setParseError('Please parse at least one question before publishing.');
      return;
    }

    let targetSubjectId = selectedSubjectId;
    if (!targetSubjectId && subjects.length > 0) {
      targetSubjectId = subjects[0].id;
    }

    const currentSubject = subjects.find((s) => s.id === targetSubjectId);

    // Convert parsed questions into full Question objects with standard UUIDs
    const finalQuestions: Question[] = parsedQuestions.map((pq, qIdx) => {
      const questionId = generateUuid();
      return {
        id: questionId,
        orderIndex: qIdx + 1,
        questionText: pq.questionText,
        points: 1,
        explanation: pq.explanation,
        choices: pq.choices.map((c, cIdx) => ({
          id: generateUuid(),
          label: c.label || String.fromCharCode(65 + cIdx),
          text: c.text,
          isCorrect: c.isCorrect,
        })),
      };
    });

    setIsSavingExam(true);
    setCloudSaveError(null);

    try {
      const res = await addQuiz({
        title: quizTitle || 'Mock Exam',
        subjectId: targetSubjectId,
        subjectName: currentSubject?.name || 'General',
        subjectColor: currentSubject?.color || '#1b6e66',
        description: `Uploaded mock exam containing ${finalQuestions.length} questions.`,
        durationMinutes,
        passingPercentage,
        shuffleQuestions,
        shuffleChoices,
        questions: finalQuestions,
        totalQuestions: finalQuestions.length,
        sourceFilename: selectedFile?.name || 'exam_upload.txt',
        sourceFormat: selectedFile?.name?.endsWith('.docx')
          ? 'docx'
          : selectedFile?.name?.endsWith('.pdf')
          ? 'pdf'
          : 'manual',
        isPublished: true,
      });

      setIsSavingExam(false);

      if (!res.success) {
        setCloudSaveError(
          res.error || 'Failed to sync exam to Supabase. It is saved in your local browser, but students on other devices will not see it.'
        );
        return;
      }

      setCurrentView('home');
    } catch (err: any) {
      setIsSavingExam(false);
      setCloudSaveError(err.message || 'An error occurred while publishing the exam.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-8 pb-24 md:pb-12">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl font-bold text-ink">
          Upload Exam & Answer Key
        </h2>
        <p className="text-xs text-ink-muted mt-1">
          Upload DOCX or PDF files with automatic question parsing, choice shuffling, and answer key extraction.
        </p>
      </div>

      {/* Main Upload Box */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-6">
        
        {/* Input Mode Selector */}
        <div className="flex items-center justify-between border-b border-rule pb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setInputMode('file')}
              className={`px-3 py-1.5 rounded-control text-xs font-medium transition-all ${
                inputMode === 'file'
                  ? 'bg-ink text-white'
                  : 'bg-ground text-ink-muted border border-border'
              }`}
            >
              Upload DOCX / PDF File
            </button>
            <button
              onClick={() => setInputMode('text')}
              className={`px-3 py-1.5 rounded-control text-xs font-medium transition-all ${
                inputMode === 'text'
                  ? 'bg-ink text-white'
                  : 'bg-ground text-ink-muted border border-border'
              }`}
            >
              Paste Text / Markdown
            </button>
          </div>

          <button
            onClick={handleLoadSample}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-control bg-accent-light text-accent text-xs font-medium hover:bg-accent/15 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Exam</span>
          </button>
        </div>

        {inputMode === 'file' ? (
          <div>
            <label className="border-2 border-dashed border-border hover:border-accent/60 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-ground hover:bg-accent-light/10 text-center">
              <UploadCloud className="w-10 h-10 text-accent mb-2" />
              <p className="text-sm font-semibold text-ink">
                {selectedFile ? selectedFile.name : 'Click or drag DOCX / PDF here'}
              </p>
              <p className="text-xs text-ink-muted mt-1">
                Supports Microsoft Word (.docx), Adobe PDF (.pdf), and text files
              </p>
              <input
                type="file"
                accept=".docx,.pdf,.txt,.doc"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {isParsing && (
              <p className="text-xs text-accent mt-2 flex items-center space-x-1.5 animate-pulse">
                <span>Reading document and extracting questions...</span>
              </p>
            )}

            {/* Separate Answer Key Uploader Dropzone */}
            <div className="mt-4 pt-4 border-t border-rule">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5 text-accent" />
                  <span>Separate Answer Key File (Optional)</span>
                </span>
                {appliedKeyCount !== null && (
                  <span className="text-[11px] text-positive font-semibold flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Keys mapped to {appliedKeyCount} questions</span>
                  </span>
                )}
              </div>

              <label className="border border-dashed border-border hover:border-accent/60 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-colors bg-surface hover:bg-accent-light/10">
                <div className="flex items-center space-x-3">
                  <Key className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-xs font-medium text-ink">
                      {keyFile ? keyFile.name : 'Upload separate Answer Key (.docx or .pdf)'}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      Maps keys like: 1. A, 2. B, 3. C directly to the questions above
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-ground border border-border rounded-lg text-xs font-medium text-ink">
                  {keyFile ? 'Change File' : 'Browse'}
                </span>
                <input
                  type="file"
                  accept=".docx,.pdf,.txt"
                  onChange={handleAnswerKeyFile}
                  className="hidden"
                />
              </label>

              {isKeyParsing && (
                <p className="text-xs text-accent mt-1.5 animate-pulse">
                  Parsing answer keys...
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span>Exam Questions Text (DOCX/PDF extracted or Markdown) *</span>
              </label>
              <textarea
                rows={8}
                placeholder="Paste your exam text with questions, choices (A, B, C, D) here..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full p-4 rounded-xl border border-border text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-ground font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5 flex items-center space-x-1">
                <Key className="w-3.5 h-3.5 text-accent" />
                <span>Separate Answer Key Text (Optional)</span>
              </label>
              <textarea
                rows={4}
                placeholder="Paste separate answer key here (e.g. 1. A, 2. B, 3. C with explanations)..."
                value={rawKeyText}
                onChange={(e) => setRawKeyText(e.target.value)}
                className="w-full p-3 rounded-xl border border-border text-xs focus:outline-none focus:border-accent font-mono bg-ground"
              />
            </div>
          </div>
        )}

        {/* AI Agent Action Bar */}
        <div className="p-4 rounded-xl bg-accent-light/30 border border-accent/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold text-ink">
                Gemini AI Agent Analysis ({geminiConfig.model})
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  geminiConfig.isConfigured ? 'bg-positive' : 'bg-warning'
                }`}
                title={geminiConfig.isConfigured ? 'Gemini API configured' : 'API key needed'}
              />
            </div>
            <p className="text-[11px] text-ink-muted">
              Deep semantic parsing: identifies questions, separates choices (A-D), maps answer keys, and synthesizes rationales.
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            {!geminiConfig.isConfigured && (
              <button
                type="button"
                onClick={() => setIsGeminiModalOpen(true)}
                className="px-3.5 py-2 rounded-control border border-border bg-ground hover:bg-surface text-ink text-xs font-medium transition-colors flex items-center space-x-1.5"
              >
                <Settings className="w-3.5 h-3.5 text-accent" />
                <span>Configure Key</span>
              </button>
            )}

            <button
              type="button"
              disabled={isAiAnalyzing || !rawText.trim()}
              onClick={handleAnalyzeWithGemini}
              className={`px-4 py-2 rounded-control text-xs font-medium transition-all shadow-sm flex items-center space-x-1.5 ${
                !rawText.trim() || isAiAnalyzing
                  ? 'bg-control text-ink-muted cursor-not-allowed opacity-60'
                  : 'bg-accent hover:bg-accent-hover text-white active:scale-95'
              }`}
            >
              {isAiAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze & Map with AI</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleParseRawText}
              disabled={!rawText.trim() || isAiAnalyzing}
              className="px-3 py-2 rounded-control bg-ground border border-border text-ink-muted hover:text-ink text-xs font-medium transition-colors"
              title="Fast offline regex parser"
            >
              Quick Local Parse
            </button>
          </div>
        </div>

        {aiSuccessMessage && (
          <div className="p-3.5 bg-positive-bg/40 border border-positive/30 rounded-xl text-positive-ink text-xs flex items-center space-x-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-positive" />
            <span className="font-medium">{aiSuccessMessage}</span>
          </div>
        )}

        {parseError && (
          <div className="p-3.5 bg-negative-bg/50 border border-negative/30 rounded-xl text-negative-ink text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{parseError}</span>
          </div>
        )}
      </div>

      {/* Exam Configuration Form */}
      {hasParsed && (
        <div className="bg-ground border border-border rounded-2xl p-6 space-y-6">
          <h3 className="font-serif text-lg font-semibold text-ink border-b border-rule pb-3">
            Exam Details & Subject
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">
                Exam Title
              </label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="e.g. Midterm Mock Examination"
                className="w-full px-3.5 py-2 rounded-xl border border-border text-xs focus:outline-none focus:border-accent bg-surface"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1 flex items-center justify-between">
                <span>Subject Category</span>
                <button
                  type="button"
                  onClick={() => setIsCreatingSubject(!isCreatingSubject)}
                  className="text-accent text-[11px] hover:underline flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isCreatingSubject ? 'Cancel' : 'Add Subject'}</span>
                </button>
              </label>

              {isCreatingSubject ? (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Subject Name (e.g. Biology)"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-border text-xs bg-surface"
                  />
                  <input
                    type="text"
                    placeholder="Code (BIO)"
                    value={newSubjectCode}
                    onChange={(e) => setNewSubjectCode(e.target.value)}
                    className="w-20 px-3 py-1.5 rounded-lg border border-border text-xs bg-surface"
                  />
                  <button
                    type="button"
                    onClick={handleCreateSubject}
                    className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border text-xs focus:outline-none focus:border-accent bg-surface"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-ink-muted" />
                <span>Time Limit (Minutes)</span>
              </label>
              <input
                type="number"
                min="5"
                max="240"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 20)}
                className="w-full px-3.5 py-2 rounded-xl border border-border text-xs focus:outline-none focus:border-accent bg-surface tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1 flex items-center space-x-1">
                <Award className="w-3.5 h-3.5 text-ink-muted" />
                <span>Passing Percentage (%)</span>
              </label>
              <input
                type="number"
                min="40"
                max="100"
                value={passingPercentage}
                onChange={(e) => setPassingPercentage(parseInt(e.target.value, 10) || 70)}
                className="w-full px-3.5 py-2 rounded-xl border border-border text-xs focus:outline-none focus:border-accent bg-surface tabular-nums"
              />
            </div>
          </div>

          {/* Shuffling Options Required by User */}
          <div className="bg-surface rounded-xl p-4 border border-border space-y-3">
            <p className="text-xs font-semibold text-ink flex items-center space-x-1.5">
              <Shuffle className="w-3.5 h-3.5 text-accent" />
              <span>Exam Shuffling Rules</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="rounded text-accent focus:ring-accent w-4 h-4"
                />
                <span className="text-ink">Shuffle questions order for each student</span>
              </label>

              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleChoices}
                  onChange={(e) => setShuffleChoices(e.target.checked)}
                  className="rounded text-accent focus:ring-accent w-4 h-4"
                />
                <span className="text-ink">Shuffle choices (A, B, C, D) inside questions</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Live Parsed Questions Preview */}
      {hasParsed && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-semibold text-ink">
                Parsed Questions Preview ({parsedQuestions.length} Items)
              </h3>
              <p className="text-xs text-ink-muted">
                Review questions, choice mappings, and verified answer keys. Click any option to toggle it as the correct key.
              </p>
            </div>

            <button
              onClick={handlePublishQuiz}
              disabled={isSavingExam}
              className="px-5 py-2.5 rounded-control bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-all shadow-sm flex items-center justify-center space-x-1.5 active:scale-95 disabled:opacity-60"
            >
              {isSavingExam ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Publishing to Supabase...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Publish Mock Exam</span>
                </>
              )}
            </button>
          </div>

          {cloudSaveError && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 space-y-2">
              <div className="flex items-center space-x-2 font-semibold text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Supabase Cloud Sync Notice</span>
              </div>
              <p>
                The exam is saved on this computer, but failed to sync to your Supabase Cloud database: <strong>{cloudSaveError}</strong>.
                Students on other devices will not see this exam until Supabase tables and credentials are valid.
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsSupabaseModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors flex items-center space-x-1"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Open Database Configuration</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('home')}
                  className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100/50 transition-colors"
                >
                  View in Dashboard
                </button>
              </div>
            </div>
          )}

          {parseWarnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
              <p className="font-semibold">Parser Notifications:</p>
              {parseWarnings.map((w, i) => (
                <p key={i} className="text-[11px]">• {w}</p>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {parsedQuestions.map((pq, qIdx) => (
              <div
                key={qIdx}
                className="bg-ground border border-border rounded-xl p-4 space-y-3 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="w-6 h-6 rounded bg-surface border border-border text-ink-muted flex items-center justify-center text-xs font-semibold tabular-nums flex-shrink-0">
                    {qIdx + 1}
                  </span>
                  <p className="flex-1 text-xs font-medium text-ink">
                    {pq.questionText}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(qIdx)}
                    className="p-1 rounded text-ink-muted hover:text-negative hover:bg-negative-bg/50 transition-colors opacity-60 group-hover:opacity-100"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                  {pq.choices.map((c, cIdx) => (
                    <button
                      type="button"
                      key={cIdx}
                      onClick={() => handleToggleChoiceCorrect(qIdx, cIdx)}
                      className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between text-left transition-colors ${
                        c.isCorrect
                          ? 'bg-positive-bg/40 border-positive/50 text-positive-ink font-semibold shadow-xs'
                          : 'bg-surface border-border text-ink-muted hover:border-accent/40 hover:bg-[#f0f0ee]'
                      }`}
                      title={c.isCorrect ? 'Correct answer key' : 'Click to set as correct answer'}
                    >
                      <span className="truncate pr-2">
                        {c.label}. {c.text}
                      </span>
                      {c.isCorrect ? (
                        <span className="text-[10px] text-positive uppercase font-bold px-1.5 py-0.5 rounded bg-white/80 border border-positive/30 flex-shrink-0">
                          Correct
                        </span>
                      ) : (
                        <span className="text-[10px] text-ink-muted opacity-0 group-hover:opacity-60 flex-shrink-0">
                          Set
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {pq.explanation && (
                  <p className="pl-8 text-[11px] text-ink-muted italic">
                    Rationale: {pq.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gemini Configuration Modal */}
      <GeminiConfigModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        onConfigUpdated={() => setGeminiConfig(getGeminiConfig())}
      />
    </div>
  );
};
