import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, RefreshCw, Lightbulb, CheckCircle2, Sparkles, ExternalLink, ChevronDown, ChevronUp, User, Globe, Target, Layout, BookOpen, ShieldCheck, ThumbsUp, ThumbsDown, MessageSquareShare } from "lucide-react";
import { toast } from "sonner";
import PromptAnatomy from "@/components/PromptAnatomy";

interface WizardInputs {
  role?: string;
  task?: string;
  context?: string;
  requirements?: string;
  tone?: string;
  aiModel?: string;
  outputFormat?: string;
  failedAttempts?: string;
  exampleOutput?: string;
  readerUsageContext?: string;
}

interface AuditDimension {
  score: number;
  feedback: string;
}

interface WhatIfVariation {
  label: string;
  why: string;
  action: string;
}

interface AuditResult {
  overall_score: number;
  grade: string;
  estimated_success_rate: string;
  dimensions: Record<string, AuditDimension>;
  strengths: string[];
  suggestions: string[];
  what_if_variations?: WhatIfVariation[];
  token_count?: number;
  estimated_cost?: string;
  model_check_warning?: string;
}

interface ResultLocationState {
  promptData?: WizardInputs;
  expertPrompt?: string;
  explanation?: string;
  quality_score?: AuditResult;
  fromHistory?: boolean;
}

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    promptData,
    expertPrompt: initialPrompt,
    explanation: initialExplanation,
    fromHistory,
  } = (location.state as ResultLocationState) || {};

  // Safe access to promptData properties to avoid runtime errors if state is missing
  const safePromptData: WizardInputs = useMemo(() => promptData ?? {}, [promptData]);

  const [showCelebration, setShowCelebration] = useState(!fromHistory);
  const [copied, setCopied] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [expertPrompt, setExpertPrompt] = useState(initialPrompt || "");
  const [explanation, setExplanation] = useState(initialExplanation || "");
  const [qualityScore, setQualityScore] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(!initialPrompt);
  const [error, setError] = useState("");
  const [isSaved, setIsSaved] = useState(!!fromHistory);
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});
  const [isRefining, setIsRefining] = useState(false);

  const toggleBlock = (blockKey: string) => {
    setExpandedBlocks(prev => ({ ...prev, [blockKey]: !prev[blockKey] }));
  };

  // Parse the generated prompt into its 6 named blocks
  const BLOCK_KEYS = ["IDENTITY", "CONTEXT", "TASK", "OUTPUT_STRUCTURE", "EXEMPLAR", "CONSTRAINT"] as const;
  type BlockKey = typeof BLOCK_KEYS[number];

  const parsePromptBlocks = (text: string): Record<BlockKey, string> | null => {
    const result = {} as Record<BlockKey, string>;
    let found = 0;
    for (let i = 0; i < BLOCK_KEYS.length; i++) {
      const key = BLOCK_KEYS[i];
      const header = key === "OUTPUT_STRUCTURE" ? "### [OUTPUT STRUCTURE]" : `### [${key}]`;
      const start = text.indexOf(header);
      if (start === -1) continue;
      const contentStart = start + header.length;
      // Find where next block starts, or end of string
      const nextHeaders = BLOCK_KEYS.slice(i + 1).map(k => k === "OUTPUT_STRUCTURE" ? "### [OUTPUT STRUCTURE]" : `### [${k}]`);
      let end = text.length;
      for (const nh of nextHeaders) {
        const pos = text.indexOf(nh, contentStart);
        if (pos !== -1 && pos < end) end = pos;
      }
      result[key] = text.slice(contentStart, end).trim();
      found++;
    }
    return found >= 4 ? result : null; // need at least 4 blocks to show annotated view
  };

  const BLOCK_META: Record<BlockKey, {
    label: string;
    icon: React.ElementType;
    accent: string;
    accentText: string;
    accentBg: string;
    technique: string;
    techniqueDesc: string;
    why: string;
    before: string;
    after: string;
    without: string;
    modify: string;
  }> = {
    IDENTITY: {
      label: t('result.teaching.blocks.IDENTITY.label'),
      icon: User,
      accent: "border-violet-500",
      accentText: "text-violet-600 dark:text-violet-400",
      accentBg: "bg-violet-50 dark:bg-violet-950/40",
      technique: t('result.teaching.blocks.IDENTITY.technique'),
      techniqueDesc: t('result.teaching.blocks.IDENTITY.techniqueDesc', { role: safePromptData.role || "AI Assistant" }),
      why: t('result.teaching.blocks.IDENTITY.why', { role: safePromptData.role || "AI Assistant" }),
      before: t('result.teaching.blocks.IDENTITY.before'),
      after: t('result.teaching.blocks.IDENTITY.after', { role: safePromptData.role || "AI Assistant", tone: safePromptData.tone || "Professional", task: safePromptData.task || "this task" }),
      without: t('result.teaching.blocks.IDENTITY.without'),
      modify: t('result.teaching.blocks.IDENTITY.modify'),
    },
    CONTEXT: {
      label: t('result.teaching.blocks.CONTEXT.label'),
      icon: Globe,
      accent: "border-blue-500",
      accentText: "text-blue-600 dark:text-blue-400",
      accentBg: "bg-blue-50 dark:bg-blue-950/40",
      technique: t('result.teaching.blocks.CONTEXT.technique'),
      techniqueDesc: t('result.teaching.blocks.CONTEXT.techniqueDesc'),
      why: t('result.teaching.blocks.CONTEXT.why'),
      before: t('result.teaching.blocks.CONTEXT.before'),
      after: t('result.teaching.blocks.CONTEXT.after', { context: safePromptData.context || "none provided", audience: safePromptData.context || "general public", usage: safePromptData.readerUsageContext || "direct use" }),
      without: t('result.teaching.blocks.CONTEXT.without'),
      modify: t('result.teaching.blocks.CONTEXT.modify'),
    },
    TASK: {
      label: t('result.teaching.blocks.TASK.label'),
      icon: Target,
      accent: "border-emerald-500",
      accentText: "text-emerald-600 dark:text-emerald-400",
      accentBg: "bg-emerald-50 dark:bg-emerald-950/40",
      technique: t('result.teaching.blocks.TASK.technique'),
      techniqueDesc: t('result.teaching.blocks.TASK.techniqueDesc'),
      why: t('result.teaching.blocks.TASK.why'),
      before: t('result.teaching.blocks.TASK.before', { task: safePromptData.task || "write this" }),
      after: t('result.teaching.blocks.TASK.after', { task: safePromptData.task || "write this" }),
      without: t('result.teaching.blocks.TASK.without'),
      modify: t('result.teaching.blocks.TASK.modify'),
    },
    OUTPUT_STRUCTURE: {
      label: t('result.teaching.blocks.OUTPUT_STRUCTURE.label'),
      icon: Layout,
      accent: "border-amber-500",
      accentText: "text-amber-600 dark:text-amber-400",
      accentBg: "bg-amber-50 dark:bg-amber-950/40",
      technique: t('result.teaching.blocks.OUTPUT_STRUCTURE.technique'),
      techniqueDesc: t('result.teaching.blocks.OUTPUT_STRUCTURE.techniqueDesc'),
      why: t('result.teaching.blocks.OUTPUT_STRUCTURE.why'),
      before: t('result.teaching.blocks.OUTPUT_STRUCTURE.before'),
      after: t('result.teaching.blocks.OUTPUT_STRUCTURE.after'),
      without: t('result.teaching.blocks.OUTPUT_STRUCTURE.without'),
      modify: t('result.teaching.blocks.OUTPUT_STRUCTURE.modify'),
    },
    EXEMPLAR: {
      label: t('result.teaching.blocks.EXEMPLAR.label'),
      icon: BookOpen,
      accent: "border-rose-500",
      accentText: "text-rose-600 dark:text-rose-400",
      accentBg: "bg-rose-50 dark:bg-rose-950/40",
      technique: t('result.teaching.blocks.EXEMPLAR.technique'),
      techniqueDesc: t('result.teaching.blocks.EXEMPLAR.techniqueDesc'),
      why: t('result.teaching.blocks.EXEMPLAR.why'),
      before: t('result.teaching.blocks.EXEMPLAR.before'),
      after: t('result.teaching.blocks.EXEMPLAR.after'),
      without: t('result.teaching.blocks.EXEMPLAR.without'),
      modify: t('result.teaching.blocks.EXEMPLAR.modify'),
    },
    CONSTRAINT: {
      label: t('result.teaching.blocks.CONSTRAINT.label'),
      icon: ShieldCheck,
      accent: "border-slate-500",
      accentText: "text-slate-600 dark:text-slate-400",
      accentBg: "bg-slate-50 dark:bg-slate-950/40",
      technique: t('result.teaching.blocks.CONSTRAINT.technique'),
      techniqueDesc: t('result.teaching.blocks.CONSTRAINT.techniqueDesc'),
      why: t('result.teaching.blocks.CONSTRAINT.why'),
      before: t('result.teaching.blocks.CONSTRAINT.before'),
      after: t('result.teaching.blocks.CONSTRAINT.after'),
      without: t('result.teaching.blocks.CONSTRAINT.without'),
      modify: t('result.teaching.blocks.CONSTRAINT.modify'),
    },
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowCelebration(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!promptData) {
      navigate("/");
    }
  }, [promptData, navigate]);


  const saveSession = useCallback(async (prompt: string, reason: string) => {
    if (!user || isSaved || fromHistory) return;

    try {
      console.log("Saving session to database...");
      const { error } = await supabase.from("prompt_sessions").insert({
        user_id: user.id,
        ai_model: safePromptData.aiModel || "ChatGPT",
        generated_prompt: prompt,
        explanation: reason,
        wizard_inputs: {
          role: safePromptData.role,
          task: safePromptData.task,
          context: safePromptData.context,
          constraints: safePromptData.requirements,
          tone: safePromptData.tone
        }
      });

      if (error) throw error;
      setIsSaved(true);
      console.log("Session saved successfully!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error saving session:", errorMessage);
    }
  }, [user, isSaved, fromHistory, safePromptData]);

  const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  // Function to fetch the enhanced prompt from backend
  const fetchExpertPrompt = useCallback(async () => {
    if (initialPrompt) return; // Don't fetch if we already have it (from history)

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      setLoading(true);
      setError("");

      console.log("🚀 [Frontend] Initiating API call to backend...");

      const response = await fetch(`${apiUrl}/api/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [],
          target_model: safePromptData.aiModel || "ChatGPT",
          mode: "visual",
          role: safePromptData.role,
          task: safePromptData.task,
          context: safePromptData.context,
          constraints: safePromptData.requirements,
          tone: safePromptData.tone,
          output_format: safePromptData.outputFormat,
          failed_attempts: safePromptData.failedAttempts,
          example_output: safePromptData.exampleOutput,
          reader_usage_context: safePromptData.readerUsageContext,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setExpertPrompt(data.expert_prompt);
      setExplanation(data.explanation);
      setQualityScore(data.quality_score);

      // Remove direct save here to avoid race conditions. 
      // The new useEffect below handles saving once user + prompt are both ready.
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error && err.name === 'AbortError') {
        setError("Request timed out. The AI service is taking too long.");
        toast.error("Generation timed out. Please try again.");
      } else {
        setError("Something went wrong. Please ensure the backend is running.");
        toast.error("Failed to connect to backend.");
      }
    } finally {
      setLoading(false);
      clearTimeout(timeoutId);
    }
  }, [initialPrompt, safePromptData, apiUrl]);

  const [hasStartedFetch, setHasStartedFetch] = useState(false);

  useEffect(() => {
    if (promptData && !initialPrompt && !hasStartedFetch) {
      setHasStartedFetch(true);
      fetchExpertPrompt();
    }
  }, [promptData, initialPrompt, hasStartedFetch, fetchExpertPrompt]);

  // FIX: Reactive Save Effect 
  // Watch for when User AND ExpertPrompt are both available
  useEffect(() => {
    if (user && expertPrompt && explanation && !isSaved && !fromHistory) {
      saveSession(expertPrompt, explanation);
    }
  }, [user, expertPrompt, explanation, isSaved, fromHistory, saveSession]);


  // Use the fetched prompt, or fall back to empty string while loading
  const prompt = expertPrompt;

  const handleCopy = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success("Copied to clipboard!", {
        description: "Now paste it into your AI tool and watch the magic happen!",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefineVariation = async (variation: WhatIfVariation) => {
    setIsRefining(true);
    toast.info(`Applying Strategy: ${variation.label}`, {
      description: "Recalibrating the architecture..."
    });
    
    try {
      const response = await fetch(`${apiUrl}/api/v1/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_prompt: expertPrompt,
          framework_suggestion: variation.action,
          target_model: safePromptData.aiModel || "ChatGPT",
          task_category: "general"
        }),
      });

      if (!response.ok) throw new Error("Refinement failed");
      
      const data = await response.json();
      setExpertPrompt(data.expert_prompt);
      setExplanation(data.explanation);
      setQualityScore(data.quality_score);
      toast.success("Refined successfully!");
    } catch (err) {
      toast.error("Failed to refine prompt.");
    } finally {
      setIsRefining(false);
    }
  };

  const handleFeedback = (blockKey: string, type: 'up' | 'down') => {
    setFeedback(prev => ({ ...prev, [blockKey]: type }));
    toast.success(type === 'up' ? "Awesome! We'll use this signal." : "Got it. We'll adjust the constraints.", {
      icon: type === 'up' ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />
    });
  };

  const handleRefine = () => {
    navigate("/wizard", { state: { promptData } });
  };

  const handleExplain = () => {
    setShowExplanation(!showExplanation);
  };

  const aiUrls: Record<string, string> = {
    ChatGPT: "https://chat.openai.com",
    Claude: "https://claude.ai",
    Gemini: "https://gemini.google.com",
    Mistral: "https://chat.mistral.ai",
    Nous: "https://nous.chat",
    DeepSeek: "https://chat.deepseek.com",
    Perplexity: "https://www.perplexity.ai",
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Celebration Banner */}
        {showCelebration && (
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-4 px-4 text-center animate-fade-in shadow-lg">
            <div className="flex items-center justify-center gap-2 font-semibold">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span>Success! Your prompt is ready to use</span>
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="grid lg:grid-cols-1 xl:grid-cols-[1fr,400px] gap-8 max-w-7xl mx-auto">
            {/* Main Content */}
            <div className="space-y-8 sm:space-y-10">
              {/* Header */}
              {loading ? (
                <div className="text-center py-20 space-y-6">
                  <div className="relative w-24 h-24 mx-auto">
                    <Sparkles className="w-24 h-24 text-primary animate-spin" />
                  </div>
                  <h2 className="text-3xl font-extrabold animate-pulse tracking-tight">Generating your masterpiece...</h2>
                  <p className="text-lg text-muted-foreground">The Alchemist is brewing your prompt.</p>
                </div>
              ) : error ? (
                <div className="text-center py-12 space-y-6 border-2 border-destructive/20 rounded-3xl bg-destructive/5 p-8 shadow-inner">
                  <h2 className="text-3xl font-extrabold text-destructive flex items-center justify-center gap-3">
                    <Sparkles className="w-8 h-8 rotate-180" />
                    Generation Failed
                  </h2>
                  <p className="text-foreground font-mono text-sm bg-muted/80 p-4 rounded-xl border-2 border-dashed">{error}</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      size="lg"
                      variant="default"
                      onClick={() => fetchExpertPrompt()}
                      className="px-8 font-bold"
                    >
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Try Again
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => window.open(apiUrl, '_blank')}
                      className="px-8 font-bold"
                    >
                      Check Backend Status
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 animate-fade-in text-center sm:text-left">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                    <span className="inline-flex items-center gap-3 sm:flex-row flex-col">
                      <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                      {t('result.title')}
                    </span>
                  </h1>
                  <p className="text-muted-foreground text-lg sm:text-xl font-medium max-w-2xl">
                    {t('result.subtitle', { aiModel: safePromptData.aiModel || "your AI tool" })}
                  </p>
                  <p className="text-sm text-muted-foreground/70 max-w-2xl bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 inline-block">
                    {t('result.pasteTip', { aiModel: safePromptData.aiModel || "the AI" })}
                  </p>
                </div>
              )}

              {/* Primary Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={handleCopy}
                  className={`relative overflow-hidden font-bold h-auto py-4 sm:py-6 text-lg sm:text-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95 transition-all flex-1 rounded-xl sm:rounded-2xl border border-white/10 ${copied ? 'bg-green-500 hover:bg-green-600' : 'bg-primary hover:bg-primary/90'}`}
                >
                  <div className="flex items-center justify-center gap-2 sm:gap-3 z-10">
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 sm:w-7 sm:h-7 animate-in zoom-in spin-in-50 duration-300" />
                        <span>{t('result.copiedButton')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 sm:w-7 sm:h-7" />
                        <span className="sm:hidden">{t('result.copyShort')}</span>
                        <span className="hidden sm:inline">{t('result.copyMain')}</span>
                      </>
                    )}
                  </div>
                </Button>
                {copied && safePromptData.aiModel && aiUrls[safePromptData.aiModel] && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      const url = safePromptData.aiModel ? aiUrls[safePromptData.aiModel] : undefined;
                      if (url) window.open(url, '_blank');
                    }}
                    className="font-bold h-auto py-4 sm:py-6 text-lg sm:text-2xl shadow-lg border-2 border-primary/20 hover:border-primary hover:bg-primary/5 active:scale-95 transition-all flex-1 rounded-xl sm:rounded-2xl shrink-0 animate-in slide-in-from-left-2 fade-in duration-300"
                  >
                    Open in {safePromptData.aiModel}
                    <ExternalLink className="ml-2 w-5 h-5 sm:w-7 sm:h-7" />
                  </Button>
                )}
              </div>

              {/* Prompt Display — Annotated 6-Block Breakdown */}
              {(() => {
                const blocks = parsePromptBlocks(prompt);
                if (!blocks) {
                  // Fallback: raw display if prompt doesn't have the expected structure
                  return (
                    <Card className="border-2 shadow-card">
                      <CardContent className="pt-6 pb-6">
                        <pre className="text-sm font-mono whitespace-pre-wrap bg-muted/50 p-6 rounded-lg overflow-x-auto border-2 border-dashed">
                          {prompt}
                        </pre>
                      </CardContent>
                    </Card>
                  );
                }
                return (
                  <div className="space-y-3">
                    {BLOCK_KEYS.map((key) => {
                      const content = blocks[key];
                      if (!content) return null;
                      const meta = BLOCK_META[key];
                      const Icon = meta.icon;
                      const isExpanded = expandedBlocks[key] ?? false;
                      return (
                        <div key={key} className={`rounded-xl border-l-4 ${meta.accent} border border-border/60 overflow-hidden`}>
                          {/* Block header */}
                          <div className={`px-5 py-3 flex items-center gap-3 ${meta.accentBg}`}>
                            <Icon className={`w-4 h-4 flex-shrink-0 ${meta.accentText}`} />
                            <span className={`text-xs font-bold tracking-widest uppercase ${meta.accentText}`}>
                              {meta.label}
                            </span>
                          </div>
                          {/* Block content */}
                          <div className="px-5 py-4 bg-card">
                            <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-foreground/90">
                              {content}
                            </pre>
                          </div>
                          {/* Teaching panel toggle */}
                          <div className="border-t border-border/40">
                            <button
                              onClick={() => toggleBlock(key)}
                              className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-muted/40 transition-colors text-left group"
                              aria-expanded={isExpanded}
                            >
                              <div className="flex items-center gap-2">
                                <Lightbulb className={`w-3.5 h-3.5 ${meta.accentText}`} />
                                <span className={`text-xs font-semibold ${meta.accentText} group-hover:underline`}>
                                  {t('result.teaching.trigger')}
                                </span>
                              </div>
                              {isExpanded
                                ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                            </button>
                            {isExpanded && (
                              <div className={`border-t border-border/30 ${meta.accentBg}`}>
                                {/* Technique */}
                                <div className="px-5 pt-4 pb-3 space-y-1.5">
                                  <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{t('result.teaching.labels.technique')}</p>
                                  <p className={`text-sm font-bold ${meta.accentText}`}>💡 {meta.technique}</p>
                                  <p className="text-sm text-muted-foreground leading-relaxed">{meta.techniqueDesc}</p>
                                </div>
                                {/* Why it works */}
                                <div className="px-5 py-4 space-y-2 border-t border-border/20">
                                  <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{t('result.teaching.labels.why')}</p>
                                  <p className="text-sm text-muted-foreground leading-relaxed">{meta.why}</p>
                                </div>
                                {/* Before vs After comparison */}
                                <div className="px-5 py-4 space-y-4 border-t border-border/20 bg-muted/20">
                                  <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                      <p className="text-[9px] font-bold tracking-widest uppercase text-muted-foreground/70">Before (Generic)</p>
                                      <div className="bg-background/80 border border-border/50 rounded-lg p-3 text-[11px] font-mono text-muted-foreground italic line-through decoration-destructive/30">
                                        {meta.before}
                                      </div>
                                    </div>
                                    <div className="space-y-1.5">
                                      <p className={`text-[9px] font-bold tracking-widest uppercase ${meta.accentText}`}>After (Optimized)</p>
                                      <div className={`bg-background border ${meta.accent} border-opacity-30 rounded-lg p-3 text-[11px] font-mono ${meta.accentText} whitespace-pre-wrap`}>
                                        {meta.after}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {/* Without this */}
                                <div className="px-5 py-4 space-y-2 border-t border-border/20 bg-destructive/5">
                                  <p className="text-[10px] font-bold tracking-widest uppercase text-destructive/60">{t('result.teaching.labels.without')}</p>
                                  <p className="text-sm text-muted-foreground leading-relaxed">{meta.without}</p>
                                </div>
                                {/* How to modify */}
                                <div className="px-5 pt-3 pb-4 space-y-1.5 border-t border-border/20">
                                  <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">{t('result.teaching.labels.modify')}</p>
                                  <p className="text-sm text-muted-foreground leading-relaxed">{meta.modify}</p>
                                </div>
                              </div>
                            )}

                            {/* Block feedback */}
                            <div className="flex items-center gap-4 py-2 border-t border-border/10 bg-background/20 px-5">
                              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Was this block helpful?</span>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className={`h-7 w-7 ${feedback[key] === 'up' ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted-foreground/50 hover:text-emerald-500'}`}
                                  onClick={(e) => { e.stopPropagation(); handleFeedback(key, 'up'); }}
                                >
                                  <ThumbsUp className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className={`h-7 w-7 ${feedback[key] === 'down' ? 'text-rose-500 bg-rose-500/10' : 'text-muted-foreground/50 hover:text-rose-500'}`}
                                  onClick={(e) => { e.stopPropagation(); handleFeedback(key, 'down'); }}
                                >
                                  <ThumbsDown className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Strategy: What If Section */}
              {qualityScore?.what_if_variations && qualityScore.what_if_variations.length > 0 && (
                <div className="mt-12 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border"></div>
                    <div className="flex items-center gap-2 text-muted-foreground px-4">
                      <RefreshCw className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">Strategy: What if we shifted the approach?</span>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border"></div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    {qualityScore.what_if_variations.map((v, idx) => (
                      <button
                        key={idx}
                        disabled={isRefining}
                        onClick={() => handleRefineVariation(v)}
                        className="group relative flex flex-col items-start text-left p-5 rounded-2xl border border-border bg-card/50 hover:bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 disabled:opacity-50"
                      >
                        <div className="mb-3 p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          {idx === 0 ? <Target className="w-4 h-4" /> : idx === 1 ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-1">
                          {v.label}
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {v.why}
                        </p>
                        {isRefining && (
                          <div className="absolute inset-0 bg-background/50 rounded-2xl flex items-center justify-center">
                            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Secondary Actions */}
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={handleRefine}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refine Prompt
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExplain}
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  {showExplanation ? "Hide" : "Explain"} Prompt
                </Button>
              </div>

              {/* Explanation */}
              {showExplanation && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6 pb-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      Understanding Your Prompt
                    </h3>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div className="whitespace-pre-wrap font-medium text-foreground/90 leading-relaxed">
                        {explanation || "The Alchemist is generating your personal explanation..."}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tips */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6 pb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Pro Tips for Best Results
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Paste the entire prompt — don't skip any sections</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>If you don't like the first response, click "regenerate" in your AI tool</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Save this prompt for reuse — you can tweak small details each time</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block lg:sticky lg:top-8 h-fit">
              <PromptAnatomy promptData={safePromptData} currentStep={6} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Result;
