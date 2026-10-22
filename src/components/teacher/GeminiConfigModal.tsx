import React, { useState, useEffect } from 'react';
import { 
  getGeminiConfig, 
  saveGeminiConfig, 
  testGeminiConnection, 
  DEFAULT_GEMINI_MODEL 
} from '../../lib/geminiAgent';
import { 
  Sparkles, 
  Key, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ExternalLink, 
  Check, 
  Loader2 
} from 'lucide-react';

interface GeminiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated?: () => void;
}

export const GeminiConfigModal: React.FC<GeminiConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const currentConfig = getGeminiConfig();

  const [apiKey, setApiKey] = useState(currentConfig.apiKey);
  const [model, setModel] = useState(currentConfig.model || DEFAULT_GEMINI_MODEL);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getGeminiConfig();
      setApiKey(cfg.apiKey);
      setModel(cfg.model || DEFAULT_GEMINI_MODEL);
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testGeminiConnection(apiKey, model);
    setIsTesting(false);
    setTestResult(result);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveGeminiConfig(apiKey, model);
    setSaveSuccess(true);
    if (onConfigUpdated) onConfigUpdated();
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="clay-surface rounded-3xl w-full max-w-lg shadow-clay-lg flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/60 bg-white/40 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-accent flex items-center justify-center shadow-clay-sm">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="font-sans text-base font-bold text-ink leading-tight">
                Gemini AI Agent Configuration
              </h3>
              <p className="text-xs text-ink-muted">
                Intelligent Exam Parsing & Answer Key Mapping
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
        <form onSubmit={handleSave} className="p-6 space-y-4">
          
          {/* Info Banner */}
          <div className="clay-surface-sm p-4 rounded-2xl text-xs space-y-1.5">
            <p className="font-bold text-accent flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Assessment Specialist</span>
            </p>
            <p className="text-slate-600 leading-relaxed font-medium">
              Gemini analyzes uploaded DOCX and PDF exams, identifies questions and choices, and maps answer keys and explanations with high precision.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-accent" />
                <span>Gemini API Key *</span>
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-accent font-semibold hover:underline flex items-center space-x-1"
              >
                <span>Get free API key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <input
              type="password"
              required
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="clay-inset w-full px-3.5 py-2.5 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-accent" />
              <span>Gemini Model</span>
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="clay-inset w-full px-3.5 py-2.5 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent font-medium bg-[#eaf0f7]"
            >
              <option value="gemini-3.5-flash">gemini-3.5-flash (Fast & Structured)</option>
              <option value="gemini-3.8-flash">gemini-3.8-flash (Latest Flagship Flash)</option>
              <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Ultra Fast)</option>
              <option value="gemini-2.5-flash">gemini-2.5-flash (Standard Fallback)</option>
            </select>
          </div>

          {/* Test connection result */}
          {testResult && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-center space-x-2 font-medium shadow-clay-sm ${
                testResult.success
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                  : 'bg-rose-50 border border-rose-300 text-rose-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
            <button
              type="button"
              disabled={isTesting || !apiKey.trim()}
              onClick={handleTestConnection}
              className={`clay-btn-neutral px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 ${
                !apiKey.trim() || isTesting
                  ? 'opacity-50 cursor-not-allowed'
                  : 'text-slate-800'
              }`}
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                  <span>Testing...</span>
                </>
              ) : (
                <span>Test Connection</span>
              )}
            </button>

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="clay-btn-neutral px-4 py-2 rounded-xl text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="clay-btn-teal px-5 py-2 rounded-xl text-white text-xs font-bold flex items-center space-x-1.5"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Settings</span>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
