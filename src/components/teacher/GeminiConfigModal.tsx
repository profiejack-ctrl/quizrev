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
      <div className="bg-ground border border-border rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-surface flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-light text-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-semibold text-ink leading-tight">
                Gemini AI Agent Configuration
              </h3>
              <p className="text-xs text-ink-muted">
                Intelligent Exam Parsing & Answer Key Mapping
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
        <form onSubmit={handleSave} className="p-6 space-y-4">
          
          {/* Info Banner */}
          <div className="p-3.5 bg-accent-light/40 border border-accent/20 rounded-xl text-xs text-ink space-y-1">
            <p className="font-semibold text-accent flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Assessment Specialist</span>
            </p>
            <p className="text-ink-muted leading-relaxed">
              Gemini analyzes uploaded DOCX and PDF exams, identifies questions and choices, and maps answer keys and explanations with near 100% accuracy.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Key className="w-3.5 h-3.5 text-ink-muted" />
                <span>Gemini API Key *</span>
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-accent hover:underline flex items-center space-x-1"
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-accent font-mono bg-surface"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1.5 flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-ink-muted" />
              <span>Gemini Model</span>
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:border-accent bg-surface"
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
              className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                testResult.success
                  ? 'bg-positive-bg/50 border-positive/30 text-positive-ink'
                  : 'bg-negative-bg/50 border-negative/30 text-negative-ink'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-positive flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-negative flex-shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-rule">
            <button
              type="button"
              disabled={isTesting || !apiKey.trim()}
              onClick={handleTestConnection}
              className={`px-3.5 py-2 rounded-control border border-border text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                !apiKey.trim() || isTesting
                  ? 'opacity-50 cursor-not-allowed bg-surface text-ink-muted'
                  : 'bg-ground hover:bg-surface text-ink'
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

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-control border border-border text-xs font-medium text-ink hover:bg-surface"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-control bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors shadow-sm flex items-center space-x-1.5"
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
